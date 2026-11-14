import React, { useState } from 'react';
import { Award, Crown, Flame, RotateCcw, Sparkles, Trash2 } from 'lucide-react';
import type { PlayerPublic, RoundRevealSummary } from '../types/game';
import { PlayerAvatar } from './SvgAssets';

export const SuspicionMomentBanner: React.FC<{ secondsLeft: number }> = ({ secondsLeft }) => (
  <div className="max-w-xl mx-auto w-full bg-paper border border-amber-400/50 rounded-3xl p-10 text-center party-panel party-stage-in space-y-5">
    <p className="text-sm font-bold text-berry tracking-wide">لحظة الشك</p>
    <h2 className="font-display font-black text-3xl sm:text-5xl text-berry">
      مين فيكم مش معنا؟
    </h2>
    <div className="font-display font-black text-7xl text-ink tabular-nums">
      {secondsLeft}
    </div>
    <p className="text-sm text-caption">استعدوا للتصويت السري الآن...</p>
  </div>
);

export const OutlierGuessStage: React.FC<{
  outlierNames: string[];
  categoryNameAr: string;
  canSubmit: boolean;
  onSubmitGuess: (guess: string) => void;
}> = ({ outlierNames, categoryNameAr, canSubmit, onSubmitGuess }) => {
  const [guess, setGuess] = useState('');

  return (
    <div className="max-w-lg mx-auto w-full bg-paper border border-amber-400/60 rounded-3xl p-6 sm:p-8 text-center party-panel party-stage-in space-y-5">
      <p className="text-xs font-bold text-berry">فرصة أخيرة للمختلف!</p>
      <h2 className="font-display font-black text-2xl sm:text-3xl text-ink">
        تم كشف <span className="text-berry">{outlierNames.join('، ')}</span>!
      </h2>
      <p className="text-sm text-caption leading-relaxed">
        لديه فرصة واحدة الآن لتخمين الكلمة السرية من فئة <strong className="text-berry">{categoryNameAr}</strong> لكسب نقطة إضافية.
      </p>

      {canSubmit ? (
        <div className="space-y-3">
          <input
            type="text"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onSubmitGuess(guess);
              }
            }}
            placeholder="اكتب تخمينك للكلمة السرية..."
            className="w-full min-h-[50px] px-4 rounded-xl bg-paper border border-amber-400/40 text-ink text-center font-bold focus:outline-none focus:border-amber-300"
          />
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onSubmitGuess('')}
              className="min-h-[48px] rounded-xl bg-lilac hover:bg-lilac text-caption font-semibold cursor-pointer"
            >
              مش عارف، تخطّي
            </button>
            <button
              type="button"
              onClick={() => onSubmitGuess(guess)}
              className="min-h-[48px] rounded-xl bg-lemon hover:bg-lemon text-ink font-extrabold cursor-pointer"
            >
              تثبيت التخمين
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-berry py-3">
          بانتظار إدخال التخمين من {outlierNames.join('، ')}...
        </p>
      )}
    </div>
  );
};

interface RevealAndResultsProps {
  phase: 'REVEAL' | 'RESULTS' | 'FINAL_WINNER';
  summary: RoundRevealSummary;
  players: PlayerPublic[];
  canControl: boolean;
  onNextStep: () => void;
  onPlayAgainSameSettings?: () => void;
  onExitHome?: () => void;
  onDeleteSessionData?: () => void;
}

