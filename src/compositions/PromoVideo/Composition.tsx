import React from 'react';
import {AbsoluteFill, Audio, Sequence, Series, staticFile, useVideoConfig} from 'remotion';
import {Captions} from '../../components/audio/Captions';
import {beatFrame} from '../../components/motion';
import {fontFamily} from '../../lib/brand';
import type {PromoProps, Scene} from './schema';
import type {SceneProps} from './shared';
import {SceneProblem} from './SceneProblem';
import {SceneSolution} from './SceneSolution';
import {SceneBooking} from './SceneBooking';
import {SceneOutro} from './SceneOutro';

const SCENES: Record<string, React.FC<SceneProps & {hasVoice: boolean}>> = {
	's01-problem': SceneProblem,
	's02-solution': SceneSolution,
	's03-booking': SceneBooking,
	's04-outro': SceneOutro,
};

const frames = (sec: number, fps: number) => Math.round(sec * fps);
const sceneLen = (s: Scene, fps: number) => frames(s.endSec, fps) - frames(s.startSec, fps);

const Compliance: React.FC<{text: string}> = ({text}) => {
	const {width, height} = useVideoConfig();
	const k = width / 1920;
	return (
		<AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center', paddingTop: height * 0.05}}>
			<div
				style={{
					maxWidth: width * 0.9,
					padding: `${10 * k}px ${24 * k}px`,
					borderRadius: 12 * k,
					background: 'rgba(15,23,42,0.85)',
					color: '#ffffff',
					fontFamily,
					fontSize: Math.max(28, 30 * k),
					lineHeight: 1.3,
					textAlign: 'center',
				}}
			>
				{text}
			</div>
		</AbsoluteFill>
	);
};

export const PromoVideo: React.FC<PromoProps> = ({meta, scenes, words = [], hasVoice = false, sfxAvailable = []}) => {
	const {fps, durationInFrames} = useVideoConfig();
	const c = meta.compliance;
	const last = scenes[scenes.length - 1];
	const complianceLen = c
		? c.persistent
			? durationInFrames
			: Math.min(durationInFrames, Math.max(frames(c.minSeconds ?? 0, fps), sceneLen(last, fps)))
		: 0;

	return (
		<AbsoluteFill style={{background: '#f8fafc', fontFamily}}>
			<Series>
				{scenes.map((s) => {
					const Comp = SCENES[s.id];
					return (
						<Series.Sequence key={s.id} durationInFrames={sceneLen(s, fps)} name={s.id}>
							{Comp ? <Comp scene={s} meta={meta} words={words} hasVoice={hasVoice} /> : null}
						</Series.Sequence>
					);
				})}
			</Series>
			{hasVoice ? <Audio src={staticFile('voice.mp3')} /> : null}
			{scenes.flatMap((s) =>
				s.sfx
					.filter((x) => sfxAvailable.includes(x.cue))
					.map((x) => (
						<Sequence key={`${s.id}-${x.cue}`} from={frames(s.startSec, fps) + beatFrame(words, s, x.atWord, fps)} name={`sfx:${x.cue}`}>
							<Audio src={staticFile(`sfx/${x.cue}.mp3`)} />
						</Sequence>
					)),
			)}
			<Captions words={words} />
			{c ? (
				<Sequence from={durationInFrames - complianceLen} durationInFrames={complianceLen} name="compliance">
					<Compliance text={c.disclaimer} />
				</Sequence>
			) : null}
		</AbsoluteFill>
	);
};
