import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, Hand, Lock, ShieldCheck } from 'lucide-react';
import { soundFx } from '../utils/sound';
import { PlayerAvatar, SuspectMascot } from './SvgAssets';

interface SecretCardRevealProps {
  playerName: string;
  avatarIndex: number;
  categoryNameAr: string;
  secretWord: string | null;
  showOutlierCard: boolean; // ALWAYS false in confusing_pair mode
  isPassAndPlay: boolean;
  playerStepText?: string;
  onAcknowledgeAndHide: () => void;
}

export const SecretCardReveal: React.FC<SecretCardRevealProps> = ({
  playerName,
  avatarIndex,
  categoryNameAr,
  secretWord,
  showOutlierCard,
  isPassAndPlay,
  playerStepText,
  onAcknowledgeAndHide,
}) => {
  // Pass & Play enforces: 'handover' -> 'ready_to_hold' -> 'revealed'
  const [stage, setStage] = useState<'handover' | 'ready_to_hold' | 'revealed'>(
    isPassAndPlay ? 'handover' : 'ready_to_hold'
  );
  const [holdProgress, setHoldProgress] = useState(0);
  const [everRevealed, setEverRevealed] = useState(false);
  const holdTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setStage(isPassAndPlay ? 'handover' : 'ready_to_hold');
    setHoldProgress(0);
    setEverRevealed(false);
    return () => {
      if (holdTimerRef.current) window.clearInterval(holdTimerRef.current);
    };
  }, [playerName, isPassAndPlay]);

  useEffect(() => {
    const hide = () => {
      if (holdTimerRef.current !== null) window.clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
      setHoldProgress(0);
      setStage((current) => current === 'revealed' ? 'ready_to_hold' : current);
    };
    window.addEventListener('blur', hide);
    document.addEventListener('visibilitychange', hide);
    return () => {
      window.removeEventListener('blur', hide);
      document.removeEventListener('visibilitychange', hide);
    };
  }, []);

  const startHold = () => {
    if (stage === 'revealed') return;
    if (holdTimerRef.current) window.clearInterval(holdTimerRef.current);
    const start = Date.now();
    const duration = 380; // Crisp intentional hold (~380ms)
    holdTimerRef.current = window.setInterval(() => {
      const pct = Math.min(100, ((Date.now() - start) / duration) * 100);
      setHoldProgress(pct);
      if (pct >= 100) {
        if (holdTimerRef.current) window.clearInterval(holdTimerRef.current);
        holdTimerRef.current = null;
        setStage('revealed');
        setEverRevealed(true);
        soundFx.playCard();
      }
    }, 16);
  };

  const cancelHold = () => {
    if (holdTimerRef.current) {
      window.clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (stage !== 'revealed') {
      setHoldProgress(0);
    }
  };

  const handleHide = () => {
    soundFx.playHide();
    setStage(isPassAndPlay ? 'handover' : 'ready_to_hold');
    setHoldProgress(0);
    onAcknowledgeAndHide();
  };

  if (stage === 'handover') {
    return (
      <div className="max-w-lg mx-auto w-full bg-paper border border-ink/25 rounded-3xl p-6 sm:p-8 text-center party-panel party-stage-in kh-secret-card space-y-6">
        {playerStepText && (
          <p className="text-xs font-semibold text-berry tabular-nums">{playerStepText}</p>
        )}

        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <PlayerAvatar index={avatarIndex} size="lg" highlighted />
          </div>
          <p className="text-sm text-caption">الشاشة محجوبة لحماية سرية الدور</p>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-ink">
            ناول التلفون لـ <span className="text-berry">{playerName}</span>
          </h2>
        </div>

        <div className="p-4 rounded-2xl bg-lilac border border-ink/25 text-sm text-caption leading-relaxed flex items-center justify-center gap-2.5">
          <Lock className="w-5 h-5 text-berry shrink-0" />
          <span>تأكد من عدم نظر الآخرين إلى الشاشة قبل التأكيد.</span>
        </div>

        <button
          type="button"
          onClick={() => {
            soundFx.playTap();
            setStage('ready_to_hold');
          }}
          className="w-full min-h-[54px] px-6 rounded-2xl bg-mintplay hover:bg-mintplay text-ink font-display font-extrabold text-lg cursor-pointer transition-colors"
        >
          أنا {playerName}، أمسك الهاتف الآن
        </button>
      </div>
    );
  }

  if (stage === 'ready_to_hold') {
    return (
      <div className="max-w-lg mx-auto w-full bg-paper border border-ink/25 rounded-3xl p-6 sm:p-8 text-center party-panel party-stage-in kh-secret-card space-y-6">
        {playerStepText && (
          <p className="text-xs font-semibold text-berry tabular-nums">{playerStepText}</p>
        )}

        <div className="secret-mascot"><SuspectMascot /></div>

        <div>
          <h2 className="font-display font-extrabold text-2xl text-ink">
            مرحبًا يا {playerName}
          </h2>
          <p className="text-sm text-caption mt-1.5">
            اضغط شوي عالزر، ودير بالك حدا يشوفها!
          </p>
        </div>

        <button
          type="button"
          onPointerDown={startHold}
          onContextMenu={(e) => e.preventDefault()}
          onPointerUp={cancelHold}
          onPointerLeave={cancelHold}
          onPointerCancel={cancelHold}
          onKeyDown={(e) => {
            if (!e.repeat && (e.key === ' ' || e.key === 'Enter')) {
              e.preventDefault();
              startHold();
            }
          }}
          onKeyUp={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              cancelHold();
            }
          }}
          className="relative overflow-hidden w-full min-h-[64px] px-6 rounded-2xl bg-lilac border-2 border-amber-400/60 text-berry font-display font-extrabold text-lg touch-none select-none cursor-pointer flex items-center justify-center gap-2.5"
        >
          <span
            className="absolute inset-y-0 right-0 bg-amber-400/25 transition-none pointer-events-none"
            style={{ width: `${holdProgress}%` }}
            aria-hidden="true"
          />
          <Hand className="w-5 h-5 relative z-10 text-berry" />
          <span className="relative z-10">اضغط مطولًا لكشف البطاقة</span>
        </button>

        {!isPassAndPlay && everRevealed && (
          <button
            type="button"
            onClick={() => {setStage('revealed');setEverRevealed(true);soundFx.playCard();}}
            className="text-xs text-berry hover:underline cursor-pointer inline-flex items-center gap-1"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>إظهار بطاقتي مجددًا</span>
          </button>
        )}
      </div>
    );
  }

  // Revealed state: Two sharply distinct designs!
  return (
    <div
      className={`max-w-lg mx-auto w-full rounded-3xl p-6 sm:p-8 text-center party-panel party-stage-in kh-secret-card space-y-6 border-2 transition-transform duration-150 ${
        showOutlierCard
          ? 'bg-gradient-to-b from-lemon to-paper border-amber-400/70'
          : 'bg-gradient-to-b from-mintplay to-paper border-teal-400/70'
      }`}
    >
      <div className="text-xs font-bold tracking-wide text-caption">
        الفئة: <span className="text-ink">{categoryNameAr}</span>
      </div>

      {showOutlierCard ? (
        <div className="space-y-4 py-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-400/15 border border-amber-400/40 flex items-center justify-center">
            <ShieldCheck className="w-9 h-9 text-berry" />
          </div>
          <h2 className="font-display font-black text-3xl sm:text-4xl text-berry">
            أنت مش معنا!
          </h2>
          <p className="text-base sm:text-lg text-berry leading-relaxed max-w-sm mx-auto">
            أنت الشخص المختلف في هذه الجولة. حاول تعرف الكلمة السرية من تلميحات اللاعبين دون أن يكشفوك!
          </p>
        </div>
      ) : (
        <div className="space-y-4 py-2">
          <p className="font-display font-extrabold text-lg text-berry">
            هاي كلمتك السرية:
          </p>
          <div className="py-5 px-4 rounded-2xl bg-paper/90 border border-teal-400/40 shadow-inner">
            <div className="font-display font-black text-3xl sm:text-5xl text-ink leading-snug">
              {secretWord}
            </div>
          </div>
          <p className="text-sm text-berry">
            تحدث عنها بذكاء دون ذكرها مباشرة حتى لا يكتشفها المختلف!
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={handleHide}
        className={`w-full min-h-[56px] px-6 rounded-2xl font-display font-extrabold text-lg inline-flex items-center justify-center gap-2 cursor-pointer transition-colors ${
          showOutlierCard
            ? 'bg-lemon hover:bg-lemon text-ink'
            : 'bg-mintplay hover:bg-mintplay text-ink'
        }`}
      >
        <EyeOff className="w-5 h-5" />
        <span>{isPassAndPlay ? 'تمام، خبّيها وناول التلفون' : 'تمام، خبّيها'}</span>
      </button>
    </div>
  );
};
