import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import {enableTailwind} from '@remotion/tailwind-v4';
import {spawnSync} from 'node:child_process';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import 'dotenv/config';

const arg = (k: string, d: string) => {
	const i = process.argv.indexOf(`--${k}`);
	return i > 0 ? process.argv[i + 1] : d;
};
const specPath = arg('spec', 'data/templates/video-spec.json');
const comp = arg('comp', 'PromoVideo');
const spec = JSON.parse(readFileSync(specPath, 'utf8'));
const slug: string = spec.meta.slug;
mkdirSync('out', {recursive: true});
mkdirSync('data/outputs', {recursive: true});
const raw = `out/raw_${comp}.mp4`;
const t0 = Date.now();

const run = (cmd: string, args: string[]) =>
	spawnSync(cmd, args, {encoding: 'utf8', maxBuffer: 1 << 28});

const main = async () => {
	const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE ?? null;
	const serveUrl = await bundle({
		entryPoint: path.resolve('src/app/index.ts'),
		webpackOverride: enableTailwind,
	});
	const composition = await selectComposition({serveUrl, id: comp, inputProps: spec, browserExecutable});
	await renderMedia({
		composition,
		serveUrl,
		codec: 'h264',
		outputLocation: raw,
		inputProps: spec,
		browserExecutable,
	});
	const renderSeconds = (Date.now() - t0) / 1000;
	const {width: W, height: H} = composition;

	const hasAudio = run('ffprobe', ['-v', 'error', '-select_streams', 'a', '-show_entries', 'stream=index', '-of', 'csv=p=0', raw]).stdout.trim() !== '';
	const out = `out/${slug}_${W}x${H}.mp4`;
	const vf = 'scale=in_range=full:out_range=tv,format=yuv420p';
	const enc = run('ffmpeg', [
		'-y', '-i', raw,
		...(hasAudio ? [] : ['-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo']),
		'-vf', vf, '-c:v', 'libx264', '-crf', '17',
		...(hasAudio ? ['-af', 'loudnorm=I=-14:TP=-2:LRA=11'] : ['-shortest']),
		'-ar', '48000', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', out,
	]);
	if (enc.status !== 0) throw new Error(`ffmpeg failed: ${enc.stderr.slice(-2000)}`);

	// probe checks spec.meta width/height, so give it the composition's real size
	const tmpSpec = `out/.probe_spec_${comp}.json`;
	writeFileSync(tmpSpec, JSON.stringify({...spec, meta: {...spec.meta, width: W, height: H}}));
	const pr = run('python3', ['skills/render-qa/scripts/probe.py', out, '--spec', tmpSpec]);
	let probe: unknown;
	try { probe = JSON.parse(pr.stdout); } catch { probe = {error: pr.stdout + pr.stderr}; }

	const d = new Date();
	const p = (n: number) => String(n).padStart(2, '0');
	const ts = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
	const manifest = `data/outputs/${slug}_${comp}_${ts}.json`;
	const remotionVersion = JSON.parse(readFileSync('node_modules/remotion/package.json', 'utf8')).version;
	writeFileSync(manifest, JSON.stringify({spec: specPath, composition: comp, output: out, remotionVersion, renderSeconds, probe}, null, 2));
	console.log(JSON.stringify(probe));
	console.log(`output ${out}\nmanifest ${manifest}`);
};

main().catch((e) => { console.error(e); process.exit(1); });
