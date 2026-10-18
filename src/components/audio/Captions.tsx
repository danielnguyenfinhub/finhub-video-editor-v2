import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import type {Word} from './loadWords';

const MAX_WORDS = 7;
const SENTENCE_END = /[.!?]["')\]]*$/;

const paginate = (words: Word[]): Word[][] => {
  const pages: Word[][] = [];
  let cur: Word[] = [];
  for (const w of words) {
    cur.push(w);
    if (cur.length >= MAX_WORDS || SENTENCE_END.test(w.word)) {
      pages.push(cur);
      cur = [];
    }
  }
  if (cur.length) pages.push(cur);
  return pages;
};

export const Captions: React.FC<{words: Word[]}> = ({words}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  if (!words.length) return null;

  const t = frame / fps;
  const pages = paginate(words);
  // Current page: last page whose first word has started (holds through gaps, hides before first word).
  let page: Word[] | undefined;
  for (const p of pages) if (p[0].start <= t) page = p;
  if (!page) return null;

  const scale = width / 1920;
  const fontSize = 44 * scale; // >= 40px at 1080p
  return (
    <div
      style={{
        position: 'absolute',
        left: width * 0.05,
        right: width * 0.05,
        bottom: height * 0.05,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          maxWidth: '100%',
          padding: `${12 * scale}px ${28 * scale}px`,
          borderRadius: 24 * scale,
          background: 'rgba(0,0,0,0.78)',
          color: '#fff',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 700,
          fontSize,
          lineHeight: 1.25,
          textAlign: 'center',
          // max 2 lines
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {page.map((w, i) => {
          const active = w.start <= t && t < w.end;
          return (
            <span key={i} style={{color: active ? '#FACC15' : '#fff'}}>
              {w.word}
              {i < page!.length - 1 ? ' ' : ''}
            </span>
          );
        })}
      </div>
    </div>
  );
};
