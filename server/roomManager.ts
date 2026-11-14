import crypto from 'node:crypto';
import { sanitizeUserText } from '../src/game/arabic';
import {
  DEFAULT_GAME_CONFIG,
  SecretRoundAssignment,
  createRoundAssignment,
  evaluateVotingOutcome,
  finalizeRoundSummary,
  pickDiscussionCardForRound,
  validateMatchStart,
  validateVoteSubmission,
} from '../src/game/rules';
import { getPublicPlayableBank } from './storage';
import type {
  AuditLogEntry,
  DiscussionCardEntry,
  GameConfig,
  GamePhase,
  PlayerPublic,
  PlayerSecretView,
  PublicRoomState,
  RoundRevealSummary,
} from '../src/types/game';

interface InternalPlayer extends PlayerPublic {
  playerToken: string;
}

interface InternalRoom {
  roomCode: string;
  hostToken: string;
  phase: GamePhase;
  locked: boolean;
  config: GameConfig;
  players: InternalPlayer[];
  currentRound: number;
  assignment: SecretRoundAssignment | null;
  playedWordIds: string[];
  playedPairIds: string[];
  revealedPlayerIds: Set<string>;
  votes: Record<string, string[]>;
  isTieBreakerRound: boolean;
  tieCandidateIds: string[];
  accusedIdsPendingGuess: string[];
  pendingTally: Record<string, number> | null;
  roundScored: boolean;
  timerRemaining: number;
  timerPaused: boolean;
  activeDiscussionCard: DiscussionCardEntry | null;
  usedDiscussionCardIdsInRound: string[];
  lastReveal: RoundRevealSummary | null;
  previousLeaderId: string | null;
  auditLog: AuditLogEntry[];
  lastActivityAt: number;
  expiresAt: number;
}

const ROOM_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours inactivity expiry
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

type BroadcastListener = (roomCode: string) => void;

export class RoomManager {
  private rooms = new Map<string, InternalRoom>();
  private listeners = new Set<BroadcastListener>();
  private timerHandle: NodeJS.Timeout | null = null;

  constructor() {
    this.timerHandle = setInterval(() => this.tick(), 1000);
    this.timerHandle.unref?.();
  }

  onRoomUpdated(listener: BroadcastListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(roomCode: string) {
    for (const cb of this.listeners) {
      cb(roomCode);
    }
  }

  private generateRoomCode(): string {
    for (let attempt = 0; attempt < 20; attempt++) {
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += CODE_CHARS[crypto.randomInt(CODE_CHARS.length)];
      }
      if (!this.rooms.has(code)) return code;
    }
    return crypto.randomBytes(3).toString('hex').toUpperCase();
  }

  private generateToken(): string {
    return crypto.randomBytes(24).toString('hex');
  }

  private touch(room: InternalRoom) {
    const now = Date.now();
    room.lastActivityAt = now;
    room.expiresAt = now + ROOM_TTL_MS;
  }

  private addAudit(room: InternalRoom, action: string, detail: string) {
    room.auditLog.unshift({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      action,
      detail,
    });
    if (room.auditLog.length > 40) room.auditLog.length = 40;
  }

  private tick() {
    const now = Date.now();
    for (const [code, room] of this.rooms.entries()) {
      if (now > room.expiresAt) {
        this.rooms.delete(code);
        continue;
      }
      if (
        room.phase === 'DISCUSSION' &&
        room.config.discussionSeconds > 0 &&
        !room.timerPaused &&
        room.timerRemaining > 0
      ) {
        room.timerRemaining -= 1;
        this.notify(code);
      }
    }
  }

