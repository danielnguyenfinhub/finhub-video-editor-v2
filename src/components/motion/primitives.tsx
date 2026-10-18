import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

type Props = {
	/** Start frame, local to the enclosing Sequence. */
	at?: number;
	/** Length of the move in frames. */
	duration?: number;
	style?: React.CSSProperties;
	children: React.ReactNode;
};

/** 0–1 ramp starting at `at`, clamped. */
export const useRamp = (at = 0, duration = 15) => {
	const frame = useCurrentFrame();
	return interpolate(frame, [at, at + duration], [0, 1], clamp);
};

/** Damped spring starting at `at` (0 before). Overshoots only with a bouncy config. */
export const useSpringAt = (at = 0, config: Parameters<typeof spring>[0]['config'] = {damping: 200}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	return spring({frame: frame - at, fps, config});
};

export const FadeIn: React.FC<Props> = ({at, duration, style, children}) => (
	<div style={{...style, opacity: useRamp(at, duration)}}>{children}</div>
);

export const SlideUp: React.FC<Props & {distance?: number}> = ({at, duration = 20, distance = 40, style, children}) => {
	const p = useRamp(at, duration);
	const eased = 1 - (1 - p) ** 3;
	return <div style={{...style, opacity: p, transform: `translateY(${(1 - eased) * distance}px)`}}>{children}</div>;
};

export const SpringScale: React.FC<Props & {bouncy?: boolean}> = ({at, bouncy, style, children}) => {
	const s = useSpringAt(at, bouncy ? {damping: 10, stiffness: 120} : {damping: 200});
	return (
		<div style={{...style, opacity: Math.min(1, s * 2), transform: `scale(${interpolate(s, [0, 1], [0.6, 1])})`}}>
			{children}
		</div>
	);
};
