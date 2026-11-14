import React from 'react';

import { GAME_BRAND } from '../game/brand';

export function SuspectMascot({ mini = false }: { mini?: boolean }) {
  return (
    <svg className={mini ? 'party-mascot-mini' : 'party-mascot'} viewBox="0 0 280 260" aria-hidden="true">
      <g stroke="#271638" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
        <path fill="#FF65A3" d="M57 88l-26 10 10 34 23-6m145-14 32-8 11 35-41 13"/>
        <path fill="#45C8FF" d="m92 203-16 29 28 7 16-31m40 2 12 31 28-7-10-32"/>
        <path fill="#271638" d="M89 53l109 12q30 4 27 34l-11 94q-4 30-35 26l-105-12q-27-4-23-34l10-92q3-31 28-28Z"/>
        <path fill="#FFE45E" d="M88 43l109 12q30 4 27 34l-11 94q-4 30-35 26L73 197q-27-4-23-34l10-92q3-31 28-28Z"/>
        <path fill="#FFF9ED" d="M76 112q3-25 26-20 23 4 20 29-3 22-26 19-23-4-20-28Z"/>
        <path fill="#FFF9ED" d="M134 114q1-20 31-19 29 1 26 24-2 23-30 22-29-1-27-27Z"/>
        <path fill="none" d="m81 81 26-5m38 7 32-10m-54 87q14 11 30-2"/>
        <path strokeWidth="11" d="M108 117v3m66-4v3"/>
        <path fill="#FF65A3" strokeWidth="4" d="m204 34 12-20 9 16 18 3-15 13 1 18-17-10-18 4 7-16-10-15Z"/>
        <path stroke="#FFF9ED" d="M66 31l-9-11m-13 31-14-1m205 131 12 7m-17 9 6 14"/>
      </g>
    </svg>
  );
}

export function GameBrandLockup({ compact = false }: { compact?: boolean }) {
  return <div className={`party-brand ${compact ? 'party-brand-compact' : ''}`}>
    <SuspectMascot mini={compact} />
    <span>{GAME_BRAND.name}</span>
  </div>;
}

export const GeometricDivider: React.FC = () => (
  <div className="flex items-center justify-center gap-3 my-4 opacity-70" aria-hidden="true">
    <span className="h-px w-16 bg-gradient-to-r from-transparent to-amber-400/50" />
    <svg viewBox="0 0 24 24" className="w-4 h-4 text-amber-300">
      <polygon points="12,2 15,9 22,12 15,15 12,22 9,15 2,12 9,9" fill="currentColor" />
    </svg>
    <span className="h-px w-16 bg-gradient-to-l from-transparent to-amber-400/50" />
  </div>
);

const AVATAR_PALETTES = [
  { bg: '#0F293D', stroke: '#2DD4BF', label: 'دلة' },
  { bg: '#2B1F0F', stroke: '#F5C451', label: 'فانوس' },
  { bg: '#0D2B26', stroke: '#34D399', label: 'هلال' },
  { bg: '#162442', stroke: '#60A5FA', label: 'بوصلة' },
  { bg: '#2B1D2E', stroke: '#C084FC', label: 'نجمة' },
  { bg: '#1F2A1A', stroke: '#A3E635', label: 'غصن زيتون' },
  { bg: '#112A38', stroke: '#38BDF8', label: 'كتاب' },
  { bg: '#2D2114', stroke: '#FBBF24', label: 'مفتاح' },
  { bg: '#182436', stroke: '#2DD4BF', label: 'خيمة' },
  { bg: '#291B24', stroke: '#FB7185', label: 'درع' },
  { bg: '#1B2838', stroke: '#818CF8', label: 'قبة' },
  { bg: '#262412', stroke: '#FACC15', label: 'تاج' },
];

/**
 * 12 pure 2D geometric / Jordanian-Arabic SVG avatars (zero 3D human figures).
 */
export const PlayerAvatar: React.FC<{
  index: number;
  size?: 'sm' | 'md' | 'lg';
  highlighted?: boolean;
}> = ({ index, size = 'md', highlighted = false }) => {
  const safeIdx = Math.abs(index) % 12;
  const pal = AVATAR_PALETTES[safeIdx];
  const dims =
    size === 'sm' ? 'w-9 h-9' : size === 'lg' ? 'w-16 h-16' : 'w-12 h-12';

  return (
    <div
      className={`${dims} rounded-xl flex items-center justify-center shrink-0 transition-transform duration-150 ${
        highlighted ? 'ring-2 ring-amber-400 scale-105' : 'ring-1 ring-white/10'
      }`}
      style={{ backgroundColor: pal.bg }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 32 32" className="w-[68%] h-[68%]" fill="none" stroke={pal.stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {safeIdx === 0 && (
          <>
            <path d="M11 12c0-2.5 2-4.5 5-4.5s5 2 5 4.5c0 3-2 4-2 7v5h-6v-5c0-3-2-4-2-7z" />
            <path d="M19 14c3 0 5 1.5 5 4s-2 4-5 4M13 13l-4-2" />
            <path d="M16 4v3.5" />
          </>
        )}
        {safeIdx === 1 && (
          <>
            <path d="M16 4v3m-4 3h8l2 5-2 9H12l-2-9 2-5z" />
            <path d="M10 24h12M16 14v5" />
          </>
        )}
        {safeIdx === 2 && (
          <path d="M20 7a9 9 0 1 0 5 15.5A7.5 7.5 0 0 1 20 7z" />
        )}
        {safeIdx === 3 && (
          <>
            <circle cx="16" cy="16" r="10" />
            <polygon points="16,9 19,16 16,23 13,16" />
          </>
        )}
        {safeIdx === 4 && (
          <polygon points="16,4 19,11 27,11 21,16 23,24 16,19 9,24 11,16 5,11 13,11" />
        )}
        {safeIdx === 5 && (
          <>
            <path d="M7 24C11 18 17 12 25 8" />
            <path d="M13 18c-2-3-1-6 2-7 1 3 0 6-2 7zM19 13c2-2 5-2 6 1-2 2-5 2-6-1z" />
          </>
        )}
        {safeIdx === 6 && (
          <>
            <path d="M6 8h7c2 0 3 1.5 3 3v13c-1-1-2.5-1.5-4-1.5H6V8z" />
            <path d="M26 8h-7c-2 0-3 1.5-3 3v13c1-1 2.5-1.5 4-1.5h6V8z" />
          </>
        )}
        {safeIdx === 7 && (
          <>
            <circle cx="11" cy="14" r="4.5" />
            <path d="M15.5 14H26v4m-4-4v3" />
          </>
        )}
        {safeIdx === 8 && (
          <>
            <path d="M4 25h24M7 25L16 7l9 18" />
            <path d="M16 7v18m-4 0l4-6 4 6" />
          </>
        )}
        {safeIdx === 9 && (
          <path d="M16 5l9 4v7c0 5.5-3.8 9.8-9 11-5.2-1.2-9-5.5-9-11V9l9-4z" />
        )}
        {safeIdx === 10 && (
          <>
            <path d="M7 25h18M9 25v-8a7 7 0 0 1 14 0v8" />
            <path d="M16 6v4m-2-2h4" />
          </>
        )}
        {safeIdx === 11 && (
          <path d="M6 22l2-11 8 5 8-5 2 11H6z" />
        )}
      </svg>
    </div>
  );
};
