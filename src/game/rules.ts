import { normalizeArabic } from './arabic';
import {
  filterDiscussionCardsForCategory,
  filterPairsForPlay,
  filterWordsForPlay,
} from './wordBankService';
import type {
  GameConfig,
  GameMode,
  PlayerPublic,
  RoundRevealSummary,
  ScoringRules,
  WordBankData,
} from '../types/game';

export const DEFAULT_SCORING_RULES: ScoringRules = {
  classicCorrectVote: 1,
  classicOutlierSurvive: 2,
  classicOutlierGuessBonus: 1,
  confusingCorrectVote: 1,
  confusingOutlierSurvive: 2,
  twoOutliersPerCorrectVote: 1,
  twoOutliersSurviveEach: 2,
};

export const DEFAULT_GAME_CONFIG: GameConfig = {
  deviceMode: 'single_device',
  gameMode: 'classic',
  categories: [
    'CAT_FOOD',
    'CAT_JORDAN',
    'CAT_EDU',
    'CAT_SEASONS',
    'CAT_ISLAMIC',
    'CAT_SPORTS',
    'CAT_NATURE',
  ],
  ageBand: 'families_mixed',
  maxDifficulty: 3,
  totalRounds: 5,
  discussionSeconds: 60,
  allowVoteChangeBeforeClose: false,
  scoringRules: { ...DEFAULT_SCORING_RULES },
};

/**
 * Cryptographically uniform integer in [0, maxExclusive).
 * Works in both Node.js and modern browsers via globalThis.crypto.
 */
export function secureRandomInt(maxExclusive: number): number {
  if (maxExclusive <= 1) return 0;
  const maxUint = 0xffffffff;
  const limit = maxUint - (maxUint % maxExclusive);
  const buf = new Uint32Array(1);
  while (true) {
    globalThis.crypto.getRandomValues(buf);
    if (buf[0] < limit) {
      return buf[0] % maxExclusive;
    }
  }
}

export function pickRandomItem<T>(items: T[]): T {
  if (items.length === 0) {
    throw new Error('لا توجد عناصر متاحة للاختيار');
  }
  return items[secureRandomInt(items.length)];
}

export function shuffleSecure<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function validateMatchStart(
  playerCount: number,
  config: GameConfig,
  bank: WordBankData
): { valid: boolean; error?: string } {
  if (config.gameMode === 'two_outliers') {
    if (playerCount < 8) {
      return {
        valid: false,
        error: 'وضع «اثنين مش معنا» يتطلب 8 لاعبين على الأقل لضمان توازن اللعب.',
      };
    }
  } else {
    if (playerCount < 3) {
      return {
        valid: false,
        error: 'اللعبة تتطلب 3 لاعبين على الأقل للبدء.',
      };
    }
  }

  if (playerCount > 12) {
    return {
      valid: false,
      error: 'الحد الأقصى لعدد اللاعبين في الغرفة هو 12 لاعبًا.',
    };
  }

  if (config.categories.length === 0) {
    return {
      valid: false,
      error: 'اختر فئة واحدة على الأقل قبل بدء المباراة.',
    };
  }

  if (config.gameMode === 'confusing_pair') {
    const pairs = filterPairsForPlay(bank, {
      categories: config.categories,
      ageBand: config.ageBand,
      maxDifficulty: config.maxDifficulty,
      playedPairIdsHistory: [],
    });
    if (pairs.length === 0) {
      return {
        valid: false,
        error: 'لا توجد أزواج متشابهة معتمدة مطابقة للفئات والعمر المختار. وسّع الفئات أو مستوى الصعوبة.',
      };
    }
  } else {
    const words = filterWordsForPlay(bank, {
      categories: config.categories,
      ageBand: config.ageBand,
      maxDifficulty: config.maxDifficulty,
      playedIdsHistory: [],
    });
    if (words.length === 0) {
      return {
        valid: false,
        error: 'لا توجد كلمات معتمدة مطابقة للفئات والعمر المختار.',
      };
    }
  }

  return { valid: true };
}

export interface SecretRoundAssignment {
  roundNumber: number;
  gameMode: GameMode;
  categoryId: string;
  categoryNameAr: string;
  wordA: string;
  wordB?: string;
  wordIdUsed: string;
  pairIdUsed?: string;
  reasonAr?: string;
  outlierIds: string[];
  playerWords: Record<string, string | null>; // playerId -> secretWord (or null if classic outlier)
  starterPlayerId: string;
}

