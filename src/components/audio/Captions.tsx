import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import type {Word} from './loadWords';
import {safeFor} from '../../lib/brand';

const MAX_WORDS = 7;
const SENTENCE_END = /[.!?]["')\]]*$/;

const paginate = (words: Word[], maxWords: number): Word[][] => {
  const pages: Word[][] = [];
  let cur: Word[] = [];
  for (const w of words) {
    cur.push(w);
    if (cur.length >= maxWords || SENTENCE_END.test(w.word)) {
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

  const portrait = height > width;
  const pages = paginate(words, portrait ? 5 : MAX_WORDS); // 5 words keep 2 lines at 72px in 1080 wide
  const onGrid = (w: Word) => frame >= Math.round(w.start * fps) && frame < Math.round(w.end * fps);
  // Current page: last page whose first word has started (holds through gaps, hides before first word).
  let page: Word[] | undefined;
  for (const p of pages) if (frame >= Math.round(p[0].start * fps)) page = p;
  if (!page) return null;

  const safe = safeFor(width, height);
  const fontSize = portrait ? (72 * width) / 1080 : (44 * height) / 1080; // >= 40px at 1080p
  const scale = fontSize / 44;
  const bottom = portrait ? safe.bottom + height * 0.01 : safe.bottom;
  return (
    <div
      style={{
        position: 'absolute',
        left: safe.left,
        right: portrait ? safe.right : safe.left,
        bottom,
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
          const active = onGrid(w);
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
