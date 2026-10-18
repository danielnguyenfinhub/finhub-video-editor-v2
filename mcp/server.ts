// FinHub video studio MCP server.
//   stdio (Cowork plugin, local):  tsx mcp/server.ts
//   HTTP (hosted connector):       tsx mcp/server.ts --http   (PORT, MCP_AUTH_TOKEN required)
// Tools wrap the repo's existing scripts; nothing here re-implements the pipeline.
import { spawn, spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import {
  createReadStream,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:http";
import { basename, dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import dotenv from "dotenv";
import { z } from "zod";

const ROOT =
  process.env.STUDIO_DIR ||
  resolve(dirname(fileURLToPath(import.meta.url)), "..");
// Desktop apps don't inherit shell env vars, so API keys can live in <studio>/.env (git-ignored).
dotenv.config({ path: join(ROOT, ".env"), quiet: true });
const WS = join(ROOT, "_workspace", "mcp");
mkdirSync(WS, { recursive: true });

const text = (data: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
    },
  ],
});
const run = (cmd: string, args: string[]) => {
  const r = spawnSync(cmd, args, {
    cwd: ROOT,
    encoding: "utf8",
    env: process.env,
    maxBuffer: 32 * 1024 * 1024,
  });
  return {
    code: r.status ?? 1,
    out: (r.stdout ?? "").trim(),
    err: (r.stderr ?? "").trim(),
  };
};

// A spec arrives inline (remote clients have no files on this machine) or as a repo-relative path.
const SpecInput = {
  spec: z
    .record(z.string(), z.unknown())
    .optional()
    .describe("Scene spec JSON (see data/templates/video-spec.json)"),
  specPath: z
    .string()
    .optional()
    .describe(
      "Repo-relative path to a spec file; default data/templates/video-spec.json",
    ),
};
const specFile = ({
  spec,
  specPath,
}: {
  spec?: Record<string, unknown>;
  specPath?: string;
}) => {
  if (spec) {
    const slug = String(
      (spec.meta as { slug?: string } | undefined)?.slug ?? "spec",
    ).replace(/[^a-z0-9-]/gi, "-");
    const f = join(WS, `${slug}.json`);
    writeFileSync(f, JSON.stringify(spec, null, 2));
    return f;
  }
  const f = resolve(ROOT, specPath ?? "data/templates/video-spec.json");
  // Trust boundary: a remote caller must not point the pipeline at files outside the studio.
  if (!f.startsWith(ROOT + sep) || !existsSync(f))
    throw new Error(`spec not found inside the studio: ${specPath}`);
  return f;
};

// ponytail: jobs live in memory; a restart forgets running jobs, but finished manifests stay in data/outputs.
type Job = {
  status: "running" | "done" | "failed";
  log: string;
  started: string;
  comp: string;
};
const jobs = new Map<string, Job>();