export const RevealAndResults: React.FC<RevealAndResultsProps> = ({
  phase,
  summary,
  players,
  canControl,
  onNextStep,
  onPlayAgainSameSettings,
  onExitHome,
  onDeleteSessionData,
}) => {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const topScore = sorted[0]?.score ?? 0;
  const winners = sorted.filter((p) => p.score === topScore);

  if (phase === 'REVEAL') {
    const allEscaped = summary.caughtOutlierIds.length === 0;
    return (
      <div className="max-w-3xl mx-auto w-full bg-paper border border-ink/25 rounded-3xl p-6 sm:p-8 party-panel party-stage-in space-y-6">
        <div className="text-center space-y-2">
          <p className="text-xs font-bold text-berry">كشف الحقيقة · الجولة {summary.roundNumber}</p>
          <h2 className="font-display font-black text-3xl sm:text-4xl text-ink">
            {summary.outlierIds.length > 1 ? 'اللاعبان المختلفان هما:' : 'الشخص المختلف كان:'}
          </h2>
          <div className="text-3xl sm:text-4xl font-display font-black text-berry py-1">
            {summary.outlierNames.join('  و  ')}
          </div>
          <p className="text-sm font-semibold text-caption">
            {allEscaped
              ? 'نجح المختلف في التمويه ولم يتم كشفه!'
              : 'أحسنتم! تم كشف المختلف عبر التصويت.'}
          </p>
        </div>

        {/* Secret Words Revealed */}
        {summary.gameMode === 'confusing_pair' && summary.wordB ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-mintplay border border-teal-400/40 text-center space-y-1">
              <p className="text-xs text-berry font-semibold">كلمة الأغلبية</p>
              <p className="font-display font-black text-2xl sm:text-3xl text-ink">{summary.wordA}</p>
            </div>
            <div className="p-5 rounded-2xl bg-lemon border border-amber-400/40 text-center space-y-1">
              <p className="text-xs text-berry font-semibold">كلمة الملخبط</p>
              <p className="font-display font-black text-2xl sm:text-3xl text-ink">{summary.wordB}</p>
            </div>
            {summary.reasonAr && (
              <div className="sm:col-span-2 p-4 rounded-2xl bg-lilac border border-ink/25 text-sm text-ink leading-relaxed text-center">
                <strong className="text-berry">الفرق بين الكلمتين: </strong>
                {summary.reasonAr}
              </div>
            )}
          </div>
        ) : (
          <div className="p-5 rounded-2xl bg-mintplay border border-teal-400/40 text-center space-y-2">
            <p className="text-xs text-berry font-semibold">الكلمة السرية كانت ({summary.categoryNameAr})</p>
            <p className="font-display font-black text-3xl sm:text-4xl text-ink">{summary.wordA}</p>
            {summary.outlierGuessText !== undefined && summary.outlierGuessText !== '' && (
              <p
                className={`text-sm font-bold pt-1 ${
                  summary.outlierGuessCorrect ? 'text-emerald-300' : 'text-rose-800'
                }`}
              >
                تخمين المختلف («{summary.outlierGuessText}»):{' '}
                {summary.outlierGuessCorrect ? 'إجابة صحيحة! (+1 نقطة)' : 'تخمين غير صحيح'}
              </p>
            )}
          </div>
        )}

        {/* Voting Breakdown */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-caption">تفاصيل الأصوات في هذه الجولة:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {summary.votesBreakdown.map((v) => (
              <div
                key={v.voterId}
                className="p-3 rounded-xl bg-lilac border border-ink/25 flex items-center justify-between gap-2"
              >
                <span className="font-bold text-ink">{v.voterName}</span>
                <span className="text-caption">
                  صوّت لـ <strong className="text-berry">{v.targetNames.join('، ')}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>

        {canControl && (
          <button
            type="button"
            onClick={onNextStep}
            className="w-full min-h-[54px] px-6 rounded-2xl bg-mintplay hover:bg-mintplay text-ink font-display font-extrabold text-lg cursor-pointer"
          >
            {summary.isFinalRound ? 'عرض التتويج والنتائج النهائية' : 'عرض جدول النقاط والانتقال للتالي'}
          </button>
        )}
      </div>
    );
  }

  // RESULTS or FINAL_WINNER
  const isFinal = phase === 'FINAL_WINNER';
  return (
    <div data-celebrate={isFinal} className="max-w-3xl mx-auto w-full bg-paper border border-ink/25 rounded-3xl p-6 sm:p-8 party-panel party-stage-in space-y-6">
      {summary.leaderChanged && !isFinal && summary.newLeaderName && (
        <div className="p-3.5 rounded-2xl bg-amber-400/15 border border-amber-400/50 text-center flex items-center justify-center gap-2 text-berry font-display font-extrabold text-lg">
          <Flame className="w-5 h-5" />
          <span>الصدارة تغيّرت! المتصدر الآن: {summary.newLeaderName}</span>
        </div>
      )}

      <div className="text-center space-y-2">
        {isFinal ? (
          <>
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center">
              <Crown className="w-9 h-9 text-berry" />
            </div>
            <p className="text-sm font-bold text-berry">يا سلام… خلصت المباراة!</p>
            <h2 className="font-display font-black text-3xl sm:text-5xl text-berry">
              {winners.length > 1 ? 'فائزون بالمركز الأول!' : 'بطل الجلسة!'}
            </h2>
            <p className="font-display font-black text-2xl sm:text-3xl text-ink">
              {winners.map((w) => w.name).join(' و ')} · <span className="tabular-nums text-berry">{topScore} نقطة</span>
            </p>
          </>
        ) : (
          <>
            <p className="text-xs font-bold text-berry tabular-nums">
              نهاية الجولة {summary.roundNumber}
            </p>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-ink">
              ترتيب الصدارة الحالي
            </h2>
          </>
        )}
      </div>

      {/* Leaderboard */}
      <div className="space-y-2.5">
        {sorted.map((p, idx) => {
          const delta = summary.scoreDeltas[p.id] || 0;
          const isFirst = idx === 0 && p.score > 0;
          return (
            <div
              key={p.id}
              className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                isFirst
                  ? 'bg-amber-400/15 border-amber-400/50'
                  : 'bg-lilac border-ink/25'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-7 text-center font-display font-black text-lg tabular-nums text-caption">
                  {idx + 1}
                </span>
                <PlayerAvatar index={p.avatarIndex} size="sm" highlighted={isFirst} />
                <span className="font-display font-bold text-base sm:text-lg text-ink truncate">
                  {p.name}
                </span>
                {isFirst && <Award className="w-4 h-4 text-berry shrink-0" />}
              </div>

              <div className="flex items-center gap-3 shrink-0 tabular-nums">
                {delta > 0 && (
                  <span className="text-xs font-bold text-berry">+{delta}</span>
                )}
                <span className="font-display font-black text-xl text-ink">
                  {p.score} <span className="text-xs font-normal text-caption">نقطة</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      {isFinal ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {onPlayAgainSameSettings && (
            <button
              type="button"
              onClick={onPlayAgainSameSettings}
              className="min-h-[54px] px-5 rounded-2xl bg-mintplay hover:bg-mintplay text-ink font-display font-extrabold text-base inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" />
              <span>لعب مباراة جديدة بنفس الإعدادات</span>
            </button>
          )}
          {onExitHome && (
            <button
              type="button"
              onClick={onExitHome}
              className="min-h-[54px] px-5 rounded-2xl bg-lilac hover:bg-lilac border border-ink/25 text-ink font-bold text-base inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-5 h-5 text-berry" />
              <span>العودة للرئيسية</span>
            </button>
          )}
          {onDeleteSessionData && (
            <button
              type="button"
              onClick={onDeleteSessionData}
              className="sm:col-span-2 min-h-[44px] px-4 rounded-xl text-xs text-rose-800 hover:bg-rose-500/10 border border-rose-400/25 inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>حذف بيانات هذه الجلسة الآن (خصوصية)</span>
            </button>
          )}
        </div>
      ) : (
        canControl && (
          <button
            type="button"
            onClick={onNextStep}
            className="w-full min-h-[54px] px-6 rounded-2xl bg-lemon hover:bg-lemon text-ink font-display font-extrabold text-lg cursor-pointer"
          >
            بدء الجولة {summary.roundNumber + 1}
          </button>
        )
      )}
    </div>
  );
};
