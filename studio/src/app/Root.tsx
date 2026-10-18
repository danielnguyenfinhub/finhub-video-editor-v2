import '../styles/globals.css';
import {Composition, staticFile, type CalculateMetadataFunction} from 'remotion';
import {loadWords} from '../components/audio/loadWords';
import {PromoVideo} from '../compositions/PromoVideo/Composition';
import {promoSchema, type PromoProps} from '../compositions/PromoVideo/schema';
import spec from '../../../data/templates/video-spec.json';

const exists = async (file: string) => {
	try {
		return (await fetch(staticFile(file), {method: 'HEAD'})).ok;
	} catch {
		return false;
	}
};

const metadata =
	(portrait: boolean): CalculateMetadataFunction<PromoProps> =>
	async ({props}) => {
		const {fps, width, height} = props.meta;
		const last = props.scenes[props.scenes.length - 1];
		const cues = [...new Set(props.scenes.flatMap((s) => s.sfx.map((x) => x.cue)))];
		const [words, hasVoice, sfxOk] = await Promise.all([
			loadWords(),
			exists('voice.mp3'),
			Promise.all(cues.map((c) => exists(`sfx/${c}.mp3`))),
		]);
		return {
			fps,
			durationInFrames: Math.round(last.endSec * fps),
			...(portrait ? {width: 1080, height: 1920} : {width, height}),
			props: {...props, words, hasVoice, sfxAvailable: cues.filter((_, i) => sfxOk[i])},
		};
	};

const defaultProps = spec as PromoProps;

export const RemotionRoot: React.FC = () => (
	<>
		<Composition
			id="PromoVideo"
			component={PromoVideo}
			schema={promoSchema}
			defaultProps={defaultProps}
			calculateMetadata={metadata(false)}
			durationInFrames={1800}
			fps={30}
			width={1920}
			height={1080}
		/>
		<Composition
			id="PromoVideo-9x16"
			component={PromoVideo}
			schema={promoSchema}
			defaultProps={defaultProps}
			calculateMetadata={metadata(true)}
			durationInFrames={1800}
			fps={30}
			width={1080}
			height={1920}
		/>
	</>
);
