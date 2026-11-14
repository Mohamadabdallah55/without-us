import React, { useState } from 'react';
import { Award, Crown, Flame, RotateCcw, Sparkles, Trash2 } from 'lucide-react';
import type { PlayerPublic, RoundRevealSummary } from '../types/game';
import { PlayerAvatar } from './SvgAssets';

export const SuspicionMomentBanner: React.FC<{ secondsLeft: number }> = ({ secondsLeft }) => (
  <div className="max-w-xl mx-auto w-full bg-[#0B1526] border border-amber-400/50 rounded-3xl p-10 text-center shadow-2xl space-y-5">
    <p className="text-sm font-bold text-teal-300 tracking-wide">لحظة الشك</p>
    <h2 className="font-display font-black text-3xl sm:text-5xl text-amber-300">
      مين فيكم مش معنا؟
    </h2>
    <div className="font-display font-black text-7xl text-slate-50 tabular-nums">
      {secondsLeft}
    </div>
    <p className="text-sm text-slate-300">استعدوا للتصويت السري الآن...</p>
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
    <div className="max-w-lg mx-auto w-full bg-[#0B1526] border border-amber-400/60 rounded-3xl p-6 sm:p-8 text-center shadow-2xl space-y-5">
      <p className="text-xs font-bold text-amber-300">فرصة أخيرة للمختلف!</p>
      <h2 className="font-display font-black text-2xl sm:text-3xl text-slate-50">
        تم كشف <span className="text-amber-300">{outlierNames.join('، ')}</span>!
      </h2>
      <p className="text-sm text-slate-300 leading-relaxed">
        لديه فرصة واحدة الآن لتخمين الكلمة السرية من فئة <strong className="text-teal-300">{categoryNameAr}</strong> لكسب نقطة إضافية.
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
            className="w-full min-h-[50px] px-4 rounded-xl bg-[#070E1A] border border-amber-400/40 text-slate-100 text-center font-bold focus:outline-none focus:border-amber-300"
          />
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onSubmitGuess('')}
              className="min-h-[48px] rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold cursor-pointer"
            >
              لا أعرف (تخطي)
            </button>
            <button
              type="button"
              onClick={() => onSubmitGuess(guess)}
              className="min-h-[48px] rounded-xl bg-amber-400 hover:bg-amber-300 text-[#051019] font-extrabold cursor-pointer"
            >
              تثبيت التخمين
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-amber-200/80 py-3">
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
      <div className="max-w-3xl mx-auto w-full bg-[#0B1526] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <p className="text-xs font-bold text-teal-300">كشف الحقيقة · الجولة {summary.roundNumber}</p>
          <h2 className="font-display font-black text-3xl sm:text-4xl text-slate-50">
            {summary.outlierIds.length > 1 ? 'اللاعبان المختلفان هما:' : 'الشخص المختلف كان:'}
          </h2>
          <div className="text-3xl sm:text-4xl font-display font-black text-amber-300 py-1">
            {summary.outlierNames.join('  و  ')}
          </div>
          <p className="text-sm font-semibold text-slate-300">
            {allEscaped
              ? 'نجح المختلف في التمويه ولم يتم كشفه!'
              : 'أحسنتم! تم كشف المختلف عبر التصويت.'}
          </p>
        </div>

        {/* Secret Words Revealed */}
        {summary.gameMode === 'confusing_pair' && summary.wordB ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-[#09272D] border border-teal-400/40 text-center space-y-1">
              <p className="text-xs text-teal-300 font-semibold">كلمة الأغلبية</p>
              <p className="font-display font-black text-2xl sm:text-3xl text-slate-50">{summary.wordA}</p>
            </div>
            <div className="p-5 rounded-2xl bg-[#261B0A] border border-amber-400/40 text-center space-y-1">
              <p className="text-xs text-amber-300 font-semibold">كلمة الملخبط</p>
              <p className="font-display font-black text-2xl sm:text-3xl text-slate-50">{summary.wordB}</p>
            </div>
            {summary.reasonAr && (
              <div className="sm:col-span-2 p-4 rounded-2xl bg-[#101E36] border border-white/10 text-sm text-slate-200 leading-relaxed text-center">
                <strong className="text-amber-300">الفرق بين الكلمتين: </strong>
                {summary.reasonAr}
              </div>
            )}
          </div>
        ) : (
          <div className="p-5 rounded-2xl bg-[#09272D] border border-teal-400/40 text-center space-y-2">
            <p className="text-xs text-teal-300 font-semibold">الكلمة السرية كانت ({summary.categoryNameAr})</p>
            <p className="font-display font-black text-3xl sm:text-4xl text-slate-50">{summary.wordA}</p>
            {summary.outlierGuessText !== undefined && summary.outlierGuessText !== '' && (
              <p
                className={`text-sm font-bold pt-1 ${
                  summary.outlierGuessCorrect ? 'text-emerald-300' : 'text-rose-300'
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
          <h3 className="text-sm font-bold text-slate-300">تفاصيل الأصوات في هذه الجولة:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {summary.votesBreakdown.map((v) => (
              <div
                key={v.voterId}
                className="p-3 rounded-xl bg-[#101E36] border border-white/10 flex items-center justify-between gap-2"
              >
                <span className="font-bold text-slate-200">{v.voterName}</span>
                <span className="text-slate-400">
                  صوّت لـ <strong className="text-amber-300">{v.targetNames.join('، ')}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>

        {canControl && (
          <button
            type="button"
            onClick={onNextStep}
            className="w-full min-h-[54px] px-6 rounded-2xl bg-teal-500 hover:bg-teal-400 text-[#051019] font-display font-extrabold text-lg cursor-pointer"
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
    <div className="max-w-3xl mx-auto w-full bg-[#0B1526] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
      {summary.leaderChanged && !isFinal && summary.newLeaderName && (
        <div className="p-3.5 rounded-2xl bg-amber-400/15 border border-amber-400/50 text-center flex items-center justify-center gap-2 text-amber-300 font-display font-extrabold text-lg">
          <Flame className="w-5 h-5" />
          <span>الصدارة تغيّرت! المتصدر الآن: {summary.newLeaderName}</span>
        </div>
      )}

      <div className="text-center space-y-2">
        {isFinal ? (
          <>
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center">
              <Crown className="w-9 h-9 text-amber-300" />
            </div>
            <p className="text-sm font-bold text-teal-300">انتهت المباراة!</p>
            <h2 className="font-display font-black text-3xl sm:text-5xl text-amber-300">
              {winners.length > 1 ? 'فائزون بالمركز الأول!' : 'بطل الجلسة!'}
            </h2>
            <p className="font-display font-black text-2xl sm:text-3xl text-slate-50">
              {winners.map((w) => w.name).join(' و ')} · <span className="tabular-nums text-teal-300">{topScore} نقطة</span>
            </p>
          </>
        ) : (
          <>
            <p className="text-xs font-bold text-teal-300 tabular-nums">
              نهاية الجولة {summary.roundNumber}
            </p>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-slate-50">
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
                  : 'bg-[#101E36] border-white/10'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-7 text-center font-display font-black text-lg tabular-nums text-slate-300">
                  {idx + 1}
                </span>
                <PlayerAvatar index={p.avatarIndex} size="sm" highlighted={isFirst} />
                <span className="font-display font-bold text-base sm:text-lg text-slate-50 truncate">
                  {p.name}
                </span>
                {isFirst && <Award className="w-4 h-4 text-amber-300 shrink-0" />}
              </div>

              <div className="flex items-center gap-3 shrink-0 tabular-nums">
                {delta > 0 && (
                  <span className="text-xs font-bold text-teal-300">+{delta}</span>
                )}
                <span className="font-display font-black text-xl text-slate-50">
                  {p.score} <span className="text-xs font-normal text-slate-400">نقطة</span>
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
              className="min-h-[54px] px-5 rounded-2xl bg-teal-500 hover:bg-teal-400 text-[#051019] font-display font-extrabold text-base inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" />
              <span>لعب مباراة جديدة بنفس الإعدادات</span>
            </button>
          )}
          {onExitHome && (
            <button
              type="button"
              onClick={onExitHome}
              className="min-h-[54px] px-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 font-bold text-base inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>العودة للرئيسية</span>
            </button>
          )}
          {onDeleteSessionData && (
            <button
              type="button"
              onClick={onDeleteSessionData}
              className="sm:col-span-2 min-h-[44px] px-4 rounded-xl text-xs text-rose-300 hover:bg-rose-500/10 border border-rose-400/25 inline-flex items-center justify-center gap-1.5 cursor-pointer"
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
            className="w-full min-h-[54px] px-6 rounded-2xl bg-amber-400 hover:bg-amber-300 text-[#051019] font-display font-extrabold text-lg cursor-pointer"
          >
            بدء الجولة {summary.roundNumber + 1}
          </button>
        )
      )}
    </div>
  );
};
