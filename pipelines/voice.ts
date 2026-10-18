// npx tsx pipelines/voice.ts [--spec data/templates/video-spec.json] [--voice <id>] [--out public/voice.mp3]
import 'dotenv/config';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { Readable } from 'node:stream';

type Scene = { id: string; startSec: number; endSec: number; voiceover?: string };
type Spec = { meta?: { voice?: { voiceId?: string | null } }; scenes: Scene[] };

const argv = process.argv.slice(2);
const arg = (k: string, d: string) => {
  const i = argv.indexOf(`--${k}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
};
const fail = (msg: string): never => {
  console.error(msg);
  process.exit(1);
};

const spec: Spec = JSON.parse(readFileSync(arg('spec', 'data/templates/video-spec.json'), 'utf8'));
const out = arg('out', 'public/voice.mp3');
const voiceId = arg('voice', spec.meta?.voice?.voiceId || 'JBFqnCBsd6RMkjVDRZzb');

// Pace check before spending credits.
const bad = spec.scenes
  .map((s) => ({ id: s.id, words: (s.voiceover ?? '').split(/\s+/).filter(Boolean).length, max: 2.5 * (s.endSec - s.startSec) }))
  .filter((s) => s.words > s.max);
if (bad.length) fail(`Pace check failed (words > 2.5 x seconds):\n${bad.map((s) => `  ${s.id}: ${s.words} words, max ${s.max}`).join('\n')}`);

const text = spec.scenes.map((s) => (s.voiceover ?? '').trim()).filter(Boolean).join('\n\n');
mkdirSync('_workspace', { recursive: true });
writeFileSync('_workspace/03_audio_script.txt', text + '\n');

const apiKey = process.env.ELEVENLABS_API_KEY ?? '';
if (!apiKey.startsWith('sk_')) fail('ELEVENLABS_API_KEY is a key ID, not an API key (expected an "sk_..." value). Not calling the API.');

async function main() {
  const client = new ElevenLabsClient({ apiKey });
  const stream = await client.textToSpeech.convert(voiceId, {
    text,
    modelId: 'eleven_multilingual_v2',
    outputFormat: 'mp3_44100_128',
  });
  const chunks: Buffer[] = [];
  // ReadableStream<Uint8Array> -> Node Readable
  for await (const c of Readable.fromWeb(stream as never) as AsyncIterable<Uint8Array>) chunks.push(Buffer.from(c));
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, Buffer.concat(chunks));
  console.log(`Wrote ${out} (voice ${voiceId}). Next: npm run transcribe`);
}
main().catch((e) => fail(`TTS failed: ${e?.statusCode ?? ''} ${e?.message ?? e}`));
