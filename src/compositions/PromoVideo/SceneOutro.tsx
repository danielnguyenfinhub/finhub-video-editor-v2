import React from 'react';
import {Img, staticFile, useVideoConfig} from 'remotion';
import {CtaButton} from '../../components/ui/CtaButton';
import {beatFrame, SlideUp, SpringScale, useRamp, useSpringAt} from '../../components/motion';
import {fontFamily} from '../../lib/brand';
import {Stage, usePortrait, type SceneProps} from './shared';

export const SceneOutro: React.FC<SceneProps> = ({scene, meta, words}) => {
	const {fps} = useVideoConfig();
	const portrait = usePortrait();
	const b = (w: string) => beatFrame(words, scene, w, fps);

	const tLogo = b('ReceptionAI');
	const tTag = b('never');
	const tCta = b('start');
	const tPulse = b('today');
	const ctaIn = useSpringAt(tCta);
	const pulse = useRamp(tPulse, 24);
	// onScreenText: [brand name (logo wordmark), tagline, CTA]; CTA text comes from meta.cta so variants restyle it.
	const tagline = scene.onScreenText[1];
	const logo = meta.brand.logo.replace(/^public\//, '');

	return (
		<Stage
			w={portrait ? 1000 : 1500}
			h={portrait ? 1200 : 800}
			background={`radial-gradient(circle at 50% 35%, #6366f1, ${meta.brand.primary} 70%)`}
		>
			<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 64, fontFamily, textAlign: 'center'}}>
				<SpringScale at={tLogo} bouncy>
					<div style={{background: '#ffffff', borderRadius: 48, padding: '36px 56px', boxShadow: '0 30px 80px rgba(15,23,42,0.35)'}}>
						<Img src={staticFile(logo)} style={{width: portrait ? 760 : 720, display: 'block'}} alt={scene.onScreenText[0]} />
					</div>
				</SpringScale>
				<SlideUp at={tTag}>
					<span style={{fontSize: portrait ? 88 : 72, fontWeight: 800, color: '#ffffff', lineHeight: 1.15, display: 'block', maxWidth: portrait ? 960 : 1500}}>
						{tagline}
					</span>
				</SlideUp>
				<CtaButton text={meta.cta.text} progress={ctaIn} pulse={pulse} color="#ffffff" style={{color: meta.brand.primary}} />
			</div>
		</Stage>
	);
};