export function createRoundAssignment(params: {
  roundNumber: number;
  players: Array<{ id: string; name: string }>;
  config: GameConfig;
  bank: WordBankData;
  playedWordIds: string[];
  playedPairIds: string[];
}): SecretRoundAssignment {
  const { roundNumber, players, config, bank, playedWordIds, playedPairIds } = params;
  const validation = validateMatchStart(players.length, config, bank);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const catNameMap = new Map(bank.categories.map((c) => [c.id, c.name_ar]));
  const starterPlayer = players[(roundNumber - 1) % players.length];
  const shuffledPlayers = shuffleSecure(players);

  if (config.gameMode === 'confusing_pair') {
    let eligiblePairs = filterPairsForPlay(bank, {
      categories: config.categories,
      ageBand: config.ageBand,
      maxDifficulty: config.maxDifficulty,
      playedPairIdsHistory: playedPairIds,
    });
    if (eligiblePairs.length === 0) {
      // Fallback only if all eligible pairs in selected filters were exhausted
      eligiblePairs = filterPairsForPlay(bank, {
        categories: config.categories,
        ageBand: config.ageBand,
        maxDifficulty: config.maxDifficulty,
        playedPairIdsHistory: [],
      });
    }
    const pair = pickRandomItem(eligiblePairs);
    const wordMap = new Map(bank.words.map((w) => [w.id, w]));
    const wA = wordMap.get(pair.word_a_id)!;
    const wB = wordMap.get(pair.word_b_id)!;

    // 50% swap of A/B per PDF page 20 specification
    const swap = secureRandomInt(2) === 1;
    const majorityWord = swap ? wB.text_ar : wA.text_ar;
    const outlierWord = swap ? wA.text_ar : wB.text_ar;
    const outlier = shuffledPlayers[0];

    const playerWords: Record<string, string | null> = {};
    for (const p of players) {
      playerWords[p.id] = p.id === outlier.id ? outlierWord : majorityWord;
    }

    return {
      roundNumber,
      gameMode: config.gameMode,
      categoryId: pair.category,
      categoryNameAr: catNameMap.get(pair.category) || pair.category,
      wordA: majorityWord,
      wordB: outlierWord,
      wordIdUsed: wA.id,
      pairIdUsed: pair.id,
      reasonAr: pair.reason_ar,
      outlierIds: [outlier.id],
      playerWords,
      starterPlayerId: starterPlayer.id,
    };
  }

  // Classic or Two Outliers
  let eligibleWords = filterWordsForPlay(bank, {
    categories: config.categories,
    ageBand: config.ageBand,
    maxDifficulty: config.maxDifficulty,
    playedIdsHistory: playedWordIds,
  });
  if (eligibleWords.length === 0) {
    eligibleWords = filterWordsForPlay(bank, {
      categories: config.categories,
      ageBand: config.ageBand,
      maxDifficulty: config.maxDifficulty,
      playedIdsHistory: [],
    });
  }

  const chosenWord = pickRandomItem(eligibleWords);
  const outlierCount = config.gameMode === 'two_outliers' ? 2 : 1;
  const outlierIds = shuffledPlayers.slice(0, outlierCount).map((p) => p.id);
  const outlierSet = new Set(outlierIds);

  const playerWords: Record<string, string | null> = {};
  for (const p of players) {
    playerWords[p.id] = outlierSet.has(p.id) ? null : chosenWord.text_ar;
  }

  return {
    roundNumber,
    gameMode: config.gameMode,
    categoryId: chosenWord.category,
    categoryNameAr: catNameMap.get(chosenWord.category) || chosenWord.category,
    wordA: chosenWord.text_ar,
    wordIdUsed: chosenWord.id,
    outlierIds,
    playerWords,
    starterPlayerId: starterPlayer.id,
  };
}

export function validateVoteSubmission(params: {
  voterId: string;
  targetIds: string[];
  players: Array<{ id: string }>;
  gameMode: GameMode;
  existingVotes: Record<string, string[]>;
  allowVoteChange: boolean;
  tieCandidateIds: string[];
}): { valid: boolean; error?: string } {
  const {
    voterId,
    targetIds,
    players,
    gameMode,
    existingVotes,
    allowVoteChange,
    tieCandidateIds,
  } = params;

  const playerSet = new Set(players.map((p) => p.id));
  if (!playerSet.has(voterId)) {
    return { valid: false, error: 'اللاعب المصوّت غير موجود في الغرفة.' };
  }

  if (existingVotes[voterId] && !allowVoteChange) {
    return { valid: false, error: 'تم اعتماد تصويتك مسبقًا ولا يمكن تغييره في هذه الجولة.' };
  }

  const expectedCount =
    tieCandidateIds.length > 0 ? 1 : gameMode === 'two_outliers' ? 2 : 1;

  if (targetIds.length !== expectedCount) {
    return {
      valid: false,
      error:
        expectedCount === 2
          ? 'يجب اختيار لاعبين اثنين مختلفين في وضع «اثنين مش معنا».'
          : 'يجب اختيار لاعب واحد للتصويت.',
    };
  }

  if (new Set(targetIds).size !== targetIds.length) {
    return { valid: false, error: 'لا يمكن التصويت لنفس الشخص مرتين.' };
  }

  for (const tid of targetIds) {
    if (!playerSet.has(tid)) {
      return { valid: false, error: 'اللاعب المختار غير موجود.' };
    }
    if (tid === voterId) {
      return { valid: false, error: 'لا يمكنك التصويت لنفسك.' };
    }
    if (tieCandidateIds.length > 0 && !tieCandidateIds.includes(tid)) {
      return { valid: false, error: 'التصويت الفاصل محصور بين المتعادلين فقط.' };
    }
  }

  return { valid: true };
}

