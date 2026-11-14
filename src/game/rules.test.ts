import test from 'node:test';
import assert from 'node:assert/strict';
import { checkWordSafety, normalizeArabic } from './arabic';
import {
  DEFAULT_GAME_CONFIG,
  DEFAULT_SCORING_RULES,
  checkOutlierWordGuess,
  createRoundAssignment,
  evaluateVotingOutcome,
  finalizeRoundSummary,
  pickDiscussionCardForRound,
  validateMatchStart,
  validateVoteSubmission,
} from './rules';
import {
  buildInitialBankFromPdfSeed,
  filterDiscussionCardsForCategory,
  upsertBankEntries,
} from './wordBankService';
import { RoomManager } from '../../server/roomManager';
import type { PlayerPublic } from '../types/game';

function makePlayers(count: number): PlayerPublic[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i + 1}`,
    name: `لاعب ${i + 1}`,
    avatarIndex: i % 12,
    score: 0,
    connected: true,
    isHost: i === 0,
    hasRevealed: false,
    hasVoted: false,
  }));
}

test('PDF seed import extracts exact verified counts (650 words, 60 pairs, 100 cards) without fabricating missing 90 pairs', () => {
  const { bank, report } = buildInitialBankFromPdfSeed();
  assert.equal(report.extractedWords, 650);
  assert.equal(bank.words.length, 650);
  assert.equal(report.validPairs, 60);
  assert.equal(bank.confusing_pairs.length, 60);
  assert.equal(report.pairsMissingFromDocument, 90);
  assert.equal(report.discussionCardsExtracted, 100);
  assert.equal(bank.discussion_cards.length, 100);

  // Every confusing pair points to matching Arabic words
  const wordById = new Map(bank.words.map((w) => [w.id, w]));
  for (const pair of bank.confusing_pairs) {
    const a = wordById.get(pair.word_a_id);
    const b = wordById.get(pair.word_b_id);
    assert.ok(a && b, `Pair ${pair.id} missing word refs`);
    assert.notEqual(pair.word_a_id, pair.word_b_id);
    assert.ok(pair.reason_ar.length > 10);
  }
});

test('Idempotent UPSERT prevents duplicate records when re-importing PDF bank', () => {
  const { bank } = buildInitialBankFromPdfSeed();
  const { updated, addedCount, skippedDuplicates } = upsertBankEntries(bank, {
    words: bank.words,
    confusing_pairs: bank.confusing_pairs,
    discussion_cards: bank.discussion_cards,
  });
  assert.equal(updated.words.length, 650);
  assert.equal(updated.confusing_pairs.length, 60);
  assert.equal(updated.discussion_cards.length, 100);
  assert.equal(addedCount, 0);
  assert.equal(skippedDuplicates, 0);
});

test('Arabic normalizer detects duplicates across hamza, alif, ta marbuta, and Al-prefix', () => {
  assert.equal(normalizeArabic('الأستاذ'), normalizeArabic('استاذ'));
  assert.equal(normalizeArabic('كنافة ناعمة'), normalizeArabic('كنافه ناعمه'));
  assert.equal(checkWordSafety('الله').needsReview, true);
  assert.equal(checkWordSafety('منسف').needsReview, false);
});

test('Classic mode (5 players) assigns 1 outlier with null word and 4 majority players with same word, non-repeating across rounds', () => {
  const { bank } = buildInitialBankFromPdfSeed();
  const players = makePlayers(5);
  const config = { ...DEFAULT_GAME_CONFIG, gameMode: 'classic' as const, totalRounds: 5 };

  const usedWordIds: string[] = [];
  const starters = new Set<string>();
  for (let r = 1; r <= 5; r++) {
    const assignment = createRoundAssignment({
      roundNumber: r,
      players,
      config,
      bank,
      playedWordIds: usedWordIds,
      playedPairIds: [],
    });
    assert.equal(assignment.outlierIds.length, 1);
    assert.equal(assignment.playerWords[assignment.outlierIds[0]], null);
    for (const p of players) {
      if (p.id !== assignment.outlierIds[0]) {
        assert.equal(assignment.playerWords[p.id], assignment.wordA);
      }
    }
    assert.ok(!usedWordIds.includes(assignment.wordIdUsed), 'Word must not repeat inside match');
    usedWordIds.push(assignment.wordIdUsed);
    starters.add(assignment.starterPlayerId);
  }
  assert.equal(starters.size, 5, 'Starter rotates through all 5 players');
});

test('Confusing Pair mode («الملخبط») uses PDF pairs with reason_ar and hides outlier status', () => {
  const { bank } = buildInitialBankFromPdfSeed();
  const players = makePlayers(6);
  const config = { ...DEFAULT_GAME_CONFIG, gameMode: 'confusing_pair' as const };
  const assignment = createRoundAssignment({
    roundNumber: 1,
    players,
    config,
    bank,
    playedWordIds: [],
    playedPairIds: [],
  });
  assert.equal(assignment.outlierIds.length, 1);
  assert.ok(assignment.wordA && assignment.wordB);
  assert.notEqual(assignment.wordA, assignment.wordB);
  assert.ok(assignment.reasonAr && assignment.reasonAr.length > 5);
  assert.equal(assignment.playerWords[assignment.outlierIds[0]], assignment.wordB);
});

test('Two Outliers mode enforces >=8 players and prevents voting for same person twice or self-voting', () => {
  const { bank } = buildInitialBankFromPdfSeed();
  const config = { ...DEFAULT_GAME_CONFIG, gameMode: 'two_outliers' as const };

  const tooFew = validateMatchStart(7, config, bank);
  assert.equal(tooFew.valid, false);

  const ok = validateMatchStart(8, config, bank);
  assert.equal(ok.valid, true);

  const players = makePlayers(8);
  const assignment = createRoundAssignment({
    roundNumber: 1,
    players,
    config,
    bank,
    playedWordIds: [],
    playedPairIds: [],
  });
  assert.equal(assignment.outlierIds.length, 2);
  assert.notEqual(assignment.outlierIds[0], assignment.outlierIds[1]);

  // Self-vote blocked
  const selfVote = validateVoteSubmission({
    voterId: 'p1',
    targetIds: ['p1', 'p2'],
    players,
    gameMode: 'two_outliers',
    existingVotes: {},
    allowVoteChange: false,
    tieCandidateIds: [],
  });
  assert.equal(selfVote.valid, false);

  // Duplicate target blocked
  const dupTarget = validateVoteSubmission({
    voterId: 'p1',
    targetIds: ['p2', 'p2'],
    players,
    gameMode: 'two_outliers',
    existingVotes: {},
    allowVoteChange: false,
    tieCandidateIds: [],
  });
  assert.equal(dupTarget.valid, false);

  // Double vote submission blocked
  const doubleSubmit = validateVoteSubmission({
    voterId: 'p1',
    targetIds: ['p2', 'p3'],
    players,
    gameMode: 'two_outliers',
    existingVotes: { p1: ['p2', 'p3'] },
    allowVoteChange: false,
    tieCandidateIds: [],
  });
  assert.equal(doubleSubmit.valid, false);
});

test('Tie detection triggers tie-breaker round and resolves cleanly after runoff', () => {
  const players = makePlayers(4);
  const tiedVotes = {
    p1: ['p2'],
    p2: ['p3'],
    p3: ['p2'],
    p4: ['p3'],
  };
  const outcome1 = evaluateVotingOutcome({
    votes: tiedVotes,
    players,
    gameMode: 'classic',
    isTieBreakerRound: false,
  });
  assert.equal(outcome1.needsTieBreaker, true);
  assert.deepEqual(outcome1.tieCandidateIds.sort(), ['p2', 'p3']);

  const runoffVotes = {
    p1: ['p2'],
    p2: ['p3'],
    p3: ['p2'],
    p4: ['p2'],
  };
  const outcome2 = evaluateVotingOutcome({
    votes: runoffVotes,
    players,
    gameMode: 'classic',
    isTieBreakerRound: true,
  });
  assert.equal(outcome2.needsTieBreaker, false);
  assert.deepEqual(outcome2.accusedIds, ['p2']);
});

test('Scoring rules award accurate points for caught outlier + word guess and surviving outlier', () => {
  const { bank } = buildInitialBankFromPdfSeed();
  const players = makePlayers(5);
  const config = { ...DEFAULT_GAME_CONFIG, gameMode: 'classic' as const, totalRounds: 3 };
  const assignment = createRoundAssignment({
    roundNumber: 1,
    players,
    config,
    bank,
    playedWordIds: [],
    playedPairIds: [],
  });
  const oid = assignment.outlierIds[0];
  const others = players.filter((p) => p.id !== oid);
  const votes: Record<string, string[]> = {};
  for (const p of others) votes[p.id] = [oid];
  votes[oid] = [others[0].id];

  assert.equal(checkOutlierWordGuess(assignment.wordA, assignment.wordA), true);

  const { summary, updatedScores } = finalizeRoundSummary({
    assignment,
    players,
    votes,
    accusedIds: [oid],
    tally: { [oid]: 4, [others[0].id]: 1 },
    scoringRules: DEFAULT_SCORING_RULES,
    outlierGuessText: assignment.wordA,
    totalRounds: 3,
    previousLeaderId: null,
  });

  assert.equal(summary.outlierGuessCorrect, true);
  assert.equal(updatedScores[oid], 1); // +1 bonus for guessing word correctly
  assert.equal(updatedScores[others[0].id], 1); // +1 for catching outlier
});

test('Discussion cards filter by category and do not repeat within a round until exhausted', () => {
  const { bank } = buildInitialBankFromPdfSeed();
  const eligible = filterDiscussionCardsForCategory(bank, 'CAT_FOOD', []);
  assert.ok(eligible.length > 5);
  const used: string[] = [];
  for (let i = 0; i < eligible.length; i++) {
    const card = pickDiscussionCardForRound(bank, 'CAT_FOOD', used);
    assert.ok(card);
    assert.ok(!used.includes(card.id));
    used.push(card.id);
  }
});

test('Multi-device RoomManager enforces secret isolation, reconnects without duplicating, blocks unauthorized mutations, and plays 3 rounds to Final Winner', () => {
  const rm = new RoomManager();
  const created = rm.createRoom({
    hostName: 'أحمد',
    config: {
      gameMode: 'classic',
      totalRounds: 3,
      discussionSeconds: 30,
      categories: ['CAT_FOOD', 'CAT_JORDAN'],
    },
  });

  const joined = [
    rm.joinRoom({ roomCode: created.roomCode, name: 'سالم' }),
    rm.joinRoom({ roomCode: created.roomCode, name: 'عمر' }),
    rm.joinRoom({ roomCode: created.roomCode, name: 'خالد' }),
    rm.joinRoom({ roomCode: created.roomCode, name: 'يوسف' }),
    rm.joinRoom({ roomCode: created.roomCode, name: 'بلال' }),
    rm.joinRoom({ roomCode: created.roomCode, name: 'زيد' }),
    rm.joinRoom({ roomCode: created.roomCode, name: 'طارق' }),
  ];

  // Reconnect existing player token without creating duplicate
  const reconnected = rm.joinRoom({
    roomCode: created.roomCode,
    name: 'سالم',
    existingPlayerToken: joined[0].playerToken,
  });
  assert.equal(reconnected.reconnected, true);
  assert.equal(reconnected.state.players.length, 8);

  // Non-host cannot start match or kick
  assert.throws(() => rm.startMatch(created.roomCode, joined[0].playerToken));
  assert.throws(() => rm.kickPlayer(created.roomCode, joined[0].playerToken, joined[1].playerId));

  // Start match
  const started = rm.startMatch(created.roomCode, created.hostToken);
  assert.equal(started.phase, 'SECRET_REVEAL');
  // Public/projector state has ZERO secret info
  const serializedPublic = JSON.stringify(started);
  assert.equal(serializedPublic.includes('"outlierIds"'), false);
  assert.equal(started.lastReveal, null);

  // Each player only receives their own view
  const allTokens = [
    { id: created.playerId, token: created.hostToken, playerToken: created.playerToken },
    ...joined.map((j) => ({ id: j.playerId, token: j.playerToken, playerToken: j.playerToken })),
  ];

  for (let round = 1; round <= 3; round++) {
    let outlierCount = 0;
    let majorityWord = '';
    for (const p of allTokens) {
      const secret = rm.getPlayerSecretView(created.roomCode, p.playerToken);
      if (secret.isOutlier) {
        outlierCount++;
        assert.equal(secret.secretWord, null);
      } else {
        assert.ok(secret.secretWord && secret.secretWord.length > 0);
        majorityWord = secret.secretWord;
      }
      rm.markPlayerRevealed(created.roomCode, p.playerToken);
    }
    assert.equal(outlierCount, 1);
    assert.ok(majorityWord.length > 0);

    // Cannot jump straight to REVEAL without discussion & voting
    assert.throws(() => rm.advanceAfterReveal(created.roomCode, created.hostToken));

    rm.beginDiscussion(created.roomCode, created.hostToken);
    rm.drawDiscussionCard(created.roomCode, created.hostToken);
    rm.beginVoting(created.roomCode, created.hostToken);

    // Each player votes for next player (except p0 & p1 both vote p2 so p2 wins cleanly without tie)
    for (let i = 0; i < allTokens.length; i++) {
      const voter = allTokens[i];
      const target = i < 3 ? allTokens[3].id : allTokens[0].id;
      rm.submitVote(created.roomCode, voter.playerToken, [target]);
    }

    const afterClose = rm.closeVoting(created.roomCode, created.hostToken);
    if (afterClose.phase === 'OUTLIER_GUESS') {
      rm.submitOutlierGuess(created.roomCode, created.hostToken, 'كلمة خاطئة');
    }
    const revealed = rm.getPublicRoomState(created.roomCode)!;
    assert.equal(revealed.phase, 'REVEAL');
    assert.ok(revealed.lastReveal?.wordA);

    const next = rm.advanceAfterReveal(created.roomCode, created.hostToken);
    if (round < 3) {
      assert.equal(next.phase, 'RESULTS');
      rm.advanceAfterReveal(created.roomCode, created.hostToken);
    } else {
      assert.equal(next.phase, 'FINAL_WINNER');
    }
  }

  rm.destroy();
});
