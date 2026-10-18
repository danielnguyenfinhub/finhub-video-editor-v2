import {loadFont} from '@remotion/google-fonts/Inter';

// Source: _workspace/01_planner_scenes.json meta.brand. Named exports only.
export const {fontFamily} = loadFont('normal', {
	weights: ['400', '500', '600', '700', '800'],
	subsets: ['latin'],
});

export const BRAND = {
	name: 'ReceptionAI',
	tagline: 'Never miss another salon appointment.',
	primary: '#4f46e5',
	accent: '#F472B6',
	logo: 'logo.svg', // staticFile('logo.svg')
} as const;

// Contrast notes: white on primary is 6.3:1; accent pink only takes dark ink text (ink on accent 6.8:1).
export const COLORS = {
	primary: BRAND.primary,
	primaryDark: '#3730a3',
	primarySoft: '#eef2ff',
	accent: BRAND.accent,
	accentSoft: '#fdf2f8',
	ink: '#0f172a',
	muted: '#475569',
	border: '#e2e8f0',
	surface: '#ffffff',
	canvas: '#f8fafc',
	success: '#16a34a',
	successSoft: '#dcfce7',
	danger: '#dc2626',
	dangerSoft: '#fee2e2',
} as const;

export type SafeArea = {top: number; right: number; bottom: number; left: number};

// 5% title-safe on every edge. Portrait (9:16) also keeps clear of platform UI:
// bottom 20% and right 15%.
export function safeFor(width: number, height: number): SafeArea {
	const portrait = height > width;
	return {
		top: Math.round(height * 0.05),
		left: Math.round(width * 0.05),
		right: Math.round(width * (portrait ? 0.15 : 0.05)),
		bottom: Math.round(height * (portrait ? 0.2 : 0.05)),
	};
}

export const SAFE = safeFor(1920, 1080); // {top: 54, right: 96, bottom: 54, left: 96}

// Multiply 1080p design pixels by this for other output widths.
export const scale = (width: number) => width / 1920;
