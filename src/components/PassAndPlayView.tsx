import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import {
  SecretRoundAssignment,
  createRoundAssignment,
  evaluateVotingOutcome,
  finalizeRoundSummary,
  hasRoundCapacity,
  validateVoteSubmission,
  pickDiscussionCardForRound,
} from '../game/rules';
import { createMatchups, getQuestionTurn, postponeMatchup, secondsLeft, timerDeadline, type Matchup } from '../game/questions';
import { LOCAL_MATCH_KEY, readSession, writeSession } from '../game/session';
import { QuestionStage } from './QuestionStage';
import { soundFx } from '../utils/sound';
import {MatchProgress,StageSound} from './MatchProgress';
import type {
  DiscussionCardEntry,
  GameConfig,
  GamePhase,
  PlayerPublic,
  RoundRevealSummary,
  WordBankData,
} from '../types/game';
import { DiscussionStage } from './DiscussionStage';
import { OutlierGuessStage, RevealAndResults, SuspicionMomentBanner } from './RevealAndResults';
import { SecretCardReveal } from './SecretCardReveal';
import { GameBrandLockup } from './SvgAssets';
import { VotingStage } from './VotingStage';

interface PassAndPlayViewProps {
  bank: WordBankData;
  config: GameConfig;
  playerNames: string[];
  onExitHome: () => void;
}

interface LocalMatch {
  config: GameConfig;
  playerNames: string[];
  players: PlayerPublic[];
  phase: GamePhase;
  currentRound: number;
  playedWordIds: string[];
  playedPairIds: string[];
  assignment: SecretRoundAssignment;
  revealIndex: number;
  timerEndsAt: number | null;
  pausedSeconds: number | null;
  activeCard: DiscussionCardEntry | null;
  usedCardIds: string[];
  matchups: Matchup[];
  questionIndex: number;
  voterIndex: number;
  votes: Record<string, string[]>;
  tieCandidateIds: string[];
  securedAccusedIds: string[];
  initialVotes: Record<string, string[]> | null;
  initialTally: Record<string, number> | null;
  pendingAccusedIds: string[];
  pendingTally: Record<string, number>;
  lastReveal: RoundRevealSummary | null;
  previousLeaderId: string | null;
}

export function readLocalMatch() {
  return readSession<LocalMatch>(LOCAL_MATCH_KEY);
}

