import React from 'react';
import {Img, staticFile, useVideoConfig} from 'remotion';
import {CtaButton} from '../../components/ui/CtaButton';
import {beatFrame, SlideUp, SpringScale, useRamp, useSpringAt} from '../../components/motion';
import {fontFamily} from '../../lib/brand';
import {PORTRAIT_BOX, Stage, usePortrait, type SceneProps} from './shared';

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
	const name = scene.onScreenText[0];

	return (
		<Stage
			w={portrait ? PORTRAIT_BOX.w : 1500}
			h={portrait ? PORTRAIT_BOX.h : 800}
			background={`radial-gradient(circle at 50% 35%, #6366f1, ${meta.brand.primary} 70%)`}
		>
			<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 64, fontFamily, textAlign: 'center'}}>
				<SpringScale at={tLogo} bouncy>
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: 24,
							background: '#ffffff',
							borderRadius: 48,
							padding: '36px 56px',
							boxShadow: '0 30px 80px rgba(15,23,42,0.35)',
						}}
					>
						{/* Mark cropped from logo.svg (x 0–128 of 720); the wordmark is live Inter text, so the card hugs it
						    instead of the SVG's fallback-font text leaving blank space on the right. */}
						<div style={{width: 128, height: 160, overflow: 'hidden', flexShrink: 0}}>
							<Img src={staticFile(logo)} style={{width: 720, maxWidth: 'none', display: 'block'}} alt="" />
						</div>
						<span
							style={{fontSize: 84, fontWeight: 800, letterSpacing: -2, lineHeight: 1, color: meta.brand.primary, whiteSpace: 'nowrap'}}
						>
							{name.replace(/AI$/, '')}
							{name.endsWith('AI') ? <span style={{color: meta.brand.accent}}>AI</span> : null}
						</span>
					</div>
				</SpringScale>
				<SlideUp at={tTag}>
					<span style={{fontSize: portrait ? 88 : 72, fontWeight: 800, color: '#ffffff', lineHeight: 1.15, display: 'block', maxWidth: portrait ? PORTRAIT_BOX.w : 1500}}>
						{tagline}
					</span>
				</SlideUp>
				<CtaButton text={meta.cta.text} progress={ctaIn} pulse={pulse} color="#ffffff" style={{color: meta.brand.primary}} />
			</div>
		</Stage>
	);
};
