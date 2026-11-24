import 'dotenv/config';
import crypto from 'node:crypto';
import http from 'node:http';
import path from 'node:path';
import express, { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import QRCode from 'qrcode';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';
import {
  deleteOrArchiveWord,
  getImportReport,
  getPublicPlayableBank,
  getWordBank,
  importBulkEntries,
  initStorage,
  reimportPdfSeedIdempotently,
  updateWordById,
  upsertConfusingPair,
  upsertDiscussionCard,
  upsertWord,
} from './server/storage';
import { GAME_BRAND } from './src/game/brand';
import { RoomManager } from './server/roomManager';
import { checkWordSafety, sanitizeUserText } from './src/game/arabic';
import { exportWordsToCsv, parseCsvWords, scanBankDuplicates } from './src/game/wordBankService';
import type { ConfusingPairEntry, DiscussionCardEntry, WordEntry } from './src/types/game';

const PORT = Number(process.env.PORT) || 3000;
const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE;
const SESSION_SECRET =
  process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

function signAdminToken(payload: { role: 'admin'; exp: number }): string {
  const encoded = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyAdminToken(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [encoded, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encoded)
    .digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return false;
  }
  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf-8')) as {
      role?: string;
      exp?: number;
    };
    return parsed.role === 'admin' && typeof parsed.exp === 'number' && Date.now() < parsed.exp;
  } catch {
    return false;
  }
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : undefined;
  if (!verifyAdminToken(token)) {
    res.status(401).json({ error: 'مصادقة المشرف مطلوبة.' });
    return;
  }
  next();
}