export function tallyVotes(
  votes: Record<string, string[]>,
  players: Array<{ id: string }>
): { tally: Record<string, number>; topCandidates: string[]; maxVotes: number } {
  const tally: Record<string, number> = {};
  for (const p of players) {
    tally[p.id] = 0;
  }
  for (const targets of Object.values(votes)) {
    for (const tid of targets) {
      if (tid in tally) {
        tally[tid] += 1;
      }
    }
  }
  let maxVotes = 0;
  for (const count of Object.values(tally)) {
    if (count > maxVotes) maxVotes = count;
  }
  const topCandidates =
    maxVotes > 0
      ? Object.entries(tally)
          .filter(([, count]) => count === maxVotes)
          .map(([id]) => id)
      : [];

  return { tally, topCandidates, maxVotes };
}

export function evaluateVotingOutcome(params: {
  votes: Record<string, string[]>;
  players: Array<{ id: string }>;
  gameMode: GameMode;
  isTieBreakerRound: boolean;
}): {
  needsTieBreaker: boolean;
  tieCandidateIds: string[];
  accusedIds: string[];
  tally: Record<string, number>;
} {
  const { votes, players, gameMode, isTieBreakerRound } = params;
  const { tally, topCandidates } = tallyVotes(votes, players);

  if (gameMode === 'two_outliers') {
    // Sort players by vote count desc and pick top 2 accused (if >0 votes)
    const sorted = Object.entries(tally)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);

    if (!isTieBreakerRound && sorted.length >= 3 && sorted[1][1] === sorted[2][1]) {
      const tiedScore = sorted[1][1];
      const tiedForSecond = sorted.filter(([, c]) => c === tiedScore).map(([id]) => id);
      if (tiedForSecond.length > 1) {
        return {
          needsTieBreaker: true,
          tieCandidateIds: tiedForSecond,
          accusedIds: [],
          tally,
        };
      }
    }
    return {
      needsTieBreaker: false,
      tieCandidateIds: [],
      accusedIds: sorted.slice(0, 2).map(([id]) => id),
      tally,
    };
  }

  // Classic or Confusing Pair (1 outlier)
  if (!isTieBreakerRound && topCandidates.length > 1) {
    return {
      needsTieBreaker: true,
      tieCandidateIds: topCandidates,
      accusedIds: [],
      tally,
    };
  }

  // On tie-breaker round if still tied, nobody is definitively caught (outlier escapes) or pick if single top
  const accusedIds = topCandidates.length === 1 ? [topCandidates[0]] : [];
  return {
    needsTieBreaker: false,
    tieCandidateIds: [],
    accusedIds,
    tally,
  };
}

export function checkOutlierWordGuess(guessText: string, actualWord: string): boolean {
  const g = normalizeArabic(guessText);
  const a = normalizeArabic(actualWord);
  if (!g || g.length < 2) return false;
  return g === a;
}

