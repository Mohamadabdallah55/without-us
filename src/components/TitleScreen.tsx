import React, { useEffect } from 'react';
import { MonitorPlay, Settings2, ShieldCheck, Users, Volume2, VolumeX, Zap, Sparkles } from 'lucide-react';
import { GameBrandLockup, GeometricDivider } from './SvgAssets';
import heroBackdropUrl from '../assets/images/hero_majlis_backdrop_1794616510551.jpg';

interface TitleScreenProps {
  wordCount: number;
  pairCount: number;
  cardCount: number;
  muted: boolean;
  reduceMotion: boolean;
  onToggleMute: () => void;
  onToggleReduceMotion: () => void;
  onQuickStart: () => void;
  onCustomSetup: () => void;
  onJoinRoom: () => void;
  onOpenProjector: () => void;
  onOpenAdmin: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  wordCount,
  pairCount,
  cardCount,
  muted,
  reduceMotion,
  onToggleMute,
  onToggleReduceMotion,
  onQuickStart,
  onCustomSetup,
  onJoinRoom,
  onOpenProjector,
  onOpenAdmin,
}) => {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onCustomSetup();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onCustomSetup]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col justify-between bg-[#070E1A]">
      {/* Illustrated 2D Key Art Backdrop with measured scrim */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <img
          src={heroBackdropUrl}
          alt=""
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#070E1A]/85 via-[#070E1A]/65 to-[#070E1A]/95" />
      </div>

      {/* Minimalist HUD Utility Strip */}
      <div className="relative z-10 flex items-center justify-between px-4 sm:px-8 pt-4 sm:pt-6">
        <p className="text-xs sm:text-sm font-medium text-amber-200/90 tracking-wide">
          مكتبة الألعاب الدائمة — مسجد ابن تيمية · الأردن
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleReduceMotion}
            aria-label={reduceMotion ? 'تفعيل الحركة الكاملة' : 'تقليل الحركة'}
            title={reduceMotion ? 'تفعيل الحركة الكاملة' : 'تقليل الحركة'}
            className={`min-h-[44px] px-3 rounded-xl border text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              reduceMotion
                ? 'bg-teal-500/20 border-teal-400/50 text-teal-200'
                : 'bg-[#0B1526]/80 border-white/15 text-slate-300 hover:border-teal-400/40'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">{reduceMotion ? 'حركة مقلّلة' : 'الحركة'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? 'تشغيل المؤثرات الصوتية' : 'كتم الصوت (الوضع الهادئ)'}
            title={muted ? 'تشغيل المؤثرات الصوتية' : 'كتم الصوت'}
            className={`min-h-[44px] px-3 rounded-xl border text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              muted
                ? 'bg-[#0B1526]/85 border-amber-400/35 text-amber-200'
                : 'bg-teal-500/20 border-teal-400/50 text-teal-200'
            }`}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span>{muted ? 'الوضع الهادئ' : 'الصوت مفعّل'}</span>
          </button>
        </div>
      </div>

      {/* Main Focal Centerpiece */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-4xl mx-auto w-full">
        <GameBrandLockup />

        <p className="mt-4 text-lg sm:text-2xl font-semibold text-amber-300 text-center [text-wrap:balance]">
          «كلنا عارفين السالفة... إلا واحد!»
        </p>

        <GeometricDivider />

        {/* Unboxed Verified Bank Summary */}
        <p className="text-sm sm:text-base text-slate-300 text-center tabular-nums">
          <span>{wordCount} كلمة معتمدة</span>
          <span className="mx-2 text-amber-400/70" aria-hidden="true">·</span>
          <span>{pairCount} زوج متشابه</span>
          <span className="mx-2 text-amber-400/70" aria-hidden="true">·</span>
          <span>{cardCount} بطاقة نقاش</span>
        </p>

        {/* Primary Action CTAs */}
        <div className="mt-8 w-full max-w-xl grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <button
            type="button"
            data-start="true"
            onClick={onCustomSetup}
            className="sm:col-span-2 min-h-[56px] px-6 py-4 rounded-2xl bg-teal-500 hover:bg-teal-400 active:scale-[0.99] text-[#051019] font-display font-extrabold text-lg sm:text-xl shadow-[0_14px_34px_rgba(20,184,166,0.32)] transition-all flex items-center justify-center gap-2.5 cursor-pointer whitespace-nowrap"
          >
            <Settings2 className="w-5 h-5" />
            <span>إعداد مباراة جديدة</span>
          </button>

          <button
            type="button"
            onClick={onQuickStart}
            className="min-h-[52px] px-5 py-3.5 rounded-2xl bg-[#112038]/90 hover:bg-[#172A48] border border-amber-400/40 text-amber-200 font-bold text-base transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <Zap className="w-5 h-5 text-amber-300" />
            <span>مباراة سريعة (5 جولات)</span>
          </button>

          <button
            type="button"
            onClick={onJoinRoom}
            className="min-h-[52px] px-5 py-3.5 rounded-2xl bg-[#112038]/90 hover:bg-[#172A48] border border-teal-400/35 text-teal-200 font-bold text-base transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <Users className="w-5 h-5 text-teal-300" />
            <span>انضمام إلى غرفة برمز</span>
          </button>
        </div>

        {/* Secondary Modes Row */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onOpenProjector}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#0B1526]/85 hover:bg-[#12223C] border border-white/15 text-slate-200 text-sm font-medium inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
          >
            <MonitorPlay className="w-4 h-4 text-teal-300" />
            <span>شاشة البروجكتر (16:9)</span>
          </button>

          <button
            type="button"
            onClick={onOpenAdmin}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#0B1526]/85 hover:bg-[#12223C] border border-white/15 text-slate-200 text-sm font-medium inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
          >
            <ShieldCheck className="w-4 h-4 text-amber-300" />
            <span>إدارة بنك الكلمات</span>
          </button>
        </div>
      </main>

      {/* Single flat control hint line */}
      <footer className="relative z-10 pb-5 px-4 text-center">
        <p className="text-xs sm:text-sm text-slate-400">
          3 أوضاع لعب (الكلاسيكي · الملخبط · اثنين مش معنا) — يعمل محليًا بدون ذكاء اصطناعي أثناء اللعب
        </p>
      </footer>
    </div>
  );
};
