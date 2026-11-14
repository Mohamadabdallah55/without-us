import { ArrowLeft, MonitorPlay, Settings2, Sparkles, Users, Volume2, VolumeX, Zap } from 'lucide-react';
import type { SoundMode } from '../utils/sound';
import { GAME_BRAND } from '../game/brand';
import { GameBrandLockup, SuspectMascot } from './SvgAssets';

interface TitleScreenProps {
  wordCount: number;
  pairCount: number;
  cardCount: number;
  soundMode: SoundMode;
  reduceMotion: boolean;
  onChangeSoundMode: () => void;
  onToggleReduceMotion: () => void;
  onQuickStart: () => void;
  onCustomSetup: () => void;
  onJoinRoom: () => void;
  onOpenProjector: () => void;
  onOpenAdmin: () => void;
}

export function TitleScreen(props: TitleScreenProps) {
  return (
    <div className="party-home">
      <header className="party-top">
        <GameBrandLockup compact />
        <div>
          <button type="button" onClick={props.onToggleReduceMotion} aria-pressed={props.reduceMotion} aria-label="تقليل الحركة"><Sparkles size={17} /></button>
          <button type="button" onClick={props.onChangeSoundMode} aria-label="بدّل وضع الصوت">
            {props.soundMode === 'muted' ? <VolumeX size={17} /> : <Volume2 size={17} />}
            <span>{props.soundMode === 'muted' ? 'الصوت مكتوم' : props.soundMode === 'quiet' ? 'الوضع الهادئ' : 'الصوت شغّال'}</span>
          </button>
        </div>
      </header>
      <main className="party-hero">
        <div className="party-hero-copy">
          <p className="party-sticker"><Sparkles size={17} /> لعبة قعدة · ٣–١٢ لاعب</p>
          <h1 className="party-wordmark">{GAME_BRAND.name}</h1>
          <p className="party-slogan">«{GAME_BRAND.slogan}»</p>
          <p>اسأل، لفّ ودوّر، واكشف مين اللي ضايع بالسالفة.</p>
          <div className="party-home-actions">
            <button className="party-primary" type="button" onClick={props.onCustomSetup}>يلا نبلّش! <ArrowLeft size={23} /></button>
            <button type="button" onClick={props.onQuickStart}><Zap size={19} /> مباراة سريعة</button>
            <button type="button" onClick={props.onJoinRoom}><Users size={19} /> انضم لغرفة</button>
          </div>
        </div>
        <div className="party-hero-art">
          <span className="party-art-bubble">حاسّين في إشي غلط؟</span>
          <SuspectMascot />
          <span className="party-art-label" aria-hidden="true">؟!</span>
        </div>
      </main>
      <footer className="party-footer">
        <p>{props.wordCount} كلمة معتمدة · {props.pairCount} زوج متشابه · {props.cardCount} سؤال مساعد</p>
        <div>
          <button type="button" onClick={props.onOpenProjector}><MonitorPlay size={18} /> شاشة البروجكتر</button>
          <button type="button" onClick={props.onOpenAdmin}><Settings2 size={17} /> بنك الكلمات</button>
        </div>
        <small>الناشر: {GAME_BRAND.publisher}</small>
      </footer>
    </div>
  );
}
