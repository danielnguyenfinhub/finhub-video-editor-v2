import {z} from 'zod';
import {zColor} from '@remotion/zod-types';

export const brandSchema = z.object({
	primary: zColor(),
	accent: zColor(),
	font: z.string(),
	logo: z.string(),
});

export const complianceSchema = z.object({
	disclaimer: z.string(),
	persistent: z.boolean().optional(),
	minSeconds: z.number().optional(),
});

export const metaSchema = z.object({
	slug: z.string(),
	title: z.string(),
	brandName: z.string(),
	tagline: z.string(),
	language: z.string(),
	fps: z.number().int().positive(),
	width: z.number().int().positive(),
	height: z.number().int().positive(),
	brand: brandSchema,
	audience: z.string(),
	cta: z.object({text: z.string(), url: z.string()}),
	voice: z.object({provider: z.string(), voiceId: z.string().nullable()}),
	compliance: complianceSchema.nullable(),
});

export const sceneSchema = z.object({
	id: z.string(),
	startSec: z.number(),
	endSec: z.number(),
	goal: z.string(),
	voiceover: z.string(),
	onScreenText: z.array(z.string()),
	visual: z.string(),
	ui: z.array(z.string()),
	motion: z.string(),
	libs: z.array(z.string()),
	sfx: z.array(z.object({cue: z.string(), atWord: z.string()})),
	notes: z.string(),
});

export const variantSchema = z.object({
	id: z.string(),
	meta: z.record(z.string(), z.unknown()),
});

export const wordSchema = z.object({word: z.string(), start: z.number(), end: z.number()});

export const specSchema = z.object({
	meta: metaSchema,
	scenes: z.array(sceneSchema).min(1),
	variants: z.array(variantSchema).optional(),
});

/** Spec + values filled by calculateMetadata. */
export const promoSchema = specSchema.extend({
	words: z.array(wordSchema).optional(),
	hasVoice: z.boolean().optional(),
	/** SFX cues whose file exists at public/sfx/<cue>.mp3. */
	sfxAvailable: z.array(z.string()).optional(),
});

export type Meta = z.infer<typeof metaSchema>;
export type Scene = z.infer<typeof sceneSchema>;
export type Spec = z.infer<typeof specSchema>;
export type PromoProps = z.infer<typeof promoSchema>;