  createRoom(params: { hostName: string; config?: Partial<GameConfig> }): {
    roomCode: string;
    hostToken: string;
    playerToken: string;
    playerId: string;
    state: PublicRoomState;
  } {
    const roomCode = this.generateRoomCode();
    const hostToken = this.generateToken();
    const playerToken = this.generateToken();
    const playerId = crypto.randomUUID();
    const cleanHost = sanitizeUserText(params.hostName, 24) || 'المضيف';

    const config: GameConfig = {
      ...DEFAULT_GAME_CONFIG,
      ...params.config,
      deviceMode: 'multi_device',
      scoringRules: {
        ...DEFAULT_GAME_CONFIG.scoringRules,
        ...(params.config?.scoringRules || {}),
      },
    };

    const now = Date.now();
    const room: InternalRoom = {
      roomCode,
      hostToken,
      phase: 'LOBBY',
      locked: false,
      config,
      players: [
        {
          id: playerId,
          name: cleanHost,
          avatarIndex: 0,
          score: 0,
          connected: true,
          isHost: true,
          hasRevealed: false,
          hasVoted: false,
          playerToken,
        },
      ],
      currentRound: 0,
      assignment: null,
      playedWordIds: [],
      playedPairIds: [],
      revealedPlayerIds: new Set(),
      votes: {},
      isTieBreakerRound: false,
      tieCandidateIds: [],
      accusedIdsPendingGuess: [],
      pendingTally: null,
      roundScored: false,
      timerRemaining: config.discussionSeconds,
      timerPaused: false,
      activeDiscussionCard: null,
      usedDiscussionCardIdsInRound: [],
      lastReveal: null,
      previousLeaderId: null,
      auditLog: [],
      lastActivityAt: now,
      expiresAt: now + ROOM_TTL_MS,
    };

    this.addAudit(room, 'إنشاء الغرفة', `أنشأ ${cleanHost} غرفة برمز ${roomCode}`);
    this.rooms.set(roomCode, room);

    return {
      roomCode,
      hostToken,
      playerToken,
      playerId,
      state: this.getPublicRoomState(roomCode)!,
    };
  }

  joinRoom(params: { roomCode: string; name: string; existingPlayerToken?: string }): {
    playerToken: string;
    playerId: string;
    reconnected: boolean;
    state: PublicRoomState;
  } {
    const code = params.roomCode.trim().toUpperCase();
    const room = this.rooms.get(code);
    if (!room) {
      throw new Error('الغرفة غير موجودة أو انتهت صلاحيتها.');
    }

    // Reconnection by existing playerToken without duplicating the player
    if (params.existingPlayerToken) {
      const existing = room.players.find((p) => p.playerToken === params.existingPlayerToken);
      if (existing) {
        existing.connected = true;
        this.touch(room);
        this.notify(code);
        return {
          playerToken: existing.playerToken,
          playerId: existing.id,
          reconnected: true,
          state: this.getPublicRoomState(code)!,
        };
      }
    }

    if (room.locked || room.phase !== 'LOBBY') {
      throw new Error('الغرفة مقفلة حاليًا أو بدأت المباراة بالفعل.');
    }

    if (room.players.length >= 12) {
      throw new Error('الغرفة ممتلئة (الحد الأقصى 12 لاعبًا).');
    }

    const cleanName = sanitizeUserText(params.name, 24);
    if (!cleanName || cleanName.length < 2) {
      throw new Error('يرجى إدخال اسم مستعار من حرفين على الأقل.');
    }

    if (room.players.some((p) => p.name.toLowerCase() === cleanName.toLowerCase())) {
      throw new Error('هذا الاسم مستخدم بالفعل في الغرفة، اختر اسمًا آخر.');
    }

    const playerId = crypto.randomUUID();
    const playerToken = this.generateToken();
    room.players.push({
      id: playerId,
      name: cleanName,
      avatarIndex: room.players.length % 12,
      score: 0,
      connected: true,
      isHost: false,
      hasRevealed: false,
      hasVoted: false,
      playerToken,
    });

    this.addAudit(room, 'انضمام لاعب', `انضم ${cleanName} إلى الغرفة`);
    this.touch(room);
    this.notify(code);

    return {
      playerToken,
      playerId,
      reconnected: false,
      state: this.getPublicRoomState(code)!,
    };
  }

