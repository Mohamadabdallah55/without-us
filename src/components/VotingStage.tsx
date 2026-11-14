import React, { useEffect, useState } from 'react';
import { Check, Lock, Scale, ShieldAlert } from 'lucide-react';
import type { GameMode, PlayerPublic } from '../types/game';
import { soundFx } from '../utils/sound';
import { PlayerAvatar } from './SvgAssets';

interface VotingStageProps {
  players: PlayerPublic[];
  currentVoter: PlayerPublic;
  gameMode: GameMode;
  isTieBreaker: boolean;
  tieCandidateIds: string[];
  allowVoteChange: boolean;
  alreadyVotedTargetIds: string[];
  isPassAndPlay: boolean;
  voterProgressText?: string;
  onSubmitVote: (targetIds: string[]) => void | Promise<boolean>;
}

export const VotingStage: React.FC<VotingStageProps> = ({
  players,
  currentVoter,
  gameMode,
  isTieBreaker,
  tieCandidateIds,
  allowVoteChange,
  alreadyVotedTargetIds,
  isPassAndPlay,
  voterProgressText,
  onSubmitVote,
}) => {
  const [handoverGate, setHandoverGate] = useState<boolean>(isPassAndPlay);
  const [selectedIds, setSelectedIds] = useState<string[]>(alreadyVotedTargetIds);
  const [submitted, setSubmitted] = useState<boolean>(alreadyVotedTargetIds.length > 0);
  const [error, setError] = useState<string | null>(null);

  const requiredTargets = !isTieBreaker && gameMode === 'two_outliers' ? 2 : 1;

  const voteKey = alreadyVotedTargetIds.join(',');
  useEffect(() => {
    setHandoverGate(isPassAndPlay);
    setSelectedIds(alreadyVotedTargetIds);
    setSubmitted(alreadyVotedTargetIds.length > 0);
    setError(null);
  }, [currentVoter.id, isPassAndPlay, isTieBreaker, voteKey]);

  const toggleTarget = (id: string) => {
    if (submitted && !allowVoteChange) return;
    if (id === currentVoter.id) return;
    if (isTieBreaker && !tieCandidateIds.includes(id)) return;
    setError(null);
    soundFx.playTap();

    if (requiredTargets === 1) {
      setSelectedIds([id]);
      return;
    }

    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    } else if (selectedIds.length < 2) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds([selectedIds[1], id]);
    }
  };

  const handleConfirm = async () => {
    if (selectedIds.length !== requiredTargets) {
      setError(
        requiredTargets === 2
          ? 'اختر لاعبين اثنين مختلفين قبل ثبّت صوتك.'
          : 'اختر لاعبًا واحدًا قبل ثبّت صوتك.'
      );
      return;
    }
    if (new Set(selectedIds).size !== selectedIds.length) {
      setError('لا يمكن التصويت لنفس اللاعب مرتين.');
      return;
    }
    soundFx.playTap();
    setSubmitted(true);
    if (await onSubmitVote(selectedIds) === false) setSubmitted(false);
  };

  if (handoverGate) {
    return (
      <div className="max-w-lg mx-auto w-full bg-paper border border-ink/25 rounded-3xl p-6 sm:p-8 text-center party-panel party-stage-in space-y-6">
        {voterProgressText && (
          <p className="text-xs font-semibold text-berry tabular-nums">{voterProgressText}</p>
        )}
        <div className="flex flex-col items-center gap-3">
          <PlayerAvatar index={currentVoter.avatarIndex} size="lg" highlighted />
          <p className="text-sm text-caption">التصويت سري بالكامل</p>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-ink">
            ناول التلفون لـ <span className="text-berry">{currentVoter.name}</span> للتصويت
          </h2>
        </div>
        <button
          type="button"
          onClick={() => {
            soundFx.playTap();
            setHandoverGate(false);
          }}
          className="w-full min-h-[54px] px-6 rounded-2xl bg-mintplay hover:bg-mintplay text-ink font-display font-extrabold text-lg cursor-pointer"
        >
          أنا {currentVoter.name}، افتح بطاقة التصويت
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full bg-paper border border-ink/25 rounded-3xl p-6 sm:p-8 party-panel party-stage-in space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/25 pb-4">
        <div>
          {voterProgressText && (
            <p className="text-xs font-semibold text-berry tabular-nums">{voterProgressText}</p>
          )}
          <h2 className="font-display font-black text-2xl sm:text-3xl text-ink mt-0.5 flex items-center gap-2">
            {isTieBreaker && <Scale className="w-6 h-6 text-berry" />}
            <span>
              {isTieBreaker ? 'جولة تصويت فاصلة (تعادل)' : 'بطاقة الاتهام — صوّت سرًا'}
            </span>
          </h2>
          <p className="text-sm text-caption mt-1">
            {isTieBreaker
              ? 'حصل تعادل في الأصوات! صوّتوا لاختيار واحد من المتعادلين فقط.'
              : requiredTargets === 2
              ? `باسم (${currentVoter.name}): اختر لاعبين اثنين تشك بأنهما «مش معنا».`
              : `باسم (${currentVoter.name}): اختر اللاعب الذي تشك أنه المختلف.`}
          </p>
        </div>
      </div>

      {error && (
        <div role="alert" className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-400/40 text-rose-800 text-sm flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {submitted && !allowVoteChange ? (
        <div className="p-8 rounded-2xl bg-lilac border border-teal-400/30 text-center space-y-3">
          <Lock className="w-10 h-10 text-berry mx-auto" />
          <h3 className="font-display font-extrabold text-xl text-ink">
            صوتك وصل!
          </h3>
          <p className="text-sm text-caption">
            لا يمكن تعديل الصوت بعد اعتماده. بانتظار انتهاء بقية اللاعبين...
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {players.map((p) => {
              const isSelf = p.id === currentVoter.id;
              const disabledByTie = isTieBreaker && !tieCandidateIds.includes(p.id);
              const disabled = isSelf || disabledByTie;
              const selected = selectedIds.includes(p.id);

              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => toggleTarget(p.id)}
                  className={`p-4 rounded-2xl border text-right transition-all flex items-center gap-3 min-h-[72px] ${
                    disabled
                      ? 'opacity-35 cursor-not-allowed bg-lilac border-ink/25'
                      : selected
                      ? 'bg-amber-400/20 border-amber-400 ring-1 ring-amber-400 cursor-pointer'
                      : 'bg-lilac border-ink/25 hover:border-teal-400/50 cursor-pointer'
                  }`}
                >
                  <PlayerAvatar index={p.avatarIndex} size="md" highlighted={selected} />
                  <div className="min-w-0 flex-1">
                    <div className="font-display font-bold text-base text-ink truncate">
                      {p.name}
                    </div>
                    <div className="text-xs text-caption mt-0.5">
                      {isSelf
                        ? 'أنت (لا تصوّت لنفسك)'
                        : disabledByTie
                        ? 'خارج التعادل'
                        : selected
                        ? 'تم اختياره'
                        : 'اختاره إذا شاكّ فيه'}
                    </div>
                  </div>
                  {selected && <Check className="w-5 h-5 text-berry shrink-0" />}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            className="w-full min-h-[54px] px-6 rounded-2xl bg-lemon hover:bg-lemon text-ink font-display font-extrabold text-lg cursor-pointer transition-colors"
          >
            ثبّت صوتك ({selectedIds.length}/{requiredTargets})
          </button>
        </>
      )}
    </div>
  );
};
