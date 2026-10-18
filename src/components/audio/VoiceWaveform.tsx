import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {useAudioData, visualizeAudio} from '@remotion/media-utils';

type Props = {src?: string; bars?: number; color?: string; active?: number};

const Bars: React.FC<{values: number[]; color: string; active: number}> = ({values, color, active}) => (
  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: '100%'}}>
    {values.map((v, i) => (
      <div
        key={i}
        style={{
          flex: 1,
          maxWidth: 14,
          height: `${Math.max(6, v * active * 100)}%`,
          borderRadius: 999,
          background: color,
        }}
      />
    ))}
  </div>
);

const AudioBars: React.FC<Required<Omit<Props, 'src'>> & {src: string}> = ({src, bars, color, active}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const data = useAudioData(src);
  if (!data) return null;
  const nSamples = 64; // power of two, required by visualizeAudio
  const spectrum = visualizeAudio({fps, frame, audioData: data, numberOfSamples: nSamples});
  const values = Array.from({length: bars}, (_, i) =>
    Math.min(1, spectrum[Math.floor((i / bars) * (nSamples / 2))] * 6),
  );
  return <Bars values={values} color={color} active={active} />;
};

const FakeBars: React.FC<Required<Omit<Props, 'src'>>> = ({bars, color, active}) => {
  const frame = useCurrentFrame();
  const values = Array.from({length: bars}, (_, i) =>
    0.5 + 0.5 * Math.sin(frame * 0.25 + i * 0.7) * Math.sin(frame * 0.11 + i * 1.3),
  );
  return <Bars values={values} color={color} active={active} />;
};

export const VoiceWaveform: React.FC<Props> = ({src, bars = 32, color = '#4f46e5', active = 1}) =>
  src ? (
    <AudioBars src={src} bars={bars} color={color} active={active} />
  ) : (
    <FakeBars bars={bars} color={color} active={active} />
  );
