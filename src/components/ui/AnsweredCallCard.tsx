import React from 'react';
import {interpolate, interpolateColors} from 'remotion';
import {PhoneCall, PhoneMissed, Sparkles} from 'lucide-react';
import {Card, CardContent, CardHeader} from './card';
import {Badge} from './badge';
import {COLORS, fontFamily} from '../../lib/brand';
import {cn} from '../../lib/utils';

export type AnsweredCallCardProps = {
	caller: string;
	phone: string;
	salonName: string;
	/** What the caller said, shown as the live transcript line. */
	transcript: string;
	/** Call timer in seconds; derive from frame (e.g. frame / fps). */
	elapsedSec?: number;
	/** 0–1 entrance (rise + fade). */
	progress?: number;
	/** 0–1 morph from missed (red) to answered by ReceptionAI (green). */
	answered?: number;
	/** 0–1 visibility of the transcript line. */
	transcriptReveal?: number;
	/** Slot under the transcript, e.g. the audio-engineer's VoiceWaveform. */
	children?: React.ReactNode;
	className?: string;
	style?: React.CSSProperties;
};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const mmss = (s: number) => {
	const t = Math.max(0, Math.floor(s));
	return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
};

export function AnsweredCallCard({
	caller,
	phone,
	salonName,
	transcript,
	elapsedSec = 0,
	progress = 1,
	answered = 1,
	transcriptReveal = 1,
	children,
	className,
	style,
}: AnsweredCallCardProps) {
	const isAnswered = answered >= 0.5;
	const tone = interpolateColors(answered, [0, 1], [COLORS.danger, COLORS.success]);
	const toneSoft = interpolateColors(answered, [0, 1], [COLORS.dangerSoft, COLORS.successSoft]);
	const Icon = isAnswered ? PhoneCall : PhoneMissed;
	// Flip on the icon disc: squash to 0 at the midpoint, swap icon, expand back.
	const flip = Math.abs(Math.cos(Math.min(1, Math.max(0, answered)) * Math.PI));

	return (
		<Card
			className={cn('w-[1100px] gap-8 py-10', className)}
			style={{
				fontFamily,
				opacity: interpolate(progress, [0, 1], [0, 1], clamp),
				transform: `translateY(${interpolate(progress, [0, 1], [60, 0])}px)`,
				borderTop: `12px solid ${tone}`,
				...style,
			}}
		>
			<CardHeader className="flex-row items-center gap-7 px-10">
				<div
					className="flex size-28 shrink-0 items-center justify-center rounded-full"
					style={{background: toneSoft, color: tone, transform: `scaleX(${flip})`}}
				>
					<Icon size={56} strokeWidth={2.25} />
				</div>
				<div className="flex min-w-0 flex-1 flex-col gap-1">
					<span className="truncate text-[48px] leading-tight font-bold text-slate-950">{caller}</span>
					<span className="text-[28px] text-slate-600">
						{phone} · calling {salonName}
					</span>
				</div>
				<div className="flex shrink-0 flex-col items-end gap-2">
					<Badge style={{background: tone}}>{isAnswered ? 'Answered' : 'Missed call'}</Badge>
					{isAnswered ? (
						<span className="text-[28px] font-medium text-slate-600 tabular-nums">{mmss(elapsedSec)}</span>
					) : null}
				</div>
			</CardHeader>
			<CardContent className="flex flex-col gap-6 px-10">
				<div
					className="flex items-center gap-3 text-[28px] font-semibold"
					style={{color: COLORS.primary, opacity: interpolate(answered, [0.5, 1], [0, 1], clamp)}}
				>
					<Sparkles size={32} />
					ReceptionAI is on the call
				</div>
				<p
					className="m-0 rounded-2xl bg-slate-50 px-8 py-6 text-[40px] leading-snug text-slate-900"
					style={{
						opacity: interpolate(transcriptReveal, [0, 1], [0, 1], clamp),
						transform: `translateY(${interpolate(transcriptReveal, [0, 1], [16, 0], clamp)}px)`,
					}}
				>
					“{transcript}”
				</p>
				{/* Opacity, not unmount: keeps card height stable through the missed -> answered morph. */}
				<div style={{opacity: isAnswered ? interpolate(answered, [0.5, 1], [0, 1], clamp) : 0}}>{children}</div>
			</CardContent>
		</Card>
	);
}
