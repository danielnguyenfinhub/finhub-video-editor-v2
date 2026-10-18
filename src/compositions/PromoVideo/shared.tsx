import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {safeFor} from '../../lib/brand';
import type {Word} from '../../components/audio/loadWords';
import type {Meta, Scene} from './schema';

export type SceneProps = {scene: Scene; meta: Meta; words: Word[]};

export const usePortrait = () => {
	const {width, height} = useVideoConfig();
	return height > width;
};

// Landscape captions sit in the bottom ~140px; keep scene content above them.
const CAPTION_RESERVE = 110;

/**
 * Lays out a fixed-size design box (1080p design px) centred in the safe area,
 * scaled down to fit (never up). Captions keep their own band at the bottom.
 */
export const Stage: React.FC<{
	w: number;
	h: number;
	background?: string;
	children: React.ReactNode;
}> = ({w, h, background, children}) => {
	const {width, height} = useVideoConfig();
	const safe = safeFor(width, height);
	const portrait = height > width;
	const bottom = safe.bottom + (portrait ? 0 : CAPTION_RESERVE * (width / 1920));
	const boxW = width - safe.left - safe.right;
	const boxH = height - safe.top - bottom;
	const k = Math.min(1, boxW / w, boxH / h);
	return (
		<AbsoluteFill style={{background}}>
			<div
				style={{
					position: 'absolute',
					left: safe.left + (boxW - w * k) / 2,
					top: safe.top + (boxH - h * k) / 2,
					width: w,
					height: h,
					transform: `scale(${k})`,
					transformOrigin: 'top left',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				{children}
			</div>
		</AbsoluteFill>
	);
};
