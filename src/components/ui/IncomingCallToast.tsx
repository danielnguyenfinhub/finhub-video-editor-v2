import React from 'react';
import {interpolate, interpolateColors} from 'remotion';
import {Phone, PhoneMissed} from 'lucide-react';
import {Card} from './card';
import {Badge} from './badge';
import {COLORS, fontFamily} from '../../lib/brand';
import {cn} from '../../lib/utils';

export type IncomingCallToastProps = {
	caller: string;
	phone: string;
	time: string;
	note?: string;
	/** 0–1 entrance (slide down + fade). Spring overshoot above 1 is allowed. */
	progress?: number;
	/** 0–1 blend from ringing (indigo) to missed (red). */
	missed?: number;
	/** 0–1 ring phase; drives three icon wiggles. Feed (frame % n) / n to loop. */
	ring?: number;
	className?: string;
	style?: React.CSSProperties;
};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export function IncomingCallToast({
	caller,
	phone,
	time,
	note,
	progress = 1,
	missed = 0,
	ring = 0,
	className,
	style,
}: IncomingCallToastProps) {
	const isMissed = missed >= 0.5;
	const tone = interpolateColors(missed, [0, 1], [COLORS.primary, COLORS.danger]);
	const toneSoft = interpolateColors(missed, [0, 1], [COLORS.primarySoft, COLORS.dangerSoft]);
	const wiggle = Math.sin(ring * Math.PI * 6) * 14 * (1 - Math.min(1, Math.max(0, missed)));
	const Icon = isMissed ? PhoneMissed : Phone;

	return (
		<Card
			className={cn('w-[880px] flex-row items-center gap-7 px-8 py-7', className)}
			style={{
				fontFamily,
				opacity: interpolate(progress, [0, 1], [0, 1], clamp),
				transform: `translateY(${interpolate(progress, [0, 1], [-80, 0])}px) scale(${interpolate(progress, [0, 1], [0.94, 1])})`,
				borderLeft: `10px solid ${tone}`,
				...style,
			}}
		>
			<div
				className="flex size-24 shrink-0 items-center justify-center rounded-full"
				style={{background: toneSoft, color: tone}}
			>
				<Icon size={48} strokeWidth={2.25} style={{transform: `rotate(${wiggle}deg)`}} />
			</div>
			<div className="flex min-w-0 flex-1 flex-col gap-1">
				<div className="flex items-center justify-between gap-4">
					<span className="truncate text-[40px] leading-tight font-semibold text-slate-950">{caller}</span>
					<span className="shrink-0 text-[28px] text-slate-600">{time}</span>
				</div>
				<span className="text-[28px] text-slate-600">{phone}</span>
				<div className="mt-2 flex items-center gap-3">
					<Badge style={{background: tone}}>{isMissed ? 'Missed call' : 'Incoming call'}</Badge>
					{note ? <span className="truncate text-[28px] text-slate-700">{note}</span> : null}
				</div>
			</div>
		</Card>
	);
}
