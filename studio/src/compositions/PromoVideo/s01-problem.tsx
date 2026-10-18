import React, {useRef} from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {IncomingCallToast} from '../../components/ui/IncomingCallToast';
import {beatFrame, useGsapTimeline, useSpringAt, useRamp} from '../../components/motion';
import {COLORS, fontFamily} from '../../lib/brand';
import {Stage, usePortrait, type SceneProps} from './shared';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ROW = 210; // toast stacking offset (manifest)

const CALLS = [
	{caller: 'Jasmine Tran', phone: '(415) 555-0142', time: '2:14 pm', note: 'Gel manicure?'},
	{caller: 'Priya Shah', phone: '(415) 555-0187', time: '2:16 pm', note: 'Pedicure for two'},
	{caller: 'Chloe Martin', phone: '(415) 555-0119', time: '2:19 pm', note: 'Acrylic fill'},
];

const Toast: React.FC<{i: number; enter: number; miss: number; innerRef: React.Ref<HTMLDivElement>}> = ({
	i,
	enter,
	miss,
	innerRef,
}) => {
	const frame = useCurrentFrame();
	const progress = useSpringAt(enter, {damping: 14, stiffness: 140});
	const missed = useRamp(miss, 12);
	return (
		<div ref={innerRef} style={{position: 'absolute', top: 0, left: 0}}>
			<IncomingCallToast {...CALLS[i]} progress={progress} missed={missed} ring={((frame - enter) % 30) / 30} />
		</div>
	);
};

export const S01Problem: React.FC<SceneProps> = ({scene, words}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const portrait = usePortrait();
	const b = (w: string, n = 0) => beatFrame(words, scene, w, fps, n);

	// Beats: toast in on its word, flips to missed on the next; counter ticks with each miss.
	const enters = [b('missed'), b('door'), b('phone')];
	const misses = [b('booking'), b('hands'), b('ringing')];
	const lost = misses.filter((m) => frame >= m).length;
	const lastTick = misses[Math.max(0, lost - 1)];
	const bump = useSpringAt(lastTick, {damping: 8, stiffness: 200});
	const counterIn = useRamp(misses[0], 12);

	// GSAP: newer toasts land on top and push the stack down with a springy ease.
	const refs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];
	useGsapTimeline(
		(tl) => {
			refs.forEach((r) => tl.set(r.current, {y: 0}, 0));
			enters.slice(1).forEach((at, k) => {
				refs.slice(0, k + 1).forEach((r, j) => {
					tl.to(r.current, {y: (k + 1 - j) * ROW, duration: 0.6, ease: 'back.out(1.7)'}, at / fps);
				});
			});
		},
		[enters.join(), fps],
	);

	const stackW = 880;
	const stackH = ROW * 2 + 200;
	const counterSize = portrait ? 220 : 240;

	return (
		<Stage w={portrait ? 900 : 1728} h={portrait ? 1400 : 860} background={COLORS.canvas}>
			<div
				style={{
					display: 'flex',
					flexDirection: portrait ? 'column' : 'row',
					alignItems: 'center',
					gap: portrait ? 120 : 96,
					fontFamily,
				}}
			>
				<div style={{position: 'relative', width: stackW, height: stackH}}>
					{refs.map((r, i) => (
						<div key={i} style={{position: 'absolute', inset: 0, zIndex: i}}>
							<Toast i={i} enter={enters[i]} miss={misses[i]} innerRef={r} />
						</div>
					))}
				</div>
				<div
					style={{
						width: 640,
						display: 'flex',
						flexDirection: 'column',
						alignItems: portrait ? 'center' : 'flex-start',
						textAlign: portrait ? 'center' : 'left',
						opacity: counterIn,
						transform: `translateY(${interpolate(counterIn, [0, 1], [30, 0])}px)`,
					}}
				>
					<span
						style={{
							fontSize: counterSize,
							fontWeight: 800,
							lineHeight: 1,
							color: COLORS.danger,
							fontVariantNumeric: 'tabular-nums',
							transform: `scale(${interpolate(bump, [0, 1], [1.25, 1], clamp)})`,
							transformOrigin: portrait ? 'center' : 'left center',
						}}
					>
						{Math.max(1, lost)}
					</span>
					<span style={{fontSize: 72, fontWeight: 700, color: COLORS.ink, lineHeight: 1.1}}>
						{/* Ends on the spec's onScreenText verbatim: "3 bookings lost today". */}
						{lost === 3 ? scene.onScreenText[1] : `${Math.max(1, lost)} booking${lost > 1 ? 's' : ''} lost today`}
					</span>
				</div>
			</div>
		</Stage>
	);
};