const build = () => {
  const s = new McpServer({ name: "finhub-video-studio", version: "0.1.0" });

  s.registerTool(
    "check_spec",
    {
      title: "Validate a scene spec",
      description:
        "Check a scene spec before spending credits: contiguous scenes, ≤2.5 words/sec voiceover pace, sNN-kebab ids, and credit/rate language without a compliance disclaimer.",
      inputSchema: SpecInput,
    },
    async (a) => {
      const r = run("python3", [
        "skills/video-studio/scripts/check_spec.py",
        specFile(a),
      ]);
      return text({
        ok: r.code === 0,
        problems: r.code === 0 ? [] : r.out.split("\n"),
      });
    },
  );

  s.registerTool(
    "make_voiceover",
    {
      title: "Generate voiceover and word timings",
      description:
        "Join the spec voiceovers, voice them (Gemini Charon, then ElevenLabs, then OpenAI) and align words with Whisper into public/voice.mp3 + public/words.json. Spends API credits.",
      inputSchema: {
        ...SpecInput,
        voice: z.string().optional(),
        provider: z.enum(["auto", "gemini", "elevenlabs", "openai"]).optional(),
      },
    },
    async (a) => {
      const spec = JSON.parse(readFileSync(specFile(a), "utf8")) as {
        scenes: { voiceover?: string }[];
      };
      const script = join(WS, "voiceover.txt");
      writeFileSync(
        script,
        spec.scenes.map((x) => x.voiceover ?? "").join("\n\n"),
      );
      const args = [
        "skills/voice-captions/scripts/voiceover.py",
        "--text",
        script,
        "--out",
        "public",
        "--provider",
        a.provider ?? "auto",
      ];
      if (a.voice) args.push("--voice", a.voice);
      const r = run("python3", args);
      return text({ ok: r.code === 0, result: r.out || r.err });
    },
  );

  s.registerTool(
    "build_video",
    {
      title: "Render, master and QA-probe a video",
      description:
        "Start a background render of PromoVideo (16:9) or PromoVideo-9x16: Remotion render, FFmpeg master (-14 LUFS), probe checks, manifest in data/outputs. Takes 2–3 minutes; poll get_job with the returned jobId.",
      inputSchema: {
        ...SpecInput,
        comp: z.enum(["PromoVideo", "PromoVideo-9x16"]).default("PromoVideo"),
      },
    },
    async (a) => {
      // The launcher installs render dependencies in the background on first run.
      if (!existsSync(join(ROOT, "node_modules", ".bin", "tsx")))
        return text({
          status: "installing",
          message:
            "The studio is still installing its render dependencies (first run, 1–2 minutes). Try again shortly.",
        });
      const id = randomUUID().slice(0, 8);
      const job: Job = {
        status: "running",
        log: "",
        started: new Date().toISOString(),
        comp: a.comp,
      };
      jobs.set(id, job);
      const p = spawn(
        "npx",
        ["tsx", "pipelines/render.ts", "--spec", specFile(a), "--comp", a.comp],
        { cwd: ROOT, env: process.env },
      );
      const add = (b: Buffer) => {
        job.log = (job.log + b.toString()).slice(-20000);
      };
      p.stdout.on("data", add);
      p.stderr.on("data", add);
      p.on("close", (code) => {
        job.status = code === 0 ? "done" : "failed";
      });
      return text({ jobId: id, status: "running" });
    },
  );

  s.registerTool(
    "get_job",
    {
      title: "Check a render job",
      description:
        "Status of a build_video job; when done, includes the output path, manifest and probe result.",
      inputSchema: { jobId: z.string() },
    },
    async ({ jobId }) => {
      const j = jobs.get(jobId);
      if (!j)
        return text({
          error: `unknown job ${jobId} (server restarted?); see list_outputs`,
        });
      const m = j.log.match(/output (\S+)\nmanifest (\S+)/);
      const manifest =
        m && existsSync(join(ROOT, m[2]))
          ? JSON.parse(readFileSync(join(ROOT, m[2]), "utf8"))
          : null;
      return text({
        jobId,
        status: j.status,
        comp: j.comp,
        started: j.started,
        output: m?.[1],
        manifest,
        logTail: j.status === "done" ? undefined : j.log.slice(-2000),
      });
    },
  );

  s.registerTool(
    "list_outputs",
    {
      title: "List rendered videos",
      description:
        "Finished renders from their manifests: composition, output MP4, render time and failed probe checks.",
      inputSchema: {},
    },
    async () => {
      const dir = join(ROOT, "data", "outputs");
      const rows = existsSync(dir)
        ? readdirSync(dir)
            .filter((f) => f.endsWith(".json"))
            .sort()
            .reverse()
            .map((f) => {
              const d = JSON.parse(readFileSync(join(dir, f), "utf8"));
              return {
                manifest: `data/outputs/${f}`,
                composition: d.composition,
                output: d.output,
                renderSeconds: d.renderSeconds,
                pass: d.probe?.pass,
                failed: (d.probe?.checks ?? [])
                  .filter((c: { ok: boolean }) => !c.ok)
                  .map(
                    (c: { name: string; detail: string }) =>
                      `${c.name}: ${c.detail}`,
                  ),
              };
            })
        : [];
      return text(rows);
    },
  );

  return s;
};

if (process.argv.includes("--http")) {
  const token = process.env.MCP_AUTH_TOKEN;
  if (!token) throw new Error("MCP_AUTH_TOKEN is required in --http mode");
  createServer(async (req, res) => {
    if (req.headers.authorization !== `Bearer ${token}`) {
      res.writeHead(401).end();
      return;
    }
    // Rendered files are downloadable by name: GET /files/<name>.mp4
    const file = req.url?.match(/^\/files\/([\w.-]+\.mp4)$/)?.[1];
    if (req.method === "GET" && file) {
      const f = join(ROOT, "out", basename(file));
      if (!existsSync(f)) {
        res.writeHead(404).end();
        return;
      }
      res.writeHead(200, {
        "content-type": "video/mp4",
        "content-length": statSync(f).size,
      });
      createReadStream(f).pipe(res);
      return;
    }
    if (req.url !== "/mcp") {
      res.writeHead(404).end();
      return;
    }
    // Stateless: a fresh server + transport per request; job state is module-level so it survives.
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    res.on("close", () => transport.close());
    await build().connect(transport);
    await transport.handleRequest(req, res);
  }).listen(Number(process.env.PORT ?? 8787));
} else {
  build()
    .connect(new StdioServerTransport())
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
