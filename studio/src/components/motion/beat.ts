import type {Word} from '../audio/loadWords';

const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}']/gu, '');

type SceneTiming = {startSec: number; endSec: number; voiceover: string};

/**
 * Scene-local frame where `trigger` (nth occurrence, 0-based) is spoken inside the scene.
 * Falls back to even spacing over the scene's voiceover when words.json has no match.
 */
export const beatFrame = (words: Word[], scene: SceneTiming, trigger: string, fps: number, nth = 0): number => {
	const t = norm(trigger);
	const sceneStart = Math.round(scene.startSec * fps);
	const hits = words.filter((w) => w.start >= scene.startSec && w.start < scene.endSec && norm(w.word) === t);
	if (hits[nth]) return Math.round(hits[nth].start * fps) - sceneStart;

	const vo = scene.voiceover.split(/\s+/).filter(Boolean);
	const idx = vo.map(norm).reduce<number[]>((acc, w, i) => (w === t ? [...acc, i] : acc), [])[nth] ?? 0;
	const span = scene.endSec - scene.startSec - 0.5;
	return Math.round(((idx / Math.max(1, vo.length)) * span) * fps);
};
