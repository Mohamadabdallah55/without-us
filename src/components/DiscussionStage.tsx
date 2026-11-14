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
          <p className="font-display font-extrabold text-berry text-base sm:text-lg">
            الجولة الأخيرة — جولة الحسم!
          </p>
        </div>
      )}

      {/* Main Discussion Card */}
      <div className="bg-paper border border-ink/25 rounded-3xl p-6 sm:p-8 party-panel party-stage-in space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/25 pb-4">
          <div>
            <p className="text-xs text-caption tabular-nums">
              الجولة {currentRound} من {totalRounds} · الفئة: <strong className="text-berry">{categoryNameAr}</strong>
            </p>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-ink mt-1">
              احكوا عراحتكم!
            </h2>
          </div>

          {canControl && onSkipWord && (
            <button
              type="button"
              onClick={onSkipWord}
              className="min-h-[40px] px-3.5 rounded-xl bg-lilac hover:bg-lilac border border-ink/25 text-xs font-semibold text-caption inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>تخطي الكلمة</span>
            </button>
          )}
        </div>

        {/* Starter Player Highlight */}
        {starterPlayer && (
          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-lilac border border-teal-400/30">
            <PlayerAvatar index={starterPlayer.avatarIndex} size="md" highlighted />
            <div>
              <p className="text-xs text-berry font-semibold">يبدأ النقاش في هذه الجولة:</p>
              <p className="font-display font-extrabold text-xl text-ink">{starterPlayer.name}</p>
            </div>
          </div>
        )}

        {/* Timer Display */}
        <div className="text-center py-2 space-y-3">
          {totalSeconds > 0 ? (
            <>
              <div
                className={`font-display font-black text-6xl sm:text-7xl tabular-nums transition-colors ${
                  isLow ? 'text-rose-800' : timerPaused ? 'text-berry' : 'text-berry'
                }`}
              >
                {timerRemaining}
                <span className="text-xl font-bold text-caption mr-2">ث</span>
              </div>
              <div className="w-full h-3 rounded-full bg-paper overflow-hidden border border-ink/25">
                <div
                  className={`h-full transition-all duration-300 ${
                    isLow ? 'bg-rose-400' : 'bg-mintplay'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {timerPaused && (
                <p className="text-xs font-bold text-berry">الوقت متوقف مؤقتًا من قِبل المشرف</p>
              )}
              {timerRemaining === 0 && (
                <p className="text-sm font-bold text-rose-800">انتهى وقت النقاش! انتقلوا إلى التصويت.</p>
              )}
            </>
          ) : (
            <div className="py-4 inline-flex items-center gap-2 text-berry font-bold text-lg">
              <Timer className="w-6 h-6" />
              <span>نقاش مفتوح بلا مؤقت</span>
            </div>
          )}
        </div>

        {/* Discussion Prompt Card */}
        {activeCard && (
          <div className="p-5 rounded-2xl bg-lilac border border-amber-400/45 space-y-2 text-center">
            <p className="text-xs font-bold text-berry tabular-nums">
              سؤال مساعد
            </p>
            <p className="font-display font-bold text-xl sm:text-2xl text-ink leading-relaxed">
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
              className="min-h-[52px] px-4 rounded-2xl bg-lilac hover:bg-lilac border border-amber-400/40 text-berry font-bold inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <HelpCircle className="w-5 h-5 text-berry" />
              <span>بطاقة نقاش</span>
            </button>

            {totalSeconds > 0 ? (
              <button
                type="button"
                onClick={onTogglePause}
                className="min-h-[52px] px-4 rounded-2xl bg-lilac hover:bg-lilac border border-ink/25 text-ink font-bold inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                {timerPaused ? (
                  <>
                    <Play className="w-5 h-5 text-berry" />
                    <span>استئناف الوقت</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-5 h-5 text-berry" />
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
              className="min-h-[52px] px-5 rounded-2xl bg-mintplay hover:bg-mintplay text-ink font-display font-extrabold inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <Vote className="w-5 h-5" />
              <span>خلص الحكي… صوّتوا!</span>
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <p className="text-center text-sm text-caption">
            ناقشوا الكلمة وجهًا لوجه — سيفعّل المضيف التصويت عند انتهاء النقاش.
          </p>
        )}
      </div>
    </div>
  );
};
