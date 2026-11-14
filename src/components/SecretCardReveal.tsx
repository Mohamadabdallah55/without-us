import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, Hand, Lock, ShieldCheck } from 'lucide-react';
import { soundFx } from '../utils/sound';
import { PlayerAvatar } from './SvgAssets';
import revealEmblemUrl from '../assets/images/reveal_curtain_emblem_1794616512527.jpg';

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
        soundFx.playReveal(showOutlierCard);
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
    soundFx.playTap();
    setStage('handover');
    setHoldProgress(0);
    onAcknowledgeAndHide();
  };

  if (stage === 'handover') {
    return (
      <div className="max-w-lg mx-auto w-full bg-[#0B1526] border border-white/10 rounded-3xl p-6 sm:p-8 text-center shadow-2xl space-y-6">
        {playerStepText && (
          <p className="text-xs font-semibold text-teal-300 tabular-nums">{playerStepText}</p>
        )}

        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <PlayerAvatar index={avatarIndex} size="lg" highlighted />
          </div>
          <p className="text-sm text-slate-400">الشاشة محجوبة لحماية سرية الدور</p>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-slate-50">
            سلّم الهاتف إلى <span className="text-amber-300">{playerName}</span>
          </h2>
        </div>

        <div className="p-4 rounded-2xl bg-[#101E36] border border-white/10 text-sm text-slate-300 leading-relaxed flex items-center justify-center gap-2.5">
          <Lock className="w-5 h-5 text-teal-300 shrink-0" />
          <span>تأكد من عدم نظر الآخرين إلى الشاشة قبل التأكيد.</span>
        </div>

        <button
          type="button"
          onClick={() => {
            soundFx.playTap();
            setStage('ready_to_hold');
          }}
          className="w-full min-h-[54px] px-6 rounded-2xl bg-teal-500 hover:bg-teal-400 text-[#051019] font-display font-extrabold text-lg cursor-pointer transition-colors"
        >
          أنا {playerName}، أمسك الهاتف الآن
        </button>
      </div>
    );
  }

  if (stage === 'ready_to_hold') {
    return (
      <div className="max-w-lg mx-auto w-full bg-[#0B1526] border border-white/10 rounded-3xl p-6 sm:p-8 text-center shadow-2xl space-y-6">
        {playerStepText && (
          <p className="text-xs font-semibold text-teal-300 tabular-nums">{playerStepText}</p>
        )}

        <div className="relative w-32 h-32 mx-auto rounded-2xl overflow-hidden border border-amber-400/30">
          <img
            src={revealEmblemUrl}
            alt="بطاقة سرية"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>

        <div>
          <h2 className="font-display font-extrabold text-2xl text-slate-50">
            مرحبًا يا {playerName}
          </h2>
          <p className="text-sm text-slate-300 mt-1.5">
            اضغط مطولًا على الزر بالأسفل لكشف بطاقتك السرية، ولا تتركها ظاهرة!
          </p>
        </div>

        <button
          type="button"
          onPointerDown={startHold}
          onPointerUp={cancelHold}
          onPointerLeave={cancelHold}
          onPointerCancel={cancelHold}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              startHold();
            }
          }}
          onKeyUp={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              cancelHold();
            }
          }}
          className="relative overflow-hidden w-full min-h-[64px] px-6 rounded-2xl bg-[#11223D] border-2 border-amber-400/60 text-amber-200 font-display font-extrabold text-lg select-none cursor-pointer flex items-center justify-center gap-2.5"
        >
          <span
            className="absolute inset-y-0 right-0 bg-amber-400/25 transition-none pointer-events-none"
            style={{ width: `${holdProgress}%` }}
            aria-hidden="true"
          />
          <Hand className="w-5 h-5 relative z-10 text-amber-300" />
          <span className="relative z-10">اضغط مطولًا لكشف البطاقة</span>
        </button>

        {!isPassAndPlay && everRevealed && (
          <button
            type="button"
            onClick={() => setStage('revealed')}
            className="text-xs text-teal-300 hover:underline cursor-pointer inline-flex items-center gap-1"
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
      className={`max-w-lg mx-auto w-full rounded-3xl p-6 sm:p-8 text-center shadow-2xl space-y-6 border-2 transition-transform duration-150 ${
        showOutlierCard
          ? 'bg-gradient-to-b from-[#261B0A] to-[#110D07] border-amber-400/70'
          : 'bg-gradient-to-b from-[#09272D] to-[#081523] border-teal-400/70'
      }`}
    >
      <div className="text-xs font-bold tracking-wide text-slate-300">
        الفئة: <span className="text-slate-50">{categoryNameAr}</span>
      </div>

      {showOutlierCard ? (
        <div className="space-y-4 py-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-400/15 border border-amber-400/40 flex items-center justify-center">
            <ShieldCheck className="w-9 h-9 text-amber-300" />
          </div>
          <h2 className="font-display font-black text-3xl sm:text-4xl text-amber-300">
            أنت مش معنا!
          </h2>
          <p className="text-base sm:text-lg text-amber-100/90 leading-relaxed max-w-sm mx-auto">
            أنت الشخص المختلف في هذه الجولة. حاول تعرف الكلمة السرية من تلميحات اللاعبين دون أن يكشفوك!
          </p>
        </div>
      ) : (
        <div className="space-y-4 py-2">
          <p className="font-display font-extrabold text-lg text-teal-300">
            أنت معنا! كلمتك السرية هي:
          </p>
          <div className="py-5 px-4 rounded-2xl bg-[#070E1A]/90 border border-teal-400/40 shadow-inner">
            <div className="font-display font-black text-3xl sm:text-5xl text-slate-50 leading-snug">
              {secretWord}
            </div>
          </div>
          <p className="text-sm text-teal-100/80">
            تحدث عنها بذكاء دون ذكرها مباشرة حتى لا يكتشفها المختلف!
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={handleHide}
        className={`w-full min-h-[56px] px-6 rounded-2xl font-display font-extrabold text-lg inline-flex items-center justify-center gap-2 cursor-pointer transition-colors ${
          showOutlierCard
            ? 'bg-amber-400 hover:bg-amber-300 text-[#051019]'
            : 'bg-teal-500 hover:bg-teal-400 text-[#051019]'
        }`}
      >
        <EyeOff className="w-5 h-5" />
        <span>{isPassAndPlay ? 'فهمت، أخفِ البطاقة ومرّر الهاتف' : 'فهمت، أخفِ البطاقة'}</span>
      </button>
    </div>
  );
};
