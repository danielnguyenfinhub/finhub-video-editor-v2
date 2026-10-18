import {staticFile} from 'remotion';

export type Word = {word: string; start: number; end: number};

/** For calculateMetadata. Returns [] when words.json is absent (404). */
export const loadWords = async (): Promise<Word[]> => {
  const res = await fetch(staticFile('words.json'));
  if (!res.ok) return [];
  return (await res.json()) as Word[];
};
