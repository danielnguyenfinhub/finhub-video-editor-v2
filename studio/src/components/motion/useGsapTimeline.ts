import {useLayoutEffect, useRef, type DependencyList} from 'react';
import {gsap} from 'gsap';
import {useCurrentFrame, useVideoConfig} from 'remotion';

/**
 * Frame-driven GSAP: `build` fills a paused timeline (positions in seconds, local to the
 * enclosing Sequence); every frame seeks it to frame / fps. GSAP never runs its own clock.
 * `build` runs in a layout effect, so refs are attached by then.
 */
export const useGsapTimeline = (build: (tl: gsap.core.Timeline) => void, deps: DependencyList) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const tlRef = useRef<gsap.core.Timeline | null>(null);

	useLayoutEffect(() => {
		const tl = gsap.timeline({paused: true});
		build(tl);
		tlRef.current = tl;
		return () => {
			tl.kill();
			tlRef.current = null;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, deps);

	useLayoutEffect(() => {
		tlRef.current?.seek(frame / fps, false);
	}, [frame, fps, ...deps]);
};
