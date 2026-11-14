import type { QuestionTurn } from '../game/questions';

export type AgeBand =
  | 'children_7_10'
  | 'preteens_11_13'
  | 'teens_14_17'
  | 'adults_18_plus'
  | 'families_mixed';

export type WordRegion = 'jordan_levant' | 'pan_arab' | 'islamic_general';

export type ItemStatus = 'approved' | 'draft' | 'needs_review' | 'archived';

export type GameMode = 'classic' | 'confusing_pair' | 'two_outliers';

export type DeviceMode = 'single_device' | 'multi_device';

export type GamePhase =
  | 'LOBBY'
  | 'SECRET_REVEAL'
  | 'PLAYER_QUESTIONS'
  | 'DISCUSSION'
  | 'SUSPICION_MOMENT'
  | 'VOTING'
  | 'TIE_BREAKER'
  | 'OUTLIER_GUESS'
  | 'REVEAL'
  | 'RESULTS'
  | 'FINAL_WINNER';

export interface CategoryMeta {
  id: string;
  name_ar: string;
  target_count: number;
  subcategories_summary: string;
  accentColor: string;
}

export interface WordEntry {
  id: string;
  text_ar: string;
  category: string;
  subcategory: string;
  age_bands: AgeBand[];
  difficulty: number; // 1..5
  tags: string[];
  region: WordRegion;
  status: ItemStatus;
  review_note?: string;
}

export interface ConfusingPairEntry {
  id: string;
  word_a_id: string;
  word_b_id: string;
  word_a_text?: string;
  word_b_text?: string;
  category: string;
  age_bands: AgeBand[];
  difficulty: number;
  similarity_level: number; // 1..5
  reason_ar: string;
  status: ItemStatus;
}

export interface DiscussionCardEntry {
  id: string;
  prompt_ar: string;
  categories: string[];
  age_bands: AgeBand[];
  status: ItemStatus;
}

export interface ImportReport {
  importedAt: string;
  sourceDocument: string;
  extractedWords: number;
  approvedWords: number;
  duplicateWords: number;
  duplicateDetails: Array<{ id: string; text_ar: string; duplicateOf: string }>;
  validPairs: number;
  pairsDeclaredInSummary: number;
  pairsMissingFromDocument: number;
  pairIdReconciliations: Array<{ pairId: string; note: string }>;
  discussionCardsExtracted: number;
  discussionCardsApproved: number;
  needsReviewCount: number;
  needsReviewItems: Array<{ id: string; text_ar: string; reason: string }>;
  availableWordsForPlay: number;
  availablePairsForPlay: number;
  availableCardsForPlay: number;
  targetWordsDeclared: number;
  targetPairsDeclared: number;
  idempotentUpsertVerified: boolean;
}

export interface WordBankData {
  metadata: {
    game_name_ar: string;
    organization: string;
    version: string;
    encoding: 'UTF-8';
    direction: 'RTL';
    offline_ready: boolean;
    counts: {
      words: number;
      confusing_pairs: number;
      discussion_cards: number;
    };
  };
  categories: CategoryMeta[];
  words: WordEntry[];
  confusing_pairs: ConfusingPairEntry[];
  discussion_cards: DiscussionCardEntry[];
}

export interface ScoringRules {
  classicCorrectVote: number; // default +1
  classicOutlierSurvive: number; // default +2
  classicOutlierGuessBonus: number; // default +1
  confusingCorrectVote: number; // default +1
  confusingOutlierSurvive: number; // default +2
  twoOutliersPerCorrectVote: number; // default +1
  twoOutliersSurviveEach: number; // default +2
}

export interface GameConfig {
  deviceMode: DeviceMode;
  gameMode: GameMode;
  categories: string[];
  ageBand: AgeBand;
  maxDifficulty: number;
  totalRounds: number;
  questionSeconds: number; // 0 = no timer
  discussionSeconds: number; // 0 = no timer
  allowVoteChangeBeforeClose: boolean;
  scoringRules: ScoringRules;
}

export interface PlayerPublic {
  id: string;
  name: string;
  avatarIndex: number;
  score: number;
  connected: boolean;
  isHost: boolean;
  hasRevealed: boolean;
  hasVoted: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  detail: string;
}

export interface RoundRevealSummary {
  roundNumber: number;
  gameMode: GameMode;
  categoryId: string;
  categoryNameAr: string;
  wordA: string;
  wordB?: string;
  reasonAr?: string;
  outlierIds: string[];
  outlierNames: string[];
  caughtOutlierIds: string[];
  escapedOutlierIds: string[];
  outlierGuessText?: string;
  outlierGuessCorrect?: boolean;
  voteTally: Record<string, number>;
  votesBreakdown: Array<{ voterId: string; voterName: string; targetIds: string[]; targetNames: string[] }>;
  scoreDeltas: Record<string, number>;
  leaderChanged: boolean;
  newLeaderName?: string;
  isFinalRound: boolean;
}

/**
 * Strictly secret-free public state safe for Lobby, Audience/Projector, and general broadcasts.
 * NEVER includes secretWord, wordA, wordB, outlierIds, or hidden player roles before REVEAL.
 */
export interface PublicRoomState {
  roomCode: string;
  phase: GamePhase;
  locked: boolean;
  config: GameConfig;
  players: PlayerPublic[];
  currentRound: number;
  roundId: string | null;
  questionTurn: QuestionTurn | null;
  starterPlayerId: string | null;
  starterPlayerName: string | null;
  currentCategoryId: string | null;
  currentCategoryNameAr: string | null;
  timerRemaining: number;
  timerPaused: boolean;
  activeDiscussionCard: DiscussionCardEntry | null;
  usedDiscussionCardIdsInRound: string[];
  tieCandidateIds: string[];
  votedCount: number;
  revealedCount: number;
  lastReveal: RoundRevealSummary | null;
  previousLeaderId: string | null;
  auditLog: AuditLogEntry[];
  expiresAt: number;
}

/**
 * Private per-player state sent ONLY to the authenticated player token.
 */
export interface PlayerSecretView {
  playerId: string;
  roundNumber: number;
  roundId: string;
  isOutlier: boolean;
  // In confusing_pair mode, UI NEVER displays isOutlier until REVEAL.
  showOutlierHint: boolean;
  secretWord: string | null; // null for classic/two_outliers when player is outlier
  categoryNameAr: string;
  myVoteTargetIds: string[];
}
