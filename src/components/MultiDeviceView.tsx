import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Copy,
  Check,
  Lock,
  MonitorPlay,
  Play,
  ShieldAlert,
  Sliders,
  Trash2,
  Unlock,
  UserX,
  Users,
} from 'lucide-react';
import type {
  PlayerSecretView,
  PublicRoomState,
} from '../types/game';
import { QuestionStage } from './QuestionStage';
import { ROOM_SESSION_KEY } from '../game/session';
import { soundFx } from '../utils/sound';
import {MatchProgress,StageSound} from './MatchProgress';
import { DiscussionStage } from './DiscussionStage';
import { OutlierGuessStage, RevealAndResults } from './RevealAndResults';
import { SecretCardReveal } from './SecretCardReveal';
import { GameBrandLockup, PlayerAvatar } from './SvgAssets';
import { VotingStage } from './VotingStage';

interface MultiDeviceSession {
  roomCode: string;
  playerId: string;
  playerToken: string;
  hostToken?: string;
}

interface MultiDeviceViewProps {
  initialSession: MultiDeviceSession | null;
  initialJoinCode?: string;
  onExitHome: () => void;
  onOpenProjector: (roomCode: string) => void;
}

export const MultiDeviceView: React.FC<MultiDeviceViewProps> = ({
  initialSession,
  initialJoinCode = '',
  onExitHome,
  onOpenProjector,
}) => {
  const [session, setSession] = useState<MultiDeviceSession | null>(() => {
    if (initialSession) return initialSession;
    try {
      const saved = sessionStorage.getItem(ROOM_SESSION_KEY);
      if (saved) {
        const stored = JSON.parse(saved) as MultiDeviceSession;
        if (!initialJoinCode || initialJoinCode === stored.roomCode) return stored;
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [joinCode, setJoinCode] = useState(initialJoinCode);
  const [joinName, setJoinName] = useState('');
  const [roomState, setRoomState] = useState<PublicRoomState | null>(null);
  const [secretView, setSecretView] = useState<PlayerSecretView | null>(null);
  const [reviewRoundId, setReviewRoundId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showHostDrawer, setShowHostDrawer] = useState(false);
  const [connected, setConnected] = useState(false);
  const requestPending = useRef(false);
  const wsRef = useRef<WebSocket | null>(null);

  const phase = roomState?.phase;
  const roundId = roomState?.roundId;
  const leaderChanged = roomState?.lastReveal?.leaderChanged;
  useEffect(() => {
    if (phase === 'SECRET_REVEAL') soundFx.playStart();
    if (phase === 'VOTING' || phase === 'TIE_BREAKER') soundFx.playDramaticCue();
    if (phase === 'REVEAL') {
      soundFx.playReveal();
      if (leaderChanged) soundFx.playLead();
    }
    if (phase === 'FINAL_WINNER') soundFx.playVictory();
  }, [phase, roundId, leaderChanged]);
  const timeLeft = roomState?.timerRemaining;
  useEffect(() => {
    if (phase === 'DISCUSSION' && timeLeft && timeLeft <= 5) soundFx.playTick();
  }, [phase, timeLeft]);

  const isHost = Boolean(session?.hostToken);

  // Persist session in sessionStorage for seamless refresh reconnection
  useEffect(() => {
    if (session) {
      try {
        sessionStorage.setItem(ROOM_SESSION_KEY, JSON.stringify(session));
      } catch {
        // ignore
      }
    }
  }, [session]);

  // Connect WebSocket + Auto-reconnect + Sync Secret View
  useEffect(() => {
    if (!session) return;

    let closedByCleanup = false;
    let reconnectTimer: number | null = null;

    const connect = () => {
      if (closedByCleanup) return;
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${proto}//${window.location.host}/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            type: 'subscribe',
            roomCode: session.roomCode,
            playerToken: session.playerToken,
            role: 'player',
          })
        );
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data) as {
            type: string;
            state?: PublicRoomState;
            secret?: PlayerSecretView;
            error?: string;
          };
          if (closedByCleanup) return;
          if (msg.type === 'room:state' && msg.state) {
            setConnected(true);
            setRoomState(msg.state);
            setSecretView(msg.secret ?? null);
          } else if (msg.type === 'room:closed' || msg.type === 'room:error') {
            setErrorMsg(msg.error || 'الغرفة سكّرت أو انتهت صلاحيتها.');
            setConnected(false);
            setRoomState(null);
            setSecretView(null);
          }
        } catch {
          // ignore
        }
      };

      ws.onclose = ({ code }) => {
        const permanentClose = code === 1008;
        if (!closedByCleanup) {
          setConnected(false);
          setSecretView(null);
          if (permanentClose) return;
          reconnectTimer = window.setTimeout(connect, 1800);
        }
      };
    };

    connect();

    return () => {
      closedByCleanup = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      wsRef.current?.close();
    };
  }, [session]);

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4) {
      setErrorMsg('أدخل رمز الغرفة الصحيح.');
      return;
    }
    try {
      const res = await fetch(`/api/rooms/${code}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: joinName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'تعذر الانضمام للغرفة');
      setSession({
        roomCode: code,
        playerId: data.playerId,
        playerToken: data.playerToken,
      });
      setRoomState(data.state);
      if (!initialJoinCode) window.history.replaceState(null, '', `/?join=${code}`);
      soundFx.playTap();
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  const apiCall = async (path: string, method = 'POST', body?: unknown, usePlayerToken = false) => {
    if (!session || requestPending.current) return false;
    requestPending.current = true;
    setErrorMsg(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session.hostToken && !usePlayerToken) headers['x-host-token'] = session.hostToken;
      if (usePlayerToken) headers['x-player-token'] = session.playerToken;
      const res = await fetch(`/api/rooms/${session.roomCode}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'حدث خطأ في تنفيذ العملية');
      return true;
    } catch (err) {
      setErrorMsg((err as Error).message);
      return false;
    } finally {
      requestPending.current = false;
    }
  };

  const copyText = (key: string, value: string) => {
    navigator.clipboard?.writeText(value).catch(() => {});
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 1800);
  };

  const handleDeleteSessionAndExit = async () => {
    if (session?.hostToken) {
      await apiCall('', 'DELETE');
    }
    try {
      sessionStorage.removeItem(ROOM_SESSION_KEY);
    } catch {
      // ignore
    }
    onExitHome();
  };

  // Join Room Screen if no session yet
  if (!session) {
    return (
      <div className="min-h-svh bg-transparent text-ink flex flex-col">
        <header className="border-b border-ink/25 bg-paper/90 px-4 sm:px-8 py-4 flex items-center justify-between">
          <GameBrandLockup compact />
          <button
            type="button"
            onClick={onExitHome}
            className="min-h-[40px] px-3.5 rounded-xl bg-lilac hover:bg-lilac text-ink text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>الرئيسية</span>
          </button>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <form
            onSubmit={handleJoinSubmit}
            className="max-w-md w-full bg-paper border border-ink/25 rounded-3xl p-6 sm:p-8 party-panel space-y-5"
          >
            <div className="text-center space-y-1">
              <Users className="w-10 h-10 text-berry mx-auto mb-2" />
              <h2 className="font-display font-black text-2xl text-ink">
                انضمام إلى غرفة اللعب
              </h2>
              <p className="text-sm text-caption">
                أدخل رمز الغرفة الذي يظهر عند المضيف واسمك المستعار.
              </p>
            </div>

            {errorMsg && (
              <div role="alert" className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-400/40 text-rose-800 text-sm flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <label className="block space-y-1.5">
              <span className="text-sm font-semibold text-ink">رمز الغرفة (6 أحرف)</span>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="مثال: K7M4P9"
                maxLength={8}
                required
                dir="ltr"
                className="w-full min-h-[50px] px-4 rounded-xl bg-paper border border-ink/25 text-center font-mono-code font-bold text-xl tracking-widest text-berry focus:outline-none focus:border-teal-400"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-semibold text-ink">اسم العرض المستعار</span>
              <input
                type="text"
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                placeholder="اكتب اسمك المستعار..."
                maxLength={22}
                required
                className="w-full min-h-[50px] px-4 rounded-xl bg-paper border border-ink/25 text-ink focus:outline-none focus:border-teal-400"
              />
            </label>

            <button
              type="submit"
              className="w-full min-h-[54px] rounded-2xl bg-mintplay hover:bg-mintplay text-ink font-display font-extrabold text-lg cursor-pointer"
            >
              دخول الغرفة
            </button>
          </form>
        </main>
      </div>
    );
  }

  if (!roomState || !roomState.players.some((p) => p.id === session.playerId)) {
    return (
      <div className="min-h-svh bg-transparent text-ink flex flex-col items-center justify-center p-6 text-center space-y-4">
        <p className="text-lg font-bold text-ink">
          {errorMsg || 'جاري الاتصال بغرفة اللعب الآمنة...'}
        </p>
        <button
          type="button"
          onClick={() => {
            try {
              sessionStorage.removeItem(ROOM_SESSION_KEY);
            } catch {
              // ignore
            }
            setSession(null);
            onExitHome();
          }}
          className="min-h-[44px] px-5 rounded-xl bg-lilac text-sm font-semibold cursor-pointer"
        >
          العودة للرئيسية
        </button>
      </div>
    );
  }

  const me = roomState.players.find((p) => p.id === session.playerId)!;
  const joinUrl = `${window.location.origin}/?join=${roomState.roomCode}`;
  const projectorUrl = `${window.location.origin}/?projector=${roomState.roomCode}`;
  const starterPlayer = roomState.players.find((p) => p.id === roomState.starterPlayerId) || null;

  return (
    <div className="min-h-svh bg-transparent text-ink flex flex-col">
      {/* Top Bar */}
      <header className="border-b border-ink/25 bg-paper/90 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <GameBrandLockup compact />
        <StageSound />

        <div className="flex items-center gap-3 text-xs sm:text-sm tabular-nums">
          <span className="font-mono-code font-bold text-berry">{roomState.roomCode}</span>
          <span className="text-ink0">·</span>
          <span className="text-caption">{me.name}</span>
          {roomState.currentRound > 0 && (
            <>
              <span className="text-ink0">·</span>
              <span className="text-berry">
                الجولة {roomState.currentRound}/{roomState.config.totalRounds}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isHost && (
            <>
              <button
                type="button"
                onClick={() => onOpenProjector(roomState.roomCode)}
                className="min-h-[40px] px-3 rounded-xl bg-mintplay/40 border border-teal-400/40 text-berry text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <MonitorPlay className="w-4 h-4" />
                <span className="hidden sm:inline">شاشة البروجكتر</span>
              </button>
              <button
                type="button"
                onClick={() => setShowHostDrawer((v) => !v)}
                className="min-h-[40px] px-3 rounded-xl bg-amber-400/15 border border-amber-400/40 text-berry text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Sliders className="w-4 h-4" />
                <span>تحكم المضيف</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onExitHome}
            className="min-h-[40px] px-3 rounded-xl bg-lilac hover:bg-lilac text-caption text-xs font-semibold cursor-pointer whitespace-nowrap"
          >
            خروج
          </button>
        </div>
      </header>

      {/* Host Side Controls Drawer (Strict separation from Audience Screen) */}
      {isHost && showHostDrawer && (
        <section className="bg-lilac border-b border-amber-400/30 px-4 sm:px-8 py-4">
          <div className="max-w-5xl mx-auto space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display font-bold text-base text-berry">
                لوحة تحكم المشرف وسجل التدقيق
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => apiCall('/lock', 'POST', { locked: !roomState.locked })}
                  className="min-h-[38px] px-3 rounded-lg bg-lilac hover:bg-lilac border border-ink/25 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  {roomState.locked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  <span>{roomState.locked ? 'فتح الانضمام' : 'قفل الغرفة'}</span>
                </button>
                {['SECRET_REVEAL', 'PLAYER_QUESTIONS', 'DISCUSSION'].includes(roomState.phase) && (
                  <button
                    type="button"
                    onClick={() => apiCall('/skip-word')}
                    className="min-h-[38px] px-3 rounded-lg bg-amber-500/15 border border-amber-400/40 text-berry text-xs font-semibold cursor-pointer"
                  >
                    تخطي الكلمة وإعادة التوزيع
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleDeleteSessionAndExit}
                  className="min-h-[38px] px-3 rounded-lg bg-rose-500/15 border border-rose-400/40 text-rose-800 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف الغرفة</span>
                </button>
              </div>
            </div>

            {/* Score Adjustment + Audit */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <p className="text-caption font-semibold">إدارة اللاعبين والنقاط:</p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {roomState.players.map((p) => (
                    <div key={p.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-paper">
                      <span className="font-semibold text-ink truncate">
                        {p.name} ({p.score} ن)
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => apiCall('/adjust-score', 'POST', { playerId: p.id, delta: 1, reason: 'تصحيح مضيف' })}
                          className="px-2 py-1 rounded bg-teal-500/20 text-berry font-bold cursor-pointer"
                        >
                          +1
                        </button>
                        <button
                          type="button"
                          onClick={() => apiCall('/adjust-score', 'POST', { playerId: p.id, delta: -1, reason: 'تصحيح مضيف' })}
                          className="px-2 py-1 rounded bg-rose-500/20 text-rose-800 font-bold cursor-pointer"
                        >
                          -1
                        </button>
                        {!p.isHost && roomState.phase === 'LOBBY' && (
                          <button
                            type="button"
                            onClick={() => apiCall('/kick', 'POST', { playerId: p.id })}
                            aria-label={`استبعاد ${p.name}`}
                            className="p-1 rounded hover:bg-rose-500/25 text-rose-800 cursor-pointer"
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-caption font-semibold">سجل التعديلات والأحداث:</p>
                <div className="space-y-1 max-h-40 overflow-y-auto bg-paper p-2.5 rounded-lg border border-ink/25">
                  {roomState.auditLog.map((log) => (
                    <div key={log.id} className="text-caption leading-snug">
                      <strong className="text-berry">{log.action}:</strong> {log.detail}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <MatchProgress phase={roomState.phase} round={roomState.currentRound} total={roomState.config.totalRounds}/>
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 sm:py-8 space-y-5">
        {errorMsg && (
          <div role="alert" className="p-4 rounded-xl bg-rose-500/15 border border-rose-400/40 text-rose-800 text-sm flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}



        {/* LOBBY */}
        {roomState.phase === 'LOBBY' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 bg-paper border border-ink/25 rounded-3xl p-6 space-y-5 text-center">
              <div>
                <p className="text-xs text-caption">رمز الانضمام للغرفة</p>
                <div
                  dir="ltr"
                  className="font-mono-code font-black text-4xl sm:text-5xl tracking-[0.2em] text-berry mt-1"
                >
                  {roomState.roomCode}
                </div>
              </div>

              {/* Real QR Code generated by server */}
              <div className="w-44 h-44 mx-auto bg-white p-2.5 rounded-2xl">
                <img
                  src={`/api/qr?url=${encodeURIComponent(joinUrl)}`}
                  alt={`رمز QR للانضمام لغرفة ${roomState.roomCode}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full"
                />
              </div>

              <div className="grid grid-cols-1 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => copyText('join', joinUrl)}
                  className="min-h-[42px] px-3 rounded-xl bg-lilac hover:bg-lilac border border-ink/25 text-ink font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  {copiedKey === 'join' ? <Check className="w-4 h-4 text-berry" /> : <Copy className="w-4 h-4 text-berry" />}
                  <span>{copiedKey === 'join' ? 'تم نسخ رابط اللاعبين' : 'نسخ رابط انضمام اللاعبين'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => copyText('proj', projectorUrl)}
                  className="min-h-[42px] px-3 rounded-xl bg-lilac hover:bg-lilac border border-ink/25 text-ink font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  {copiedKey === 'proj' ? <Check className="w-4 h-4 text-berry" /> : <MonitorPlay className="w-4 h-4 text-berry" />}
                  <span>{copiedKey === 'proj' ? 'تم نسخ رابط البروجكتر' : 'نسخ رابط شاشة البروجكتر (16:9)'}</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-7 bg-paper border border-ink/25 rounded-3xl p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-ink/25 pb-3">
                <h2 className="font-display font-extrabold text-xl text-ink tabular-nums">
                  اللاعبون المتصلون ({roomState.players.length}/12)
                </h2>
                <span className="text-xs text-berry">
                  {roomState.config.gameMode === 'classic'
                    ? 'الكلاسيكي'
                    : roomState.config.gameMode === 'confusing_pair'
                    ? 'الملخبط'
                    : 'اثنين مش معنا (8+)'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {roomState.players.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-2xl bg-lilac border border-ink/25 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <PlayerAvatar index={p.avatarIndex} size="sm" highlighted={p.isHost} />
                      <div className="min-w-0">
                        <div className="font-bold text-ink truncate">{p.name}</div>
                        <div className="text-xs text-caption">
                          {p.isHost ? 'المضيف' : p.connected ? 'متصل' : 'يعاود الاتصال...'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {isHost ? (
                <button
                  type="button"
                  onClick={() => apiCall('/start')}
                  className="w-full min-h-[56px] rounded-2xl bg-lemon hover:bg-lemon text-ink font-display font-extrabold text-lg inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-5 h-5" />
                  <span>يلا نبلّش! ({roomState.players.length} لاعبين)</span>
                </button>
              ) : (
                <div className="p-4 rounded-2xl bg-lilac text-center text-sm text-berry">
                  أنت داخل الغرفة بأمان! بانتظار المضيف لبدء الجولة الأولى...
                </div>
              )}
            </div>
          </div>
        )}

        {!connected && <p role="status" className="text-center">انقطع الاتصال… بنحاول نرجعك.</p>}
        {/* SECRET REVEAL */}
        {roomState.phase === 'SECRET_REVEAL' && (
          <div className="space-y-6">
            {secretView?.roundId === roomState.roundId && (!me.hasRevealed || reviewRoundId === roomState.roundId) ? (
              <SecretCardReveal
                key={roomState.roundId}
                playerName={me.name}
                avatarIndex={me.avatarIndex}
                categoryNameAr={secretView.categoryNameAr}
                secretWord={secretView.secretWord}
                showOutlierCard={secretView.showOutlierHint}
                isPassAndPlay={false}
                playerStepText={`الجولة ${roomState.currentRound} من ${roomState.config.totalRounds}`}
                onAcknowledgeAndHide={() => {
                  setReviewRoundId(null);
                  if (!me.hasRevealed) apiCall('/revealed', 'POST', { roundId: roomState.roundId }, true);
                }}
              />
            ) : (
              <div className="max-w-lg mx-auto bg-paper border border-ink/25 rounded-3xl p-8 text-center space-y-5">
                <h2 className="font-display font-extrabold text-2xl text-berry">
                  {me.hasRevealed ? 'بطاقتك مخبّاية!' : 'استنّى تحميل بطاقتك…'}
                </h2>
                <p className="text-sm text-caption tabular-nums">
                  اطّلع على دوره: <strong className="text-berry">{roomState.revealedCount}</strong> من {roomState.players.length} لاعبين
                </p>
                {secretView && (
                  <button
                    type="button"
                    onClick={() => setReviewRoundId(roomState.roundId)}
                    className="text-xs text-berry underline cursor-pointer"
                  >
                    مراجعة بطاقتي السرية مجددًا
                  </button>
                )}
              </div>
            )}

          </div>
        )}

        {roomState.phase === 'PLAYER_QUESTIONS' && roomState.questionTurn && (
          <QuestionStage turn={roomState.questionTurn} players={roomState.players}
            timer={roomState.timerRemaining} timed={roomState.config.questionSeconds > 0}
            card={roomState.activeDiscussionCard}
            onNext={isHost && connected ? () => apiCall('/questions/advance', 'POST', { turnId: roomState.questionTurn!.id }) : undefined}
            onPostpone={() => apiCall('/questions/advance', 'POST', { turnId: roomState.questionTurn!.id, postpone: true })}
            onCard={() => apiCall('/discussion/card')} />
        )}

        {/* DISCUSSION */}
        {roomState.phase === 'DISCUSSION' && (
          <DiscussionStage
            currentRound={roomState.currentRound}
            totalRounds={roomState.config.totalRounds}
            categoryNameAr={roomState.currentCategoryNameAr || ''}
            starterPlayer={starterPlayer}
            timerRemaining={roomState.timerRemaining}
            totalSeconds={roomState.config.discussionSeconds}
            timerPaused={roomState.timerPaused}
            activeCard={roomState.activeDiscussionCard}
            canControl={isHost}
            onTogglePause={() => apiCall('/discussion/pause', 'POST', { paused: !roomState.timerPaused })}
            onDrawCard={() => apiCall('/discussion/card')}
            onStartVoting={() => apiCall('/voting/begin')}
            onSkipWord={() => apiCall('/skip-word')}
          />
        )}

        {/* VOTING & TIE-BREAKER */}
        {(roomState.phase === 'VOTING' || roomState.phase === 'TIE_BREAKER') && (
          <div className="space-y-5">
            <VotingStage
              key={`${roomState.roundId}:${roomState.phase}`}
              players={roomState.players}
              currentVoter={me}
              gameMode={roomState.config.gameMode}
              isTieBreaker={roomState.phase === 'TIE_BREAKER'}
              tieCandidateIds={roomState.tieCandidateIds}
              allowVoteChange={roomState.config.allowVoteChangeBeforeClose}
              alreadyVotedTargetIds={secretView?.myVoteTargetIds || []}
              isPassAndPlay={false}
              voterProgressText={`صوّت حتى الآن: ${roomState.votedCount} من ${roomState.players.length}`}
              onSubmitVote={(targetIds) => apiCall('/voting/cast', 'POST', { targetIds, roundId: roomState.roundId, ballot: roomState.phase }, true)}
            />

            {isHost && (
              <div className="max-w-3xl mx-auto">
                <button
                  type="button"
                  onClick={() => apiCall('/voting/close')}
                  disabled={roomState.players.some((p) => p.connected && !p.hasVoted)}
                  className="w-full min-h-[54px] rounded-2xl bg-mintplay hover:bg-mintplay text-ink font-display font-extrabold text-lg cursor-pointer"
                >
                  إغلاق التصويت وكشف النتيجة ({roomState.votedCount}/{roomState.players.length})
                </button>
              </div>
            )}
          </div>
        )}

        {/* OUTLIER GUESS */}
        {roomState.phase === 'OUTLIER_GUESS' && (
          <OutlierGuessStage
            outlierNames={['المختلف المكشوف']}
            categoryNameAr={roomState.currentCategoryNameAr || ''}
            canSubmit={Boolean(secretView?.isOutlier || isHost)}
            onSubmitGuess={(guess) =>
              apiCall('/guess', 'POST', { guess }, !isHost)
            }
          />
        )}

        {/* REVEAL / RESULTS / FINAL WINNER */}
        {(roomState.phase === 'REVEAL' ||
          roomState.phase === 'RESULTS' ||
          roomState.phase === 'FINAL_WINNER') &&
          roomState.lastReveal && (
            <RevealAndResults
              phase={roomState.phase}
              summary={roomState.lastReveal}
              players={roomState.players}
              canControl={isHost}
              onNextStep={() => apiCall('/advance', 'POST', { roundId: roomState.roundId, phase: roomState.phase })}
              onPlayAgainSameSettings={isHost ? () => apiCall('/start') : undefined}
              onExitHome={onExitHome}
              onDeleteSessionData={isHost ? handleDeleteSessionAndExit : undefined}
            />
          )}
      </main>
    </div>
  );
};
