// Smoke test: start the server over stdio with the real MCP client and exercise the cheap tools.
//   npx tsx mcp/smoke.ts
import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const main = async () => {
  const client = new Client({ name: "smoke", version: "0" });
  await client.connect(
    new StdioClientTransport({
      command: "node",
      args: ["mcp/start.mjs"],
      env: process.env as Record<string, string>, // the SDK passes only a safe subset by default
    }),
  );
  const names = (await client.listTools()).tools.map((t) => t.name).sort();
  assert.deepEqual(names, [
    "build_video",
    "check_spec",
    "get_job",
    "list_outputs",
    "make_voiceover",
    "preview_stills",
  ]);

  const body = (r: Awaited<ReturnType<typeof client.callTool>>) =>
    JSON.parse((r.content as { text: string }[])[0].text);
  assert.equal(
    body(await client.callTool({ name: "check_spec", arguments: {} })).ok,
    true,
  );
  const bad = {
    meta: { fps: 30, width: 1920, height: 1080, slug: "bad" },
    scenes: [
      {
        id: "s01-x",
        startSec: 0,
        endSec: 2,
        voiceover: "one two three four five six seven",
      },
    ],
  };
  const badBody = body(
    await client.callTool({ name: "check_spec", arguments: { spec: bad } }),
  );
  assert.equal(badBody.ok, false);
  assert.ok(badBody.warnings.some((w: string) => w.includes("motion intent")));
  const escape = await client.callTool({
    name: "check_spec",
    arguments: { specPath: "../../etc/passwd" },
  });
  assert.equal(escape.isError, true);
  assert.ok(
    Array.isArray(
      body(await client.callTool({ name: "list_outputs", arguments: {} })),
    ),
  );
  // Full path to the contact sheet: start the job, poll, expect the sheet back as an image.
  const job = body(
    await client.callTool({ name: "preview_stills", arguments: {} }),
  );
  if (job.status !== "installing") {
    let r;
    for (let i = 0; i < 120; i++) {
      r = await client.callTool({
        name: "get_job",
        arguments: { jobId: job.jobId },
      });
      if (body(r).status !== "running") break;
      await new Promise((ok) => setTimeout(ok, 1000));
    }
    assert.equal(body(r!).status, "done", body(r!).logTail);
    assert.ok(
      (r!.content as { type: string }[]).some((c) => c.type === "image"),
    );
  }
  await client.close();
  console.log("mcp smoke ok:", names.join(", "));
};
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