export function finalizeRoundSummary(params: {
  assignment: SecretRoundAssignment;
  players: PlayerPublic[];
  votes: Record<string, string[]>;
  accusedIds: string[];
  tally: Record<string, number>;
  scoringRules: ScoringRules;
  outlierGuessText?: string;
  totalRounds: number;
  previousLeaderId: string | null;
}): {
  summary: RoundRevealSummary;
  updatedScores: Record<string, number>;
  newLeaderId: string | null;
} {
  const {
    assignment,
    players,
    votes,
    accusedIds,
    tally,
    scoringRules,
    outlierGuessText,
    totalRounds,
    previousLeaderId,
  } = params;

  const playerMap = new Map(players.map((p) => [p.id, p]));
  const outlierSet = new Set(assignment.outlierIds);
  const accusedSet = new Set(accusedIds);

  const caughtOutlierIds = assignment.outlierIds.filter((oid) => accusedSet.has(oid));
  const escapedOutlierIds = assignment.outlierIds.filter((oid) => !accusedSet.has(oid));

  const scoreDeltas: Record<string, number> = {};
  for (const p of players) {
    scoreDeltas[p.id] = 0;
  }

  if (assignment.gameMode === 'classic') {
    // Voters who voted for the outlier get +classicCorrectVote (only if non-outlier)
    for (const [voterId, targets] of Object.entries(votes)) {
      if (!outlierSet.has(voterId)) {
        const hitCount = targets.filter((tid) => outlierSet.has(tid)).length;
        if (hitCount > 0) {
          scoreDeltas[voterId] += scoringRules.classicCorrectVote;
        }
      }
    }
    for (const oid of escapedOutlierIds) {
      scoreDeltas[oid] += scoringRules.classicOutlierSurvive;
    }
    const guessCorrect =
      caughtOutlierIds.length > 0 && outlierGuessText
        ? checkOutlierWordGuess(outlierGuessText, assignment.wordA)
        : false;
    if (guessCorrect) {
      for (const oid of caughtOutlierIds) {
        scoreDeltas[oid] += scoringRules.classicOutlierGuessBonus;
      }
    }
  } else if (assignment.gameMode === 'confusing_pair') {
    for (const [voterId, targets] of Object.entries(votes)) {
      if (!outlierSet.has(voterId)) {
        const hitCount = targets.filter((tid) => outlierSet.has(tid)).length;
        if (hitCount > 0) {
          scoreDeltas[voterId] += scoringRules.confusingCorrectVote;
        }
      }
    }
    for (const oid of escapedOutlierIds) {
      scoreDeltas[oid] += scoringRules.confusingOutlierSurvive;
    }
  } else {
    // Two Outliers: +1 per unique outlier identified by a non-outlier voter (no double counting)
    for (const [voterId, targets] of Object.entries(votes)) {
      if (!outlierSet.has(voterId)) {
        const uniqueHits = new Set(targets.filter((tid) => outlierSet.has(tid)));
        scoreDeltas[voterId] += uniqueHits.size * scoringRules.twoOutliersPerCorrectVote;
      }
    }
    for (const oid of escapedOutlierIds) {
      scoreDeltas[oid] += scoringRules.twoOutliersSurviveEach;
    }
  }

  const updatedScores: Record<string, number> = {};
  for (const p of players) {
    updatedScores[p.id] = p.score + (scoreDeltas[p.id] || 0);
  }

  // Determine leader (must be uniquely ahead or highest)
  let topScore = -1;
  let topPlayers: PlayerPublic[] = [];
  for (const p of players) {
    const s = updatedScores[p.id];
    if (s > topScore) {
      topScore = s;
      topPlayers = [p];
    } else if (s === topScore) {
      topPlayers.push(p);
    }
  }
  const newLeaderId = topPlayers.length === 1 && topScore > 0 ? topPlayers[0].id : null;
  const leaderChanged =
    Boolean(newLeaderId && previousLeaderId && newLeaderId !== previousLeaderId) ||
    Boolean(newLeaderId && !previousLeaderId && assignment.roundNumber > 1);

  const votesBreakdown = Object.entries(votes).map(([voterId, targetIds]) => ({
    voterId,
    voterName: playerMap.get(voterId)?.name || 'لاعب',
    targetIds,
    targetNames: targetIds.map((tid) => playerMap.get(tid)?.name || 'لاعب'),
  }));

  const outlierGuessCorrect =
    assignment.gameMode === 'classic' && caughtOutlierIds.length > 0 && outlierGuessText
      ? checkOutlierWordGuess(outlierGuessText, assignment.wordA)
      : undefined;

  const summary: RoundRevealSummary = {
    roundNumber: assignment.roundNumber,
    gameMode: assignment.gameMode,
    categoryId: assignment.categoryId,
    categoryNameAr: assignment.categoryNameAr,
    wordA: assignment.wordA,
    wordB: assignment.wordB,
    reasonAr: assignment.reasonAr,
    outlierIds: assignment.outlierIds,
    outlierNames: assignment.outlierIds.map((id) => playerMap.get(id)?.name || 'لاعب'),
    caughtOutlierIds,
    escapedOutlierIds,
    outlierGuessText,
    outlierGuessCorrect,
    voteTally: tally,
    votesBreakdown,
    scoreDeltas,
    leaderChanged,
    newLeaderName: newLeaderId ? playerMap.get(newLeaderId)?.name : undefined,
    isFinalRound: assignment.roundNumber >= totalRounds,
  };

  return { summary, updatedScores, newLeaderId };
}

export function pickDiscussionCardForRound(
  bank: WordBankData,
  categoryId: string,
  usedIds: string[]
) {
  const pool = filterDiscussionCardsForCategory(bank, categoryId, usedIds);
  if (pool.length === 0) return null;
  return pickRandomItem(pool);
}
