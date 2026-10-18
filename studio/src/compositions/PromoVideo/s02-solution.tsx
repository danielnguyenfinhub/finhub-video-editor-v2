import React from 'react';
import {staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {AnsweredCallCard} from '../../components/ui/AnsweredCallCard';
import {VoiceWaveform} from '../../components/audio/VoiceWaveform';
import {beatFrame, SlideUp, SpringScale, useRamp, useSpringAt} from '../../components/motion';
import {COLORS, fontFamily} from '../../lib/brand';
import {Stage, usePortrait, type SceneProps} from './shared';

export const S02Solution: React.FC<SceneProps & {hasVoice: boolean}> = ({scene, meta, words, hasVoice}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const portrait = usePortrait();
	const b = (w: string) => beatFrame(words, scene, w, fps);

	const tTitle = b('ReceptionAI');
	const tAnswer = b('answers');
	const tSub = b('every');
	const tTranscript = b('friendly');

	const cardIn = useSpringAt(0);
	const answered = useRamp(tAnswer, 18);
	const transcriptReveal = useRamp(tTranscript, 15);
	const [title, subtitle] = scene.onScreenText;

	return (
		<Stage w={1160} h={portrait ? 1300 : 900} background={`linear-gradient(180deg, ${COLORS.primarySoft}, ${COLORS.canvas})`}>
			<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: portrait ? 72 : 40, fontFamily}}>
				<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center'}}>
					<SpringScale at={tTitle} bouncy>
						<span style={{fontSize: portrait ? 128 : 104, fontWeight: 800, color: meta.brand.primary, letterSpacing: -2, lineHeight: 1.05}}>
							{title}
						</span>
					</SpringScale>
					<SlideUp at={tSub}>
						<span style={{fontSize: portrait ? 64 : 56, fontWeight: 600, color: COLORS.ink}}>{subtitle}</span>
					</SlideUp>
				</div>
				<AnsweredCallCard
					caller="Jasmine Tran"
					phone="(415) 555-0142"
					salonName="Bella Nails & Spa"
					transcript="Hi! Do you have time for a gel manicure this Saturday afternoon?"
					progress={cardIn}
					answered={answered}
					transcriptReveal={transcriptReveal}
					elapsedSec={Math.max(0, frame - tAnswer) / fps}
				>
					<div style={{height: portrait ? 140 : 110}}>
						<VoiceWaveform src={hasVoice ? staticFile('voice.mp3') : undefined} color={COLORS.success} active={answered} />
					</div>
				</AnsweredCallCard>
			</div>
		</Stage>
	);
};
