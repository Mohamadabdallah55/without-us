import React from 'react';

/**
 * Bespoke inline SVG Title Emblem & Geometric Arabic Lockup
 * No external logo dependencies; pure vector craft in midnight navy, turquoise, and warm gold.
 */
export const GameBrandLockup: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="inline-flex items-center gap-3 select-none">
        <svg viewBox="0 0 44 44" className="w-9 h-9 shrink-0" aria-hidden="true">
          <defs>
            <linearGradient id="gmGoldCompact" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#F5C451" />
              <stop offset="100%" stopColor="#D4A13E" />
            </linearGradient>
          </defs>
          <polygon
            points="22,2 27.8,8.2 36.2,8.2 36.2,16.6 42,22 36.2,27.4 36.2,35.8 27.8,35.8 22,42 16.2,35.8 7.8,35.8 7.8,27.4 2,22 7.8,16.6 7.8,8.2 16.2,8.2"
            fill="#0B1526"
            stroke="url(#gmGoldCompact)"
            strokeWidth="2"
          />
          <circle cx="22" cy="22" r="9" fill="none" stroke="#2DD4BF" strokeWidth="1.8" />
          <path d="M22 15v8m0 4h.01" stroke="#F5C451" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
        <span className="font-display font-extrabold text-lg sm:text-xl tracking-tight text-slate-50 whitespace-nowrap">
          هو معنا... <span className="text-teal-300">بس مش معنا!</span>
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center select-none">
      <svg viewBox="0 0 120 120" className="w-24 h-24 sm:w-28 sm:h-28 mb-4 drop-shadow-[0_12px_28px_rgba(20,184,166,0.22)]" aria-hidden="true">
        <defs>
          <linearGradient id="gmGoldHero" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="50%" stopColor="#F5C451" />
            <stop offset="100%" stopColor="#B47B1E" />
          </linearGradient>
          <linearGradient id="gmTealHero" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2DD4BF" />
            <stop offset="100%" stopColor="#0D9488" />
          </linearGradient>
        </defs>
        {/* Outer eight-pointed Islamic geometric star */}
        <polygon
          points="60,6 75,21 99,21 99,45 114,60 99,75 99,99 75,99 60,114 45,99 21,99 21,75 6,60 21,45 21,21 45,21"
          fill="#0B1526"
          stroke="url(#gmGoldHero)"
          strokeWidth="2.5"
        />
        <polygon
          points="60,14 72,26 92,26 92,48 106,60 92,72 92,94 72,94 60,106 48,94 28,94 28,72 14,60 28,48 28,26 48,26"
          fill="none"
          stroke="url(#gmTealHero)"
          strokeWidth="1.5"
          opacity="0.7"
        />
        {/* Four interlocking majlis arcs representing the group + 1 glowing hidden question mark */}
        <circle cx="60" cy="60" r="24" fill="#070E1A" stroke="url(#gmTealHero)" strokeWidth="2.5" />
        <path
          d="M52.5 51.5c0-4.4 3.4-7.5 7.8-7.5 4.4 0 7.7 3 7.7 6.8 0 3.2-1.8 5.2-4.8 6.8-2.2 1.2-3.2 2.4-3.2 4.9v1.5"
          fill="none"
          stroke="url(#gmGoldHero)"
          strokeWidth="4.2"
          strokeLinecap="round"
        />
        <circle cx="60" cy="73.5" r="2.8" fill="#2DD4BF" />
      </svg>
      <h1 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl tracking-tight text-slate-50 leading-tight [text-wrap:balance]">
        هو معنا... <span className="text-teal-300">بس مش معنا!</span>
      </h1>
    </div>
  );
};

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
