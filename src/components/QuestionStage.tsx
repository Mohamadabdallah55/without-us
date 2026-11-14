import { useEffect } from 'react';
import { soundFx } from '../utils/sound';
import { ArrowLeft, Clock3, MessageCircle, Shuffle } from 'lucide-react';
import type { QuestionTurn } from '../game/questions';
import type { DiscussionCardEntry, PlayerPublic } from '../types/game';
import { PlayerAvatar } from './SvgAssets';

export function QuestionStage({ turn, players, timer, timed, card, onNext, onPostpone, onCard }: {
  turn: QuestionTurn;
  players: PlayerPublic[];
  timer: number;
  timed: boolean;
  card: DiscussionCardEntry | null;
  onNext?: () => void;
  onPostpone?: () => void;
  onCard?: () => void;
}) {
  useEffect(() => soundFx.playFaceoff(), [turn.id]);
  useEffect(() => {
    if (timed && timer > 0 && timer <= 5) soundFx.playTick();
  }, [timed, timer]);
  const asker = players.find((p) => p.id === turn.askerId);
  const answerer = players.find((p) => p.id === turn.answererId);
  if (!asker || !answerer) return null;
  return (
    <section className="faceoff" aria-label="المواجهات">
      <div className="faceoff-meta">
        <span>المواجهة <bdi dir="ltr">{turn.number}/{turn.total}</bdi></span>
        <span className={timed && timer <= 5 ? 'faceoff-urgent' : ''}><Clock3 size={20} /> {timed ? (timer === 0 ? 'خلص الوقت!' : `${timer} ث`) : 'بلا مؤقت'}</span>
      </div>
      <div className="faceoff-arena" key={turn.id}>
        {[asker, answerer].map((player, i) => (
          <div className="faceoff-player" data-color={player.avatarIndex % 12} key={player.id}>
            <PlayerAvatar index={player.avatarIndex} size="lg" />
            <span>{i === 0 ? 'عليه السؤال' : 'عليه الجواب'}</span>
            <strong>{player.name}</strong>
          </div>
        ))}
        <span className="faceoff-vs" aria-hidden="true">VS</span>
      </div>
      <div className="faceoff-bubble">
        <strong>{asker.name}… اسأل {answerer.name}!</strong>
        <p>{card?.prompt_ar || ['جاوب بصوت عالي، بس دير بالك عالكلمة!', 'خلي جوابك ذكي… الكل بسمع!', 'اسأله وشوف شو رح يجاوب!'][(turn.number - 1) % 3]}</p>
      </div>
      {onNext && <div className="faceoff-controls">
        <button type="button" onClick={onNext}>تم، اللي بعده <ArrowLeft size={20} /></button>
        <div>
          <button type="button" onClick={onCard}><MessageCircle size={18} /> سؤال مساعد</button>
          {turn.number < turn.total && <button type="button" onClick={onPostpone}><Shuffle size={18} /> أجّل المواجهة</button>}
        </div>
      </div>}
    </section>
  );
}
