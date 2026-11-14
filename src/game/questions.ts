import { shuffleSecure } from './rules';

export interface Matchup {
  askerId: string;
  answererId: string;
}

export interface QuestionTurn extends Matchup {
  id: string;
  number: number;
  total: number;
}

// One shuffled cycle gives everyone exactly one turn on each side, with
// no self match or reversed duplicate, even in a room with only three people.
export function createMatchups(ids: string[]): Matchup[] {
  if (ids.length < 3 || ids.length > 12 || new Set(ids).size !== ids.length) {
    throw new Error('المواجهات بدها من 3 إلى 12 لاعب مختلف.');
  }
  const order = shuffleSecure(ids);
  return order.map((askerId, i) => ({ askerId, answererId: order[(i + 1) % order.length] }));
}

export function getQuestionTurn(roundId: string, matchups: Matchup[], index: number): QuestionTurn | null {
  const matchup = matchups[index];
  return matchup ? { ...matchup, id: `${roundId}:${matchup.askerId}`, number: index + 1, total: matchups.length } : null;
}

export function postponeMatchup(matchups: Matchup[], index: number): Matchup[] {
  if (index >= matchups.length - 1) return matchups;
  return [...matchups.slice(0, index), ...matchups.slice(index + 1), matchups[index]];
}

export function timerDeadline(seconds: number, now = Date.now()): number | null {
  return seconds > 0 ? now + seconds * 1000 : null;
}

export function secondsLeft(deadline: number | null, now = Date.now()): number {
  return deadline === null ? 0 : Math.max(0, Math.ceil((deadline - now) / 1000));
}
