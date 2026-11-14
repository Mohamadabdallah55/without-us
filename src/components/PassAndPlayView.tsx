import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import {
  SecretRoundAssignment,
  createRoundAssignment,
  evaluateVotingOutcome,
  finalizeRoundSummary,
  pickDiscussionCardForRound,
} from '../game/rules';
import { soundFx } from '../utils/sound';
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

export const PassAndPlayView: React.FC<PassAndPlayViewProps> = ({
  bank,
  config,
  playerNames,
  onExitHome,
}) => {
  const [players, setPlayers] = useState<PlayerPublic[]>(() =>
    playerNames.map((name, idx) => ({
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

  const [phase, setPhase] = useState<GamePhase>('SECRET_REVEAL');
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [playedWordIds, setPlayedWordIds] = useState<string[]>([]);
  const [playedPairIds, setPlayedPairIds] = useState<string[]>([]);
  const [assignment, setAssignment] = useState<SecretRoundAssignment>(() =>
    createRoundAssignment({
      roundNumber: 1,
      players: playerNames.map((name, idx) => ({ id: `local-${idx + 1}`, name })),
      config,
      bank,
      playedWordIds: [],
      playedPairIds: [],
    })
  );

  const [revealIndex, setRevealIndex] = useState(0);
  const [timerRemaining, setTimerRemaining] = useState(config.discussionSeconds);
  const [timerPaused, setTimerPaused] = useState(false);
  const [activeCard, setActiveCard] = useState<DiscussionCardEntry | null>(null);
  const [usedCardIds, setUsedCardIds] = useState<string[]>([]);
  const [suspicionLeft, setSuspicionLeft] = useState(2);

  const [voterIndex, setVoterIndex] = useState(0);
  const [votes, setVotes] = useState<Record<string, string[]>>({});
  const [isTieBreaker, setIsTieBreaker] = useState(false);
  const [tieCandidateIds, setTieCandidateIds] = useState<string[]>([]);
  const [pendingAccusedIds, setPendingAccusedIds] = useState<string[]>([]);
  const [pendingTally, setPendingTally] = useState<Record<string, number>>({});
  const [lastReveal, setLastReveal] = useState<RoundRevealSummary | null>(null);
  const [previousLeaderId, setPreviousLeaderId] = useState<string | null>(null);
  const [backWarning, setBackWarning] = useState(false);

  const scoredRoundRef = useRef<number>(0);

  // Guard browser Back button so pressing Back during secret reveal never exposes previous word
  useEffect(() => {
    window.history.pushState({ passAndPlayLock: true }, '');
    const onPopState = () => {
      window.history.pushState({ passAndPlayLock: true }, '');
      setBackWarning(true);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Warn before accidental refresh during an active match
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (phase !== 'FINAL_WINNER') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [phase]);

  // Discussion countdown timer
  useEffect(() => {
    if (phase !== 'DISCUSSION' || config.discussionSeconds <= 0 || timerPaused || timerRemaining <= 0) {
      return;
    }
    const id = window.setInterval(() => {
      setTimerRemaining((prev) => {
        if (prev <= 1) {
          soundFx.playDramaticCue();
          return 0;
        }
        if (prev <= 6) soundFx.playTick();
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase, config.discussionSeconds, timerPaused, timerRemaining]);

  // Suspicion moment 2-second beat before voting
  useEffect(() => {
    if (phase !== 'SUSPICION_MOMENT') return;
    if (suspicionLeft <= 0) {
      setPhase('VOTING');
      setVoterIndex(0);
      setVotes({});
      setIsTieBreaker(false);
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
    setTimerRemaining(config.discussionSeconds);
    setTimerPaused(false);
    setActiveCard(null);
    setUsedCardIds([]);
    setVotes({});
    setIsTieBreaker(false);
    setTieCandidateIds([]);
    setPendingAccusedIds([]);
    setPendingTally({});
    setLastReveal(null);
    setPhase('SECRET_REVEAL');
  };

  const handleSkipWord = () => {
    const nextWords = [...playedWordIds, assignment.wordIdUsed];
    const nextPairs = assignment.pairIdUsed ? [...playedPairIds, assignment.pairIdUsed] : playedPairIds;
    setPlayedWordIds(nextWords);
    setPlayedPairIds(nextPairs);
    startRound(currentRound, nextWords, nextPairs, false);
  };

  const handleAcknowledgeReveal = () => {
    if (revealIndex + 1 < players.length) {
      setRevealIndex((i) => i + 1);
    } else {
      setPhase('DISCUSSION');
    }
  };

  const handleDrawCard = () => {
    const card = pickDiscussionCardForRound(bank, assignment.categoryId, usedCardIds);
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
      votes: finalVotes,
      accusedIds,
      tally,
      scoringRules: config.scoringRules,
      outlierGuessText: guessText,
      totalRounds: config.totalRounds,
      previousLeaderId,
    });

    setPlayers((prev) => prev.map((p) => ({ ...p, score: updatedScores[p.id] ?? p.score })));
    setPreviousLeaderId(newLeaderId);
    setLastReveal(summary);
    setPlayedWordIds((prev) => [...prev, assignment.wordIdUsed]);
    if (assignment.pairIdUsed) {
      setPlayedPairIds((prev) => [...prev, assignment.pairIdUsed!]);
    }
    soundFx.playReveal(false);
    setPhase('REVEAL');
  };

  const handlePlayerVote = (targetIds: string[]) => {
    const voter = players[voterIndex];
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
    });

    if (outcome.needsTieBreaker) {
      soundFx.playDramaticCue();
      setIsTieBreaker(true);
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
    startRound(1, playedWordIds, playedPairIds, true);
  };

  const currentRevealPlayer = players[revealIndex];
  const currentVoter = players[voterIndex];
  const starterPlayer = players.find((p) => p.id === assignment.starterPlayerId) || players[0];

  return (
    <div className="min-h-screen bg-[#070E1A] text-slate-100 flex flex-col">
      {/* Top Bar */}
      <header className="border-b border-white/10 bg-[#0B1526]/90 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        <GameBrandLockup compact />

        <div className="text-xs sm:text-sm text-slate-300 tabular-nums hidden sm:block">
          جهاز واحد · الجولة <strong className="text-teal-300">{currentRound}</strong>/{config.totalRounds}
        </div>

        <button
          type="button"
          onClick={() => setBackWarning(true)}
          className="min-h-[40px] px-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          <ArrowRight className="w-4 h-4" />
          <span>إنهاء</span>
        </button>
      </header>

      {backWarning && (
        <div className="bg-amber-500/15 border-b border-amber-400/40 px-4 py-3 flex flex-wrap items-center justify-between gap-3 max-w-4xl mx-auto w-full mt-3 rounded-xl">
          <p className="text-sm text-amber-200 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>تم منع الرجوع التلقائي لحماية الكلمات السرية. هل تريد إنهاء المباراة والعودة للرئيسية؟</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setBackWarning(false)}
              className="min-h-[36px] px-3 rounded-lg bg-white/10 text-xs font-bold cursor-pointer"
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

      <main className="flex-1 flex flex-col justify-center px-4 py-6 sm:py-10">
        {phase === 'SECRET_REVEAL' && currentRevealPlayer && (
          <SecretCardReveal
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
            onTogglePause={() => setTimerPaused((p) => !p)}
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