async function startServer() {
  initStorage();
  const roomManager = new RoomManager();

  const app = express();
  if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1);

  app.use(
    helmet({
      frameguard: false,
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    })
  );

  app.use(express.json({ limit: '2mb' }));

  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 240,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'تم تجاوز حد الطلبات المسموح، يرجى الانتظار قليلًا.' },
  });
  app.use('/api', (_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); }, apiLimiter);

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 25,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'محاولات دخول كثيرة، انتظر قليلًا.' },
  });

  const roomEntryLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 60, // A shared venue IP may seat several rooms.
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'محاولات غرف كثيرة، جرّب بعد شوي.' },
  });

  // Public playable word bank (approved entries only — zero draft/needs_review exposure)
  app.get('/api/bank/playable', (_req, res) => {
    res.json(getPublicPlayableBank());
  });

  app.get('/api/bank/report', (_req, res) => {
    res.json(getImportReport());
  });

  // QR code generator endpoint
  app.get('/api/qr', async (req, res) => {
    const url = String(req.query.url || '');
    if (!url || url.length > 512) {
      res.status(400).json({ error: 'رابط غير صالح.' });
      return;
    }
    try {
      const svg = await QRCode.toString(url, {
        type: 'svg',
        margin: 1,
        color: { dark: '#070E1A', light: '#F8FAFC' },
      });
      res.type('image/svg+xml').send(svg);
    } catch {
      res.status(500).json({ error: 'تعذر توليد رمز QR.' });
    }
  });

  // --- Multi-Device Room APIs ---
  app.post('/api/rooms', roomEntryLimiter, (req, res) => {
    try {
      const { hostName, config } = req.body || {};
      const result = roomManager.createRoom({
        hostName: String(hostName || 'المضيف'),
        config,
      });
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  app.post('/api/rooms/:code/join', roomEntryLimiter, (req, res) => {
    try {
      const { name, playerToken } = req.body || {};
      const result = roomManager.joinRoom({
        roomCode: req.params.code,
        name: String(name || ''),
        existingPlayerToken: playerToken ? String(playerToken) : undefined,
      });
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  app.get('/api/rooms/:code', (req, res) => {
    const state = roomManager.getPublicRoomState(req.params.code);
    if (!state) {
      res.status(404).json({ error: 'الغرفة غير موجودة أو انتهت صلاحيتها.' });
      return;
    }
    res.json(state);
  });

  app.get('/api/rooms/:code/me', (req, res) => {
    try {
      const token = String(req.headers['x-player-token'] || '');
      if (!token) {
        res.status(401).json({ error: 'رمز اللاعب مفقود.' });
        return;
      }
      const view = roomManager.getPlayerSecretView(req.params.code, token);
      res.json(view);
    } catch (err) {
      res.status(403).json({ error: (err as Error).message });
    }
  });

  app.post('/api/rooms/:code/config', (req, res) => {
    try {
      const hostToken = String(req.headers['x-host-token'] || '');
      const state = roomManager.updateConfig(req.params.code, hostToken, req.body || {});
      res.json(state);
    } catch (err) {
      res.status(403).json({ error: (err as Error).message });
    }
  });

  app.post('/api/rooms/:code/lock', (req, res) => {
    try {
      const hostToken = String(req.headers['x-host-token'] || '');
      const state = roomManager.toggleLock(req.params.code, hostToken, Boolean(req.body?.locked));
      res.json(state);
    } catch (err) {
      res.status(403).json({ error: (err as Error).message });
    }
  });

  app.post('/api/rooms/:code/kick', (req, res) => {
    try {
      const hostToken = String(req.headers['x-host-token'] || '');
      const state = roomManager.kickPlayer(req.params.code, hostToken, String(req.body?.playerId || ''));
      res.json(state);
    } catch (err) {
      res.status(403).json({ error: (err as Error).message });
    }
  });

  app.post('/api/rooms/:code/start', (req, res) => {
    try {
      const hostToken = String(req.headers['x-host-token'] || '');
      const state = roomManager.startMatch(req.params.code, hostToken);
      res.json(state);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  app.post('/api/rooms/:code/revealed', (req, res) => {
    try {
      const token = String(req.headers['x-player-token'] || '');
      const state = roomManager.markPlayerRevealed(req.params.code, token, String(req.body?.roundId || ''));
      res.json(state);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  app.post('/api/rooms/:code/questions/advance', (req, res) => {
    try {
      const hostToken = String(req.headers['x-host-token'] || '');
      const state = roomManager.advanceQuestion(req.params.code, hostToken, String(req.body?.turnId || ''), req.body?.postpone === true);
      res.json(state);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  app.post('/api/rooms/:code/discussion/pause', (req, res) => {
    try {
      const hostToken = String(req.headers['x-host-token'] || '');
      const state = roomManager.setTimerPaused(req.params.code, hostToken, Boolean(req.body?.paused));
      res.json(state);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  app.post('/api/rooms/:code/discussion/card', (req, res) => {
    try {
      const hostToken = String(req.headers['x-host-token'] || '');
      const state = roomManager.drawDiscussionCard(req.params.code, hostToken);
      res.json(state);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  app.post('/api/rooms/:code/voting/begin', (req, res) => {
    try {
      const hostToken = String(req.headers['x-host-token'] || '');
      const state = roomManager.beginVoting(req.params.code, hostToken);
      res.json(state);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  app.post('/api/rooms/:code/voting/cast', (req, res) => {
    try {
      const playerToken = String(req.headers['x-player-token'] || '');
      const targetIds = Array.isArray(req.body?.targetIds) ? req.body.targetIds.map(String) : [];
      const state = roomManager.submitVote(req.params.code, playerToken, targetIds, String(req.body?.roundId || ''), String(req.body?.ballot || ''));
      res.json(state);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  app.post('/api/rooms/:code/voting/close', (req, res) => {
    try {
      const hostToken = String(req.headers['x-host-token'] || '');
      const state = roomManager.closeVoting(req.params.code, hostToken);
      res.json(state);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  app.post('/api/rooms/:code/guess', (req, res) => {
    try {
      const actorToken = String(
        req.headers['x-player-token'] || req.headers['x-host-token'] || ''
      );
      const state = roomManager.submitOutlierGuess(
        req.params.code,
        actorToken,
        String(req.body?.guess || '')
      );
      res.json(state);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  app.post('/api/rooms/:code/advance', (req, res) => {
    try {
      const hostToken = String(req.headers['x-host-token'] || '');
      const state = roomManager.advanceAfterReveal(req.params.code, hostToken, String(req.body?.roundId || ''), String(req.body?.phase || ''));
      res.json(state);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  app.post('/api/rooms/:code/skip-word', (req, res) => {
    try {
      const hostToken = String(req.headers['x-host-token'] || '');
      const state = roomManager.skipWord(req.params.code, hostToken);
      res.json(state);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  app.post('/api/rooms/:code/adjust-score', (req, res) => {
    try {
      const hostToken = String(req.headers['x-host-token'] || '');
      const state = roomManager.adjustScore(
        req.params.code,
        hostToken,
        String(req.body?.playerId || ''),
        Number(req.body?.delta || 0),
        String(req.body?.reason || '')
      );
      res.json(state);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  app.delete('/api/rooms/:code', (req, res) => {
    try {
      const hostToken = String(req.headers['x-host-token'] || '');
      roomManager.deleteRoom(req.params.code, hostToken);
      res.json({ ok: true });
    } catch (err) {
      res.status(403).json({ error: (err as Error).message });
    }
  });

  // --- Admin Word Bank APIs ---
  app.post('/api/admin/login', authLimiter, (req, res) => {
    const passcode = String(req.body?.passcode || '');
    if (!ADMIN_PASSCODE) {
      res.status(503).json({ error: 'دخول المشرف مش مفعّل على هالخادم.' });
      return;
    }
    const a = Buffer.from(passcode);
    const b = Buffer.from(ADMIN_PASSCODE);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      res.status(401).json({ error: 'رمز المشرف غير صحيح.' });
      return;
    }
    const token = signAdminToken({
      role: 'admin',
      exp: Date.now() + 8 * 60 * 60 * 1000,
    });
    res.json({ token });
  });

  app.get('/api/admin/bank', requireAdmin, (_req, res) => {
    const bank = getWordBank();
    const report = getImportReport();
    const duplicates = scanBankDuplicates(bank.words);
    res.json({ bank, report, duplicates });
  });

  app.post('/api/admin/reimport-pdf', requireAdmin, (_req, res) => {
    const result = reimportPdfSeedIdempotently();
    res.json(result);
  });

  app.post('/api/admin/words', requireAdmin, (req, res) => {
    const body = req.body || {};
    const text_ar = sanitizeUserText(String(body.text_ar || ''), 60);
    if (text_ar.length < 2) {
      res.status(400).json({ error: 'النص العربي مطلوب (حرفان على الأقل).' });
      return;
    }
    const bank = getWordBank();
    const nextId =
      body.id && /^W_[0-9A-Za-z_-]+$/.test(String(body.id))
        ? String(body.id)
        : `W_${String(bank.words.length + 1).padStart(4, '0')}`;
    const safety = checkWordSafety(text_ar);
    const entry: WordEntry = {
      id: nextId,
      text_ar,
      category: String(body.category || 'CAT_FOOD'),
      subcategory: sanitizeUserText(String(body.subcategory || 'مخصص'), 40),
      age_bands: Array.isArray(body.age_bands) && body.age_bands.length > 0
        ? body.age_bands
        : ['families_mixed'],
      difficulty: Math.min(5, Math.max(1, Number(body.difficulty) || 2)),
      tags: Array.isArray(body.tags) ? body.tags.map(String) : ['مخصص'],
      region: body.region || 'jordan_levant',
      status: safety.needsReview ? 'needs_review' : (body.status || 'approved'),
      ...(safety.reason ? { review_note: safety.reason } : {}),
    };
    const updated = upsertWord(entry);
    res.status(201).json({ entry, counts: updated.metadata.counts });
  });

  app.patch('/api/admin/words/:id', requireAdmin, (req, res) => {
    const patch = { ...(req.body || {}) };
    if (patch.text_ar) patch.text_ar = sanitizeUserText(String(patch.text_ar), 60);
    const updated = updateWordById(req.params.id, patch);
    if (!updated) {
      res.status(404).json({ error: 'الكلمة غير موجودة.' });
      return;
    }
    res.json({ ok: true, counts: updated.metadata.counts });
  });

  app.delete('/api/admin/words/:id', requireAdmin, (req, res) => {
    const hard = req.query.hard === '1';
    const updated = deleteOrArchiveWord(req.params.id, hard);
    if (!updated) {
      res.status(404).json({ error: 'الكلمة غير موجودة.' });
      return;
    }
    res.json({ ok: true, counts: updated.metadata.counts });
  });

  app.post('/api/admin/pairs', requireAdmin, (req, res) => {
    const b = req.body || {};
    if (!b.word_a_id || !b.word_b_id || b.word_a_id === b.word_b_id) {
      res.status(400).json({ error: 'يجب اختيار كلمتين مختلفتين لربط الزوج.' });
      return;
    }
    const bank = getWordBank();
    const wA = bank.words.find((w) => w.id === b.word_a_id);
    const wB = bank.words.find((w) => w.id === b.word_b_id);
    if (!wA || !wB) {
      res.status(404).json({ error: 'إحدى الكلمتين غير موجودة.' });
      return;
    }
    const id =
      b.id && /^CP_[0-9A-Za-z_-]+$/.test(String(b.id))
        ? String(b.id)
        : `CP_${String(bank.confusing_pairs.length + 1).padStart(3, '0')}`;
    const pair: ConfusingPairEntry = {
      id,
      word_a_id: wA.id,
      word_b_id: wB.id,
      word_a_text: wA.text_ar,
      word_b_text: wB.text_ar,
      category: String(b.category || wA.category),
      age_bands: wA.age_bands,
      difficulty: Math.max(wA.difficulty, wB.difficulty),
      similarity_level: Math.min(5, Math.max(1, Number(b.similarity_level) || 4)),
      reason_ar: sanitizeUserText(String(b.reason_ar || 'كلمتان متقاربتان في المعنى أو الاستخدام.'), 220),
      status: b.status || 'approved',
    };
    const updated = upsertConfusingPair(pair);
    res.status(201).json({ pair, counts: updated.metadata.counts });
  });

  app.post('/api/admin/cards', requireAdmin, (req, res) => {
    const b = req.body || {};
    const prompt_ar = sanitizeUserText(String(b.prompt_ar || ''), 160);
    if (prompt_ar.length < 5) {
      res.status(400).json({ error: 'نص بطاقة النقاش قصير جدًا.' });
      return;
    }
    const bank = getWordBank();
    const id =
      b.id && /^DC_[0-9A-Za-z_-]+$/.test(String(b.id))
        ? String(b.id)
        : `DC_${String(bank.discussion_cards.length + 1).padStart(3, '0')}`;
    const card: DiscussionCardEntry = {
      id,
      prompt_ar,
      categories: Array.isArray(b.categories) && b.categories.length > 0 ? b.categories : bank.categories.map((c) => c.id),
      age_bands: Array.isArray(b.age_bands) && b.age_bands.length > 0 ? b.age_bands : ['families_mixed'],
      status: b.status || 'approved',
    };
    const updated = upsertDiscussionCard(card);
    res.status(201).json({ card, counts: updated.metadata.counts });
  });

  app.post('/api/admin/import', requireAdmin, (req, res) => {
    const { format, content } = req.body || {};
    try {
      if (format === 'csv') {
        const parsed = parseCsvWords(String(content || ''));
        const result = importBulkEntries({ words: parsed });
        res.json({
          addedCount: result.addedCount,
          updatedCount: result.updatedCount,
          skippedDuplicates: result.skippedDuplicates,
          counts: result.updated.metadata.counts,
        });
        return;
      }
      const parsed = typeof content === 'string' ? JSON.parse(content) : content;
      const result = importBulkEntries({
        words: Array.isArray(parsed?.words) ? parsed.words : undefined,
        confusing_pairs: Array.isArray(parsed?.confusing_pairs) ? parsed.confusing_pairs : undefined,
        discussion_cards: Array.isArray(parsed?.discussion_cards) ? parsed.discussion_cards : undefined,
      });
      res.json({
        addedCount: result.addedCount,
        updatedCount: result.updatedCount,
        skippedDuplicates: result.skippedDuplicates,
        counts: result.updated.metadata.counts,
      });
    } catch {
      res.status(400).json({ error: 'تعذر تحليل ملف الاستيراد، تحقق من التنسيق.' });
    }
  });

  app.get('/api/admin/export', requireAdmin, (req, res) => {
    const bank = getWordBank();
    const format = String(req.query.format || 'json');
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="ho_maana_words.csv"');
      res.send(exportWordsToCsv(bank.words));
      return;
    }
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="ho_maana_word_bank.json"');
    res.send(JSON.stringify(bank, null, 2));
  });

  // --- HTTP + WebSocket Server ---
  const server = http.createServer(app);
  const wss = new WebSocketServer({
    server, path: '/ws', maxPayload: 2048,
    verifyClient: ({ origin, req }: { origin: string; req: http.IncomingMessage }) => {
      // Browser clients may only subscribe from this application's origin.
      if (!origin) return true;
      try {
        const url = new URL(origin);
        const forwarded = process.env.TRUST_PROXY === '1' ? req.headers['x-forwarded-host'] : undefined;
        return url.host === (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.headers.host);
      } catch {
        return false;
      }
    },
  });

  interface ClientMeta {
    roomCode: string;
    playerToken?: string;
    role: 'player' | 'projector';
  }
  const clientMeta = new Map<WebSocket, ClientMeta>();

  const sendRoom = (ws: WebSocket, meta: ClientMeta) => {
    if (ws.readyState !== WebSocket.OPEN) return;
    const state = roomManager.getPublicRoomState(meta.roomCode);
    if (!state) {
      ws.send(JSON.stringify({ type: 'room:closed' }));
      ws.close(1008);
      return;
    }
    let secret;
    if (meta.role === 'player' && meta.playerToken) {
      try {
        roomManager.authenticatePlayer(meta.roomCode, meta.playerToken);
        if (state.phase !== 'LOBBY') secret = roomManager.getPlayerSecretView(meta.roomCode, meta.playerToken);
      } catch {
        ws.send(JSON.stringify({ type: 'room:error', error: 'جلسة الغرفة مش صالحة.' }));
        ws.close(1008);
        return;
      }
    }
    ws.send(JSON.stringify({ type: 'room:state', state, secret }));
  };

  const broadcastRoom = (roomCode: string) => {
    for (const [ws, meta] of clientMeta) {
      if (meta.roomCode === roomCode) sendRoom(ws, meta);
    }
  };

  roomManager.onRoomUpdated(broadcastRoom);

  wss.on('connection', (ws) => {
    // A socket can subscribe once. Unused connections do not stay open.
    const handshake = setTimeout(() => { if (!clientMeta.has(ws)) ws.close(1008); }, 5000);
    ws.on('error', () => ws.terminate());
    ws.once('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString()) as {
          type?: string;
          roomCode?: string;
          playerToken?: string;
          role?: 'player' | 'projector';
        };
        if (msg.type === 'subscribe' && msg.roomCode) {
          const code = msg.roomCode.trim().toUpperCase();
          const role = msg.role === 'projector' ? 'projector' : 'player';
          if (role === 'player') roomManager.authenticatePlayer(code, String(msg.playerToken || ''));
          if (!roomManager.getPublicRoomState(code)) {
            ws.send(JSON.stringify({ type: 'room:error', error: 'الغرفة غير موجودة.' }));
            ws.close(1008);
            return;
          }
          clientMeta.set(ws, {
            roomCode: code,
            playerToken: role === 'player' ? msg.playerToken : undefined,
            role,
          });
          if (role === 'player' && msg.playerToken) {
            roomManager.setPlayerConnection(code, msg.playerToken, true);
          }
          sendRoom(ws, clientMeta.get(ws)!);
        }
      } catch {
        ws.send(JSON.stringify({ type: 'room:error', error: 'جلسة الغرفة مش صالحة.' }));
        ws.close(1008);
      }
    });

    ws.on('close', () => {
      clearTimeout(handshake);
      const meta = clientMeta.get(ws);
      clientMeta.delete(ws);
      if (meta?.role === 'player' && meta.playerToken && ![...clientMeta.values()].some((other) =>
        other.roomCode === meta.roomCode && other.playerToken === meta.playerToken)) {
        roomManager.setPlayerConnection(meta.roomCode, meta.playerToken, false);
      }
    });
  });

  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`${GAME_BRAND.name} server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