  setPlayerConnection(roomCode: string, playerToken: string, connected: boolean) {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) return;
    const player = room.players.find((p) => p.playerToken === playerToken);
    if (player && player.connected !== connected) {
      player.connected = connected;
      this.touch(room);
      this.notify(room.roomCode);
    }
  }

  private requireRoom(roomCode: string): InternalRoom {
    const room = this.rooms.get(roomCode.trim().toUpperCase());
    if (!room) throw new Error('الغرفة غير موجودة.');
    return room;
  }

  private requireHost(room: InternalRoom, hostToken: string) {
    if (!hostToken || room.hostToken !== hostToken) {
      throw new Error('غير مصرح: هذا الإجراء مخصص لمضيف الغرفة فقط.');
    }
  }

  private requirePlayer(room: InternalRoom, playerToken: string): InternalPlayer {
    const player = room.players.find((p) => p.playerToken === playerToken);
    if (!player) {
      throw new Error('جلسة اللاعب غير صالحة لهذه الغرفة.');
    }
    return player;
  }

  updateConfig(roomCode: string, hostToken: string, patch: Partial<GameConfig>): PublicRoomState {
    const room = this.requireRoom(roomCode);
    this.requireHost(room, hostToken);
    if (room.phase !== 'LOBBY') {
      throw new Error('لا يمكن تعديل قواعد النقاط أو الإعدادات بعد بدء المباراة.');
    }
    room.config = {
      ...room.config,
      ...patch,
      deviceMode: 'multi_device',
      scoringRules: {
        ...room.config.scoringRules,
        ...(patch.scoringRules || {}),
      },
    };
    this.touch(room);
    this.notify(room.roomCode);
    return this.getPublicRoomState(room.roomCode)!;
  }

  toggleLock(roomCode: string, hostToken: string, locked: boolean): PublicRoomState {
    const room = this.requireRoom(roomCode);
    this.requireHost(room, hostToken);
    room.locked = locked;
    this.addAudit(room, locked ? 'قفل الغرفة' : 'فتح الغرفة', locked ? 'تم منع الانضمام' : 'تم السماح بالانضمام');
    this.touch(room);
    this.notify(room.roomCode);
    return this.getPublicRoomState(room.roomCode)!;
  }

  kickPlayer(roomCode: string, hostToken: string, targetPlayerId: string): PublicRoomState {
    const room = this.requireRoom(roomCode);
    this.requireHost(room, hostToken);
    const target = room.players.find((p) => p.id === targetPlayerId);
    if (!target) throw new Error('اللاعب غير موجود.');
    if (target.isHost) throw new Error('لا يمكن طرد المضيف.');
    room.players = room.players.filter((p) => p.id !== targetPlayerId);
    this.addAudit(room, 'استبعاد لاعب', `تم إخراج ${target.name}`);
    this.touch(room);
    this.notify(room.roomCode);
    return this.getPublicRoomState(room.roomCode)!;
  }

  startMatch(roomCode: string, hostToken: string): PublicRoomState {
    const room = this.requireRoom(roomCode);
    this.requireHost(room, hostToken);
    if (room.phase !== 'LOBBY' && room.phase !== 'FINAL_WINNER') {
      throw new Error('المباراة قيد التشغيل بالفعل.');
    }

    const bank = getPublicPlayableBank();
    const check = validateMatchStart(room.players.length, room.config, bank);
    if (!check.valid) throw new Error(check.error);

    for (const p of room.players) {
      p.score = 0;
    }
    room.currentRound = 0;
    room.playedWordIds = [];
    room.playedPairIds = [];
    room.previousLeaderId = null;
    room.lastReveal = null;
    room.locked = true;
    this.startRoundInternal(room);
    return this.getPublicRoomState(room.roomCode)!;
  }

  private startRoundInternal(room: InternalRoom) {
    const bank = getPublicPlayableBank();
    room.currentRound += 1;
    const assignment = createRoundAssignment({
      roundNumber: room.currentRound,
      players: room.players.map((p) => ({ id: p.id, name: p.name })),
      config: room.config,
      bank,
      playedWordIds: room.playedWordIds,
      playedPairIds: room.playedPairIds,
    });

    room.assignment = assignment;
    room.playedWordIds.push(assignment.wordIdUsed);
    if (assignment.pairIdUsed) room.playedPairIds.push(assignment.pairIdUsed);
    room.phase = 'SECRET_REVEAL';
    room.revealedPlayerIds = new Set();
    room.votes = {};
    room.isTieBreakerRound = false;
    room.tieCandidateIds = [];
    room.accusedIdsPendingGuess = [];
    room.pendingTally = null;
    room.roundScored = false;
    room.timerRemaining = room.config.discussionSeconds;
    room.timerPaused = false;
    room.activeDiscussionCard = null;
    room.usedDiscussionCardIdsInRound = [];
    room.lastReveal = null;

    for (const p of room.players) {
      p.hasRevealed = false;
      p.hasVoted = false;
    }

    this.addAudit(room, `بدء الجولة ${room.currentRound}`, `الفئة: ${assignment.categoryNameAr}`);
    this.touch(room);
    this.notify(room.roomCode);
  }

  markPlayerRevealed(roomCode: string, playerToken: string): PublicRoomState {
    const room = this.requireRoom(roomCode);
    if (room.phase !== 'SECRET_REVEAL') {
      throw new Error('مرحلة كشف الكلمة ليست نشطة الآن.');
    }
    const player = this.requirePlayer(room, playerToken);
    room.revealedPlayerIds.add(player.id);
    player.hasRevealed = true;
    this.touch(room);
    this.notify(room.roomCode);
    return this.getPublicRoomState(room.roomCode)!;
  }

  beginDiscussion(roomCode: string, hostToken: string): PublicRoomState {
    const room = this.requireRoom(roomCode);
    this.requireHost(room, hostToken);
    if (room.phase !== 'SECRET_REVEAL') {
      throw new Error('لا يمكن بدء النقاش من المرحلة الحالية.');
    }
    room.phase = 'DISCUSSION';
    room.timerRemaining = room.config.discussionSeconds;
    room.timerPaused = false;
    this.touch(room);
    this.notify(room.roomCode);
    return this.getPublicRoomState(room.roomCode)!;
  }

  setTimerPaused(roomCode: string, hostToken: string, paused: boolean): PublicRoomState {
    const room = this.requireRoom(roomCode);
    this.requireHost(room, hostToken);
    if (room.phase !== 'DISCUSSION') {
      throw new Error('المؤقت يعمل أثناء مرحلة النقاش فقط.');
    }
    room.timerPaused = paused;
    this.touch(room);
    this.notify(room.roomCode);
    return this.getPublicRoomState(room.roomCode)!;
  }

  drawDiscussionCard(roomCode: string, hostToken: string): PublicRoomState {
    const room = this.requireRoom(roomCode);
    this.requireHost(room, hostToken);
    if (room.phase !== 'DISCUSSION' || !room.assignment) {
      throw new Error('بطاقات النقاش متاحة أثناء مرحلة النقاش فقط.');
    }
    const bank = getPublicPlayableBank();
    const card = pickDiscussionCardForRound(
      bank,
      room.assignment.categoryId,
      room.usedDiscussionCardIdsInRound
    );
    if (card) {
      room.activeDiscussionCard = card;
      if (!room.usedDiscussionCardIdsInRound.includes(card.id)) {
        room.usedDiscussionCardIdsInRound.push(card.id);
      }
    }
    this.touch(room);
    this.notify(room.roomCode);
    return this.getPublicRoomState(room.roomCode)!;
  }

  beginVoting(roomCode: string, hostToken: string): PublicRoomState {
    const room = this.requireRoom(roomCode);
    this.requireHost(room, hostToken);
    if (room.phase !== 'DISCUSSION' && room.phase !== 'SUSPICION_MOMENT') {
      throw new Error('لا يمكن الانتقال للتصويت من المرحلة الحالية.');
    }
    room.phase = 'VOTING';
    room.votes = {};
    room.isTieBreakerRound = false;
    room.tieCandidateIds = [];
    for (const p of room.players) p.hasVoted = false;
    this.touch(room);
    this.notify(room.roomCode);
    return this.getPublicRoomState(room.roomCode)!;
  }

  submitVote(roomCode: string, playerToken: string, targetIds: string[]): PublicRoomState {
    const room = this.requireRoom(roomCode);
    if (room.phase !== 'VOTING' && room.phase !== 'TIE_BREAKER') {
      throw new Error('التصويت مغلق حاليًا.');
    }
    const player = this.requirePlayer(room, playerToken);
    const check = validateVoteSubmission({
      voterId: player.id,
      targetIds,
      players: room.players,
      gameMode: room.config.gameMode,
      existingVotes: room.votes,
      allowVoteChange: room.config.allowVoteChangeBeforeClose,
      tieCandidateIds: room.tieCandidateIds,
    });
    if (!check.valid) throw new Error(check.error);

    room.votes[player.id] = targetIds;
    player.hasVoted = true;
    this.touch(room);
    this.notify(room.roomCode);
    return this.getPublicRoomState(room.roomCode)!;
  }

  closeVoting(roomCode: string, hostToken: string): PublicRoomState {
    const room = this.requireRoom(roomCode);
    this.requireHost(room, hostToken);
    if (room.phase !== 'VOTING' && room.phase !== 'TIE_BREAKER') {
      throw new Error('لا توجد مرحلة تصويت نشطة لإغلاقها.');
    }
    if (!room.assignment) throw new Error('بيانات الجولة غير مكتملة.');

    const outcome = evaluateVotingOutcome({
      votes: room.votes,
      players: room.players,
      gameMode: room.config.gameMode,
      isTieBreakerRound: room.isTieBreakerRound,
    });

    if (outcome.needsTieBreaker) {
      room.phase = 'TIE_BREAKER';
      room.isTieBreakerRound = true;
      room.tieCandidateIds = outcome.tieCandidateIds;
      room.votes = {};
      for (const p of room.players) p.hasVoted = false;
      this.addAudit(room, 'جولة تصويت فاصلة', 'تعادل في الأصوات — بدأت الجولة الفاصلة');
      this.touch(room);
      this.notify(room.roomCode);
      return this.getPublicRoomState(room.roomCode)!;
    }

    room.pendingTally = outcome.tally;
    room.accusedIdsPendingGuess = outcome.accusedIds;

    // In Classic mode, if outlier was caught, give them ONE chance to guess the secret word
    const caughtOutlier = room.assignment.outlierIds.some((oid) => outcome.accusedIds.includes(oid));
    if (room.config.gameMode === 'classic' && caughtOutlier) {
      room.phase = 'OUTLIER_GUESS';
      this.touch(room);
      this.notify(room.roomCode);
      return this.getPublicRoomState(room.roomCode)!;
    }

    this.completeRevealAndScore(room, undefined);
    return this.getPublicRoomState(room.roomCode)!;
  }

  submitOutlierGuess(roomCode: string, actorToken: string, guessText: string): PublicRoomState {
    const room = this.requireRoom(roomCode);
    if (room.phase !== 'OUTLIER_GUESS' || !room.assignment) {
      throw new Error('مرحلة تخمين الكلمة غير نشطة.');
    }
    const isHost = actorToken === room.hostToken;
    const player = room.players.find((p) => p.playerToken === actorToken);
    const isOutlier = player && room.assignment.outlierIds.includes(player.id);
    if (!isHost && !isOutlier) {
      throw new Error('المخمن أو المضيف فقط يمكنه إرسال تخمين الكلمة.');
    }
    const cleanGuess = sanitizeUserText(guessText, 48);
    this.completeRevealAndScore(room, cleanGuess);
    return this.getPublicRoomState(room.roomCode)!;
  }

  private completeRevealAndScore(room: InternalRoom, outlierGuessText?: string) {
    if (!room.assignment || room.roundScored) return;
    room.roundScored = true;

    const { summary, updatedScores, newLeaderId } = finalizeRoundSummary({
      assignment: room.assignment,
      players: room.players,
      votes: room.votes,
      accusedIds: room.accusedIdsPendingGuess,
      tally: room.pendingTally || {},
      scoringRules: room.config.scoringRules,
      outlierGuessText,
      totalRounds: room.config.totalRounds,
      previousLeaderId: room.previousLeaderId,
    });

    for (const p of room.players) {
      p.score = updatedScores[p.id] ?? p.score;
    }
    room.previousLeaderId = newLeaderId;
    room.lastReveal = summary;
    room.phase = 'REVEAL';
    this.addAudit(
      room,
      `كشف الجولة ${room.currentRound}`,
      `الكلمة: ${summary.wordA} · المختلف: ${summary.outlierNames.join('، ')}`
    );
    this.touch(room);
    this.notify(room.roomCode);
  }

  advanceAfterReveal(roomCode: string, hostToken: string): PublicRoomState {
    const room = this.requireRoom(roomCode);
    this.requireHost(room, hostToken);
    if (room.phase === 'REVEAL') {
      room.phase = room.currentRound >= room.config.totalRounds ? 'FINAL_WINNER' : 'RESULTS';
      this.touch(room);
      this.notify(room.roomCode);
      return this.getPublicRoomState(room.roomCode)!;
    }
    if (room.phase === 'RESULTS') {
      this.startRoundInternal(room);
      return this.getPublicRoomState(room.roomCode)!;
    }
    throw new Error('الانتقال غير مسموح في المرحلة الحالية.');
  }

  skipWord(roomCode: string, hostToken: string): PublicRoomState {
    const room = this.requireRoom(roomCode);
    this.requireHost(room, hostToken);
    if (room.phase === 'LOBBY' || room.phase === 'FINAL_WINNER') {
      throw new Error('لا توجد جولة جارية لتخطي كلمتها.');
    }
    // Re-roll round without incrementing round number
    room.currentRound = Math.max(0, room.currentRound - 1);
    this.addAudit(room, 'تخطي الكلمة', 'استبدل المضيف الكلمة وأعاد توزيع الأدوار');
    this.startRoundInternal(room);
    return this.getPublicRoomState(room.roomCode)!;
  }

  adjustScore(roomCode: string, hostToken: string, playerId: string, delta: number, reason: string): PublicRoomState {
    const room = this.requireRoom(roomCode);
    this.requireHost(room, hostToken);
    const player = room.players.find((p) => p.id === playerId);
    if (!player) throw new Error('اللاعب غير موجود.');
    const safeDelta = Math.max(-5, Math.min(5, Math.trunc(delta)));
    player.score = Math.max(0, player.score + safeDelta);
    this.addAudit(
      room,
      'تعديل نقاط من المضيف',
      `${player.name}: ${safeDelta >= 0 ? `+${safeDelta}` : safeDelta} (${sanitizeUserText(reason, 40) || 'تصحيح'})`
    );
    this.touch(room);
    this.notify(room.roomCode);
    return this.getPublicRoomState(room.roomCode)!;
  }

  deleteRoom(roomCode: string, hostToken: string) {
    const room = this.requireRoom(roomCode);
    this.requireHost(room, hostToken);
    this.rooms.delete(room.roomCode);
    this.notify(room.roomCode);
  }

  /**
   * Returns strictly secret-free PublicRoomState (safe for players & 16:9 Projector).
   * NEVER leaks secret words, outlierIds, or individual votes before REVEAL.
   */
  getPublicRoomState(roomCode: string): PublicRoomState | null {
    const room = this.rooms.get(roomCode.trim().toUpperCase());
    if (!room) return null;

    const revealAllowed =
      room.phase === 'REVEAL' || room.phase === 'RESULTS' || room.phase === 'FINAL_WINNER';
    const starter = room.assignment
      ? room.players.find((p) => p.id === room.assignment!.starterPlayerId) || null
      : null;

    return {
      roomCode: room.roomCode,
      phase: room.phase,
      locked: room.locked,
      config: room.config,
      players: room.players.map((p) => ({
        id: p.id,
        name: p.name,
        avatarIndex: p.avatarIndex,
        score: p.score,
        connected: p.connected,
        isHost: p.isHost,
        hasRevealed: p.hasRevealed,
        hasVoted: p.hasVoted,
      })),
      currentRound: room.currentRound,
      starterPlayerId: starter?.id || null,
      starterPlayerName: starter?.name || null,
      currentCategoryId: room.assignment?.categoryId || null,
      currentCategoryNameAr: room.assignment?.categoryNameAr || null,
      timerRemaining: room.timerRemaining,
      timerPaused: room.timerPaused,
      activeDiscussionCard: room.activeDiscussionCard,
      usedDiscussionCardIdsInRound: room.usedDiscussionCardIdsInRound,
      tieCandidateIds: room.tieCandidateIds,
      votedCount: Object.keys(room.votes).length,
      revealedCount: room.revealedPlayerIds.size,
      lastReveal: revealAllowed ? room.lastReveal : null,
      previousLeaderId: room.previousLeaderId,
      auditLog: room.auditLog,
      expiresAt: room.expiresAt,
    };
  }

  /**
   * Returns private secret card ONLY for the authenticated playerToken.
   */
  getPlayerSecretView(roomCode: string, playerToken: string): PlayerSecretView {
    const room = this.requireRoom(roomCode);
    const player = this.requirePlayer(room, playerToken);
    if (!room.assignment) {
      throw new Error('لم تبدأ الجولة بعد.');
    }
    const isOutlier = room.assignment.outlierIds.includes(player.id);
    const secretWord = room.assignment.playerWords[player.id] ?? null;
    // In confusing_pair mode, NEVER indicate to the player that they are the outlier
    const showOutlierHint = room.config.gameMode !== 'confusing_pair' && isOutlier;

    return {
      playerId: player.id,
      roundNumber: room.currentRound,
      isOutlier: showOutlierHint,
      showOutlierHint,
      secretWord,
      categoryNameAr: room.assignment.categoryNameAr,
      myVoteTargetIds: room.votes[player.id] || [],
    };
  }

  destroy() {
    if (this.timerHandle) {
      clearInterval(this.timerHandle);
      this.timerHandle = null;
    }
  }
}
