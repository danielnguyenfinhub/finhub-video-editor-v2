// One still per scene + a contact sheet, for approval before the full render.
//   npx tsx pipelines/stills.ts --spec <spec.json> --comp PromoVideo [--at 0.8]
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';
import {enableTailwind} from '@remotion/tailwind-v4';
import {spawnSync} from 'node:child_process';
import {mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import 'dotenv/config';

const arg = (k: string, d: string) => {
	const i = process.argv.indexOf(`--${k}`);
	return i > 0 ? process.argv[i + 1] : d;
};
const specPath = arg('spec', 'data/templates/video-spec.json');
const comp = arg('comp', 'PromoVideo');
// Late in the scene so entrance motion has settled, but before the cut.
const at = Number(arg('at', '0.8'));
const spec = JSON.parse(readFileSync(specPath, 'utf8'));
const scenes: {id: string; startSec: number; endSec: number}[] = spec.scenes;
const name = `${spec.meta.slug}_${comp}`;
const dir = `out/stills/${name}`;

const main = async () => {
	rmSync(dir, {recursive: true, force: true});
	mkdirSync(dir, {recursive: true});
	const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE ?? null;
	const serveUrl = await bundle({entryPoint: path.resolve('src/app/index.ts'), webpackOverride: enableTailwind});
	const composition = await selectComposition({serveUrl, id: comp, inputProps: spec, browserExecutable});
	const browser = await openBrowser('chrome', {browserExecutable});
	const stills = [];
	try {
		for (const [i, s] of scenes.entries()) {
			const frame = Math.min(
				composition.durationInFrames - 1,
				Math.round((s.startSec + at * (s.endSec - s.startSec)) * composition.fps),
			);
			const file = `${dir}/${String(i + 1).padStart(2, '0')}-${s.id}.png`;
			await renderStill({composition, serveUrl, output: file, frame, inputProps: spec, puppeteerInstance: browser});
			stills.push({id: s.id, frame, sec: +(frame / composition.fps).toFixed(2), file});
		}
	} finally {
		await browser.close({silent: true});
	}

	// Grid in scene order; tiles 640 px wide keep the sheet small enough to return inline over MCP.
	const cols = Math.min(stills.length, 3);
	const rows = Math.ceil(stills.length / cols);
	const sheet = `out/${name}_stills.jpg`;
	const r = spawnSync('ffmpeg', [
		'-y', ...stills.flatMap((s) => ['-i', s.file]),
		'-filter_complex', `${stills.map((_, i) => `[${i}:v]`).join('')}concat=n=${stills.length}:v=1:a=0,scale=640:-2,tile=${cols}x${rows}:padding=8:color=white`,
		'-frames:v', '1', '-q:v', '3', sheet,
	], {encoding: 'utf8'});
	if (r.status !== 0) throw new Error(`ffmpeg contact sheet failed: ${r.stderr.slice(-2000)}`);
	writeFileSync(`${dir}/stills.json`, JSON.stringify({spec: specPath, composition: comp, sheet, stills}, null, 2));
	console.log(`sheet ${sheet}\nstills ${dir}/stills.json`);
};

main().catch((e) => { console.error(e); process.exit(1); });
