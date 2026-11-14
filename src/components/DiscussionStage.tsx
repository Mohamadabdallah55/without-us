import React from 'react';
import { HelpCircle, Pause, Play, RefreshCw, SkipForward, Timer, Vote } from 'lucide-react';
import type { DiscussionCardEntry, PlayerPublic } from '../types/game';
import { PlayerAvatar } from './SvgAssets';

interface DiscussionStageProps {
  currentRound: number;
  totalRounds: number;
  categoryNameAr: string;
  starterPlayer: PlayerPublic | null;
  timerRemaining: number;
  totalSeconds: number;
  timerPaused: boolean;
  activeCard: DiscussionCardEntry | null;
  canControl: boolean; // true for Host or Pass & Play
  onTogglePause: () => void;
  onDrawCard: () => void;
  onStartVoting: () => void;
  onSkipWord?: () => void;
}

export const DiscussionStage: React.FC<DiscussionStageProps> = ({
  currentRound,
  totalRounds,
  categoryNameAr,
  starterPlayer,
  timerRemaining,
  totalSeconds,
  timerPaused,
  activeCard,
  canControl,
  onTogglePause,
  onDrawCard,
  onStartVoting,
  onSkipWord,
}) => {
  const isFinalRound = currentRound >= totalRounds;
  const pct = totalSeconds > 0 ? Math.max(0, Math.min(100, (timerRemaining / totalSeconds) * 100)) : 100;
  const isLow = totalSeconds > 0 && timerRemaining <= 10;

  return (
    <div className="max-w-3xl mx-auto w-full space-y-5">
      {/* Final Round Special Banner */}
      {isFinalRound && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-l from-amber-500/20 via-amber-400/15 to-transparent border border-amber-400/50 text-center">
          <p className="font-display font-extrabold text-amber-300 text-base sm:text-lg">
            الجولة الأخيرة — جولة الحسم!
          </p>
        </div>
      )}

      {/* Main Discussion Card */}
      <div className="bg-[#0B1526] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <p className="text-xs text-slate-400 tabular-nums">
              الجولة {currentRound} من {totalRounds} · الفئة: <strong className="text-teal-300">{categoryNameAr}</strong>
            </p>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-slate-50 mt-1">
              مرحلة النقاش والأسئلة
            </h2>
          </div>

          {canControl && onSkipWord && (
            <button
              type="button"
              onClick={onSkipWord}
              className="min-h-[40px] px-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>تخطي الكلمة</span>
            </button>
          )}
        </div>

        {/* Starter Player Highlight */}
        {starterPlayer && (
          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#101E36] border border-teal-400/30">
            <PlayerAvatar index={starterPlayer.avatarIndex} size="md" highlighted />
            <div>
              <p className="text-xs text-teal-300 font-semibold">يبدأ النقاش في هذه الجولة:</p>
              <p className="font-display font-extrabold text-xl text-slate-50">{starterPlayer.name}</p>
            </div>
          </div>
        )}

        {/* Timer Display */}
        <div className="text-center py-2 space-y-3">
          {totalSeconds > 0 ? (
            <>
              <div
                className={`font-display font-black text-6xl sm:text-7xl tabular-nums transition-colors ${
                  isLow ? 'text-rose-400' : timerPaused ? 'text-amber-300' : 'text-teal-300'
                }`}
              >
                {timerRemaining}
                <span className="text-xl font-bold text-slate-400 mr-2">ث</span>
              </div>
              <div className="w-full h-3 rounded-full bg-[#070E1A] overflow-hidden border border-white/10">
                <div
                  className={`h-full transition-all duration-300 ${
                    isLow ? 'bg-rose-400' : 'bg-teal-400'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {timerPaused && (
                <p className="text-xs font-bold text-amber-300">الوقت متوقف مؤقتًا من قِبل المشرف</p>
              )}
              {timerRemaining === 0 && (
                <p className="text-sm font-bold text-rose-300">انتهى وقت النقاش! انتقلوا إلى التصويت.</p>
              )}
            </>
          ) : (
            <div className="py-4 inline-flex items-center gap-2 text-teal-300 font-bold text-lg">
              <Timer className="w-6 h-6" />
              <span>نقاش مفتوح بلا مؤقت</span>
            </div>
          )}
        </div>

        {/* Discussion Prompt Card */}
        {activeCard && (
          <div className="p-5 rounded-2xl bg-[#11223D] border border-amber-400/45 space-y-2 text-center">
            <p className="text-xs font-bold text-amber-300 tabular-nums">
              بطاقة تنشيط النقاش · {activeCard.id}
            </p>
            <p className="font-display font-bold text-xl sm:text-2xl text-slate-50 leading-relaxed">
              «{activeCard.prompt_ar}»
            </p>
          </div>
        )}

        {/* Controls */}
        {canControl ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <button
              type="button"
              onClick={onDrawCard}
              className="min-h-[52px] px-4 rounded-2xl bg-[#101E36] hover:bg-[#162947] border border-amber-400/40 text-amber-200 font-bold inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <HelpCircle className="w-5 h-5 text-amber-300" />
              <span>بطاقة نقاش</span>
            </button>

            {totalSeconds > 0 ? (
              <button
                type="button"
                onClick={onTogglePause}
                className="min-h-[52px] px-4 rounded-2xl bg-[#101E36] hover:bg-[#162947] border border-white/15 text-slate-200 font-bold inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                {timerPaused ? (
                  <>
                    <Play className="w-5 h-5 text-teal-300" />
                    <span>استئناف الوقت</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-5 h-5 text-amber-300" />
                    <span>إيقاف الوقت</span>
                  </>
                )}
              </button>
            ) : (
              <div className="hidden sm:block" />
            )}

            <button
              type="button"
              onClick={onStartVoting}
              className="min-h-[52px] px-5 rounded-2xl bg-teal-500 hover:bg-teal-400 text-[#051019] font-display font-extrabold inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <Vote className="w-5 h-5" />
              <span>بدء التصويت</span>
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <p className="text-center text-sm text-slate-400">
            ناقشوا الكلمة وجهًا لوجه — سيفعّل المضيف التصويت عند انتهاء النقاش.
          </p>
        )}
      </div>
    </div>
  );
};