export const PassAndPlayView: React.FC<PassAndPlayViewProps> = ({
  bank,
  config,
  playerNames,
  onExitHome,
}) => {
  const [saved] = useState(readLocalMatch);
  const [players, setPlayers] = useState<PlayerPublic[]>(() =>
    saved?.players ?? playerNames.map((name, idx) => ({
      id: `local-${idx + 1}`,
      name,
      avatarIndex: idx % 12,
      score: 0,
      connected: true,
      isHost: idx === 0,
      hasRevealed: false,
      hasVoted: false,
    }))
  );

  const [phase, setPhase] = useState<GamePhase>(saved?.phase ?? 'SECRET_REVEAL');
  const [currentRound, setCurrentRound] = useState<number>(saved?.currentRound ?? 1);
  const [playedWordIds, setPlayedWordIds] = useState<string[]>(saved?.playedWordIds ?? []);
  const [playedPairIds, setPlayedPairIds] = useState<string[]>(saved?.playedPairIds ?? []);
  const [assignment, setAssignment] = useState<SecretRoundAssignment>(() =>
    saved?.assignment ?? createRoundAssignment({
      roundNumber: 1,
      players: playerNames.map((name, idx) => ({ id: `local-${idx + 1}`, name })),
      config,
      bank,
      playedWordIds: [],
      playedPairIds: [],
    })
  );

  const [revealIndex, setRevealIndex] = useState(saved?.revealIndex ?? 0);
  const [timerEndsAt, setTimerEndsAt] = useState(saved?.timerEndsAt ?? null);
  const [pausedSeconds, setPausedSeconds] = useState(saved?.pausedSeconds ?? null);
  const [timerRemaining, setTimerRemaining] = useState(() => saved?.pausedSeconds ?? secondsLeft(saved?.timerEndsAt ?? null));
  const timerPaused = pausedSeconds !== null;
  const [matchups, setMatchups] = useState<Matchup[]>(saved?.matchups ?? []);
  const [questionIndex, setQuestionIndex] = useState(saved?.questionIndex ?? 0);
  const questionTurn = getQuestionTurn(assignment.wordIdUsed, matchups, questionIndex);
  const [activeCard, setActiveCard] = useState<DiscussionCardEntry | null>(saved?.activeCard ?? null);
  const [usedCardIds, setUsedCardIds] = useState<string[]>(saved?.usedCardIds ?? []);
  const [suspicionLeft, setSuspicionLeft] = useState(2);

  const [voterIndex, setVoterIndex] = useState(saved?.voterIndex ?? 0);
  const [votes, setVotes] = useState<Record<string, string[]>>(saved?.votes ?? {});
  const isTieBreaker = phase === 'TIE_BREAKER';
  const [securedAccusedIds, setSecuredAccusedIds] = useState<string[]>(saved?.securedAccusedIds ?? []);
  const [initialVotes, setInitialVotes] = useState<Record<string, string[]> | null>(saved?.initialVotes ?? null);
  const [initialTally, setInitialTally] = useState<Record<string, number> | null>(saved?.initialTally ?? null);
  const [tieCandidateIds, setTieCandidateIds] = useState<string[]>(saved?.tieCandidateIds ?? []);
  const [pendingAccusedIds, setPendingAccusedIds] = useState<string[]>(saved?.pendingAccusedIds ?? []);
  const [pendingTally, setPendingTally] = useState<Record<string, number>>(saved?.pendingTally ?? {});
  const [lastReveal, setLastReveal] = useState<RoundRevealSummary | null>(saved?.lastReveal ?? null);
  const [previousLeaderId, setPreviousLeaderId] = useState<string | null>(saved?.previousLeaderId ?? null);
  const [backWarning, setBackWarning] = useState(false);

  const scoredRoundRef = useRef(saved?.lastReveal?.roundNumber ?? 0);

  const [error, setError] = useState('');
  useEffect(() => {
    const snapshot: LocalMatch = {
      config, playerNames, players, phase, currentRound, playedWordIds, playedPairIds,
      assignment, revealIndex, timerEndsAt, pausedSeconds, activeCard, usedCardIds,
      matchups, questionIndex, voterIndex, votes, tieCandidateIds, securedAccusedIds,
      initialVotes, initialTally, pendingAccusedIds, pendingTally, lastReveal, previousLeaderId,
    };
    writeSession(LOCAL_MATCH_KEY, snapshot);
  }, [config, playerNames, players, phase, currentRound, playedWordIds, playedPairIds,
    assignment, revealIndex, timerEndsAt, pausedSeconds, activeCard, usedCardIds,
    matchups, questionIndex, voterIndex, votes, tieCandidateIds, securedAccusedIds,
    initialVotes, initialTally, pendingAccusedIds, pendingTally, lastReveal, previousLeaderId]);

  useEffect(() => {
    if (phase === 'SECRET_REVEAL') soundFx.playStart();
  }, [phase, assignment.wordIdUsed]);

  const resetTimer = (seconds: number) => {
    setTimerEndsAt(timerDeadline(seconds));
    setTimerRemaining(seconds);
    setPausedSeconds(null);
  };

  useEffect(() => {
    if (timerEndsAt === null || (phase !== 'DISCUSSION' && phase !== 'PLAYER_QUESTIONS')) return;
    let previous = secondsLeft(timerEndsAt);
    const update = () => {
      const next = secondsLeft(timerEndsAt);
      if (phase === 'DISCUSSION' && next > 0 && next <= 5 && previous !== next) soundFx.playTick();
      if(next===0&&previous>0&&phase==='DISCUSSION')soundFx.playTimeout();
      if(previous!==next)setTimerRemaining(next);
      previous=next;
    };
    update();
    const id = window.setInterval(update, 200);
    return () => window.clearInterval(id);
  }, [timerEndsAt, phase]);

  // Suspicion moment 2-second beat before voting
  useEffect(() => {
    if (phase !== 'SUSPICION_MOMENT') return;
    if (suspicionLeft <= 0) {
      setPhase('VOTING');
      setVoterIndex(0);
      setVotes({});
      setTieCandidateIds([]);
      return;
    }
    const id = window.setTimeout(() => setSuspicionLeft((s) => s - 1), 900);
    return () => window.clearTimeout(id);
  }, [phase, suspicionLeft]);

  const startRound = (nextRoundNum: number, nextPlayedWords: string[], nextPlayedPairs: string[], resetScores = false) => {
    const nextPlayers = resetScores ? players.map((p) => ({ ...p, score: 0 })) : players;
    if (resetScores) setPlayers(nextPlayers);

    const nextAssign = createRoundAssignment({
      roundNumber: nextRoundNum,
      players: nextPlayers,
      config,
      bank,
      playedWordIds: nextPlayedWords,
      playedPairIds: nextPlayedPairs,
    });

    setAssignment(nextAssign);
    setCurrentRound(nextRoundNum);
    setRevealIndex(0);
    resetTimer(0);
    setMatchups([]);
    setQuestionIndex(0);
    setVoterIndex(0);
    setActiveCard(null);
    setUsedCardIds([]);
    setVotes({});
    setTieCandidateIds([]);
    setPendingAccusedIds([]);
    setPendingTally({});
    setSecuredAccusedIds([]);
    setInitialVotes(null);
    setInitialTally(null);
    setError('');
    setLastReveal(null);
    setPhase('SECRET_REVEAL');
  };

  const handleSkipWord = () => {
    const nextWords = [...playedWordIds, assignment.wordIdUsed, ...(assignment.secondWordIdUsed ? [assignment.secondWordIdUsed] : [])];
    const nextPairs = assignment.pairIdUsed ? [...playedPairIds, assignment.pairIdUsed] : playedPairIds;
    if (!hasRoundCapacity(config, bank, config.totalRounds - currentRound + 1, nextWords, nextPairs)) {
      setError('ما في كلمة بديلة تكفي لإكمال المباراة.');
      return;
    }
    setPlayedWordIds(nextWords);
    setPlayedPairIds(nextPairs);
    startRound(currentRound, nextWords, nextPairs, false);
  };

  const handleAcknowledgeReveal = () => {
    if (revealIndex + 1 < players.length) {
      setRevealIndex((i) => i + 1);
    } else {
      setMatchups(createMatchups(players.map((p) => p.id)));
      setQuestionIndex(0);
      resetTimer(config.questionSeconds);
      setPhase('PLAYER_QUESTIONS');
    }
  };

  const advanceQuestion = (postpone = false) => {
    setActiveCard(null);
    if (postpone) setMatchups(postponeMatchup(matchups, questionIndex));
    else if (questionIndex === matchups.length - 1) {
      resetTimer(config.discussionSeconds);
      setPhase('DISCUSSION');
      return;
    } else setQuestionIndex(questionIndex + 1);
    resetTimer(config.questionSeconds);
  };

  const handleDrawCard = () => {
    const card = pickDiscussionCardForRound(bank, assignment.categoryId, usedCardIds, config.ageBand);
    if (card) {
      soundFx.playTap();
      setActiveCard(card);
      if (!usedCardIds.includes(card.id)) {
        setUsedCardIds([...usedCardIds, card.id]);
      }
    }
  };

  const handleStartVoting = () => {
    soundFx.playDramaticCue();
    setSuspicionLeft(2);
    setPhase('SUSPICION_MOMENT');
  };

  const finalizeAndScoreRound = (
    finalVotes: Record<string, string[]>,
    accusedIds: string[],
    tally: Record<string, number>,
    guessText?: string
  ) => {
    if (scoredRoundRef.current === currentRound) return;
    scoredRoundRef.current = currentRound;

    const { summary, updatedScores, newLeaderId } = finalizeRoundSummary({
      assignment,
      players,
      votes: initialVotes ?? finalVotes,
      accusedIds,
      tally: initialTally ?? tally,
      scoringRules: config.scoringRules,
      outlierGuessText: guessText,
      totalRounds: config.totalRounds,
      previousLeaderId,
    });

    setPlayers((prev) => prev.map((p) => ({ ...p, score: updatedScores[p.id] ?? p.score })));
    setPreviousLeaderId(newLeaderId);
    setLastReveal(summary);
    setPlayedWordIds((prev) => [...prev, assignment.wordIdUsed, ...(assignment.secondWordIdUsed ? [assignment.secondWordIdUsed] : [])]);
    if (assignment.pairIdUsed) {
      setPlayedPairIds((prev) => [...prev, assignment.pairIdUsed!]);
    }
    soundFx.playReveal();
    if (summary.leaderChanged) soundFx.playLead();
    setPhase('REVEAL');
  };

  const handlePlayerVote = (targetIds: string[]) => {
    const voter = players[voterIndex];
    if (!validateVoteSubmission({ voterId: voter.id, targetIds, players, gameMode: config.gameMode,
      existingVotes: votes, allowVoteChange: false, tieCandidateIds }).valid) return;
    const nextVotes = { ...votes, [voter.id]: targetIds };
    setVotes(nextVotes);

    if (voterIndex + 1 < players.length) {
      setVoterIndex((i) => i + 1);
      return;
    }

    // All players voted -> evaluate outcome
    const outcome = evaluateVotingOutcome({
      votes: nextVotes,
      players,
      gameMode: config.gameMode,
      isTieBreakerRound: isTieBreaker,
      securedAccusedIds,
    });

    if (outcome.needsTieBreaker) {
      soundFx.playDramaticCue();
      setSecuredAccusedIds(outcome.accusedIds);
      setInitialVotes(nextVotes);
      setInitialTally(outcome.tally);
      setTieCandidateIds(outcome.tieCandidateIds);
      setVotes({});
      setVoterIndex(0);
      setPhase('TIE_BREAKER');
      return;
    }

    setPendingAccusedIds(outcome.accusedIds);
    setPendingTally(outcome.tally);

    const caughtOutlier = assignment.outlierIds.some((oid) => outcome.accusedIds.includes(oid));
    if (config.gameMode === 'classic' && caughtOutlier) {
      setPhase('OUTLIER_GUESS');
      return;
    }

    finalizeAndScoreRound(nextVotes, outcome.accusedIds, outcome.tally);
  };

  const handleNextAfterReveal = () => {
    if (phase === 'REVEAL') {
      if (currentRound >= config.totalRounds) {
        soundFx.playVictory();
        setPhase('FINAL_WINNER');
      } else {
        setPhase('RESULTS');
      }
      return;
    }
    if (phase === 'RESULTS') {
      startRound(currentRound + 1, playedWordIds, playedPairIds, false);
    }
  };

  const handlePlayAgainSameSettings = () => {
    scoredRoundRef.current = 0;
    setPreviousLeaderId(null);
    setPlayedWordIds([]);
    setPlayedPairIds([]);
    startRound(1, [], [], true);
  };

  const currentRevealPlayer = players[revealIndex];
  const currentVoter = players[voterIndex];
  const starterPlayer = players.find((p) => p.id === assignment.starterPlayerId) || players[0];

  return (
    <div className="min-h-svh bg-transparent text-ink flex flex-col">
      {/* Top Bar */}
      <header className="border-b border-ink/25 bg-paper/90 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        <GameBrandLockup compact />
        <StageSound />

        <div className="text-xs sm:text-sm text-caption tabular-nums hidden sm:block">
          جهاز واحد · الجولة <strong className="text-berry">{currentRound}</strong>/{config.totalRounds}
        </div>

        <button
          type="button"
          onClick={() => setBackWarning(true)}
          className="min-h-[40px] px-3.5 rounded-xl bg-lilac hover:bg-lilac border border-ink/25 text-ink text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          <ArrowRight className="w-4 h-4" />
          <span>إنهاء</span>
        </button>
      </header>

      <MatchProgress phase={phase} round={currentRound} total={config.totalRounds}/>
      {backWarning && (
        <div className="bg-amber-500/15 border-b border-amber-400/40 px-4 py-3 flex flex-wrap items-center justify-between gap-3 max-w-4xl mx-auto w-full mt-3 rounded-xl">
          <p className="text-sm text-berry flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>تم منع الرجوع التلقائي لحماية الكلمات السرية. هل تريد إنهاء المباراة والعودة للرئيسية؟</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setBackWarning(false)}
              className="min-h-[36px] px-3 rounded-lg bg-lilac text-xs font-bold cursor-pointer"
            >
              متابعة اللعب
            </button>
            <button
              type="button"
              onClick={onExitHome}
              className="min-h-[36px] px-3 rounded-lg bg-rose-500 text-white text-xs font-bold cursor-pointer"
            >
              خروج للرئيسية
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col justify-center px-3 py-4 sm:px-6 sm:py-8">
        {phase === 'SECRET_REVEAL' && currentRevealPlayer && (
          <SecretCardReveal
            key={`${assignment.wordIdUsed}:${currentRevealPlayer.id}`}
            playerName={currentRevealPlayer.name}
            avatarIndex={currentRevealPlayer.avatarIndex}
            categoryNameAr={assignment.categoryNameAr}
            secretWord={assignment.playerWords[currentRevealPlayer.id]}
            showOutlierCard={
              config.gameMode !== 'confusing_pair' &&
              assignment.outlierIds.includes(currentRevealPlayer.id)
            }
            isPassAndPlay={true}
            playerStepText={`اللاعب ${revealIndex + 1} من ${players.length} · الجولة ${currentRound}`}
            onAcknowledgeAndHide={handleAcknowledgeReveal}
          />
        )}

        {error && <p role="alert" className="text-center font-bold">{error}</p>}
        {phase === 'PLAYER_QUESTIONS' && questionTurn && (
          <QuestionStage turn={questionTurn} players={players} timer={timerRemaining}
            timed={config.questionSeconds > 0} card={activeCard}
            onNext={() => advanceQuestion()} onPostpone={() => advanceQuestion(true)} onCard={handleDrawCard} />
        )}
        {phase === 'DISCUSSION' && (
          <DiscussionStage
            currentRound={currentRound}
            totalRounds={config.totalRounds}
            categoryNameAr={assignment.categoryNameAr}
            starterPlayer={starterPlayer}
            timerRemaining={timerRemaining}
            totalSeconds={config.discussionSeconds}
            timerPaused={timerPaused}
            activeCard={activeCard}
            canControl={true}
            onTogglePause={() => {
              if (pausedSeconds !== null) resetTimer(pausedSeconds);
              else {
                setPausedSeconds(secondsLeft(timerEndsAt));
                setTimerEndsAt(null);
              }
            }}
            onDrawCard={handleDrawCard}
            onStartVoting={handleStartVoting}
            onSkipWord={handleSkipWord}
          />
        )}

        {phase === 'SUSPICION_MOMENT' && (
          <SuspicionMomentBanner secondsLeft={suspicionLeft} />
        )}

        {(phase === 'VOTING' || phase === 'TIE_BREAKER') && currentVoter && (
          <VotingStage
            key={`${phase}:${currentVoter.id}`}
            players={players}
            currentVoter={currentVoter}
            gameMode={config.gameMode}
            isTieBreaker={isTieBreaker}
            tieCandidateIds={tieCandidateIds}
            allowVoteChange={false}
            alreadyVotedTargetIds={[]}
            isPassAndPlay={true}
            voterProgressText={`المصوّت ${voterIndex + 1} من ${players.length}`}
            onSubmitVote={handlePlayerVote}
          />
        )}

        {phase === 'OUTLIER_GUESS' && (
          <OutlierGuessStage
            outlierNames={assignment.outlierIds.map(
              (id) => players.find((p) => p.id === id)?.name || 'المختلف'
            )}
            categoryNameAr={assignment.categoryNameAr}
            canSubmit={true}
            onSubmitGuess={(guess) =>
              finalizeAndScoreRound(votes, pendingAccusedIds, pendingTally, guess)
            }
          />
        )}

        {(phase === 'REVEAL' || phase === 'RESULTS' || phase === 'FINAL_WINNER') &&
          lastReveal && (
            <RevealAndResults
              phase={phase}
              summary={lastReveal}
              players={players}
              canControl={true}
              onNextStep={handleNextAfterReveal}
              onPlayAgainSameSettings={handlePlayAgainSameSettings}
              onExitHome={onExitHome}
            />
          )}
      </main>
    </div>
  );
};
