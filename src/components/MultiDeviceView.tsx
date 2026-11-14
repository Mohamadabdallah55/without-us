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
import { soundFx } from '../utils/sound';
import { DiscussionStage } from './DiscussionStage';
import { OutlierGuessStage, RevealAndResults, SuspicionMomentBanner } from './RevealAndResults';
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
      const saved = sessionStorage.getItem('hm_multi_session');
      if (saved) return JSON.parse(saved) as MultiDeviceSession;
    } catch {
      // ignore
    }
    return null;
  });

  const [joinCode, setJoinCode] = useState(initialJoinCode);
  const [joinName, setJoinName] = useState('');
  const [roomState, setRoomState] = useState<PublicRoomState | null>(null);
  const [secretView, setSecretView] = useState<PlayerSecretView | null>(null);
  const [acknowledgedRound, setAcknowledgedRound] = useState<number>(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showHostDrawer, setShowHostDrawer] = useState(false);
  const [suspicionLeft, setSuspicionLeft] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);

  const isHost = Boolean(session?.hostToken);

  // Persist session in sessionStorage for seamless refresh reconnection
  useEffect(() => {
    if (session) {
      try {
        sessionStorage.setItem('hm_multi_session', JSON.stringify(session));
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

    const fetchSecretIfNeeded = async (state: PublicRoomState) => {
      if (state.phase === 'LOBBY') {
        setSecretView(null);
        return;
      }
      try {
        const res = await fetch(`/api/rooms/${state.roomCode}/me`, {
          headers: { 'x-player-token': session.playerToken },
        });
        if (res.ok) {
          const sec = (await res.json()) as PlayerSecretView;
          setSecretView(sec);
        }
      } catch {
        // ignore
      }
    };

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
          if (msg.type === 'room:state' && msg.state) {
            setRoomState(msg.state);
            setErrorMsg(null);
          } else if (msg.type === 'player:secret' && msg.secret) {
            setSecretView(msg.secret);
          } else if (msg.type === 'room:closed') {
            setErrorMsg('انتهت صلاحية الغرفة أو تم إغلاقها من المضيف.');
            setRoomState(null);
          } else if (msg.type === 'room:error' && msg.error) {
            setErrorMsg(msg.error);
          }
        } catch {
          // ignore
        }
      };

      ws.onclose = () => {
        if (!closedByCleanup) {
          reconnectTimer = window.setTimeout(connect, 1800);
        }
      };
    };

    // Initial REST fetch + WS connect
    fetch(`/api/rooms/${session.roomCode}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('الغرفة غير متاحة'))))
      .then((st: PublicRoomState) => {
        setRoomState(st);
        fetchSecretIfNeeded(st);
      })
      .catch((err) => setErrorMsg((err as Error).message));

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
      soundFx.playTap();
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  const apiCall = async (path: string, method = 'POST', body?: unknown, usePlayerToken = false) => {
    if (!session) return;
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
      if (data.roomCode) setRoomState(data);
    } catch (err) {
      setErrorMsg((err as Error).message);
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
      sessionStorage.removeItem('hm_multi_session');
    } catch {
      // ignore
    }
    onExitHome();
  };

  // Join Room Screen if no session yet
  if (!session) {
    return (
      <div className="min-h-screen bg-[#070E1A] text-slate-100 flex flex-col">
        <header className="border-b border-white/10 bg-[#0B1526]/90 px-4 sm:px-8 py-4 flex items-center justify-between">
          <GameBrandLockup compact />
          <button
            type="button"
            onClick={onExitHome}
            className="min-h-[40px] px-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>الرئيسية</span>
          </button>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <form
            onSubmit={handleJoinSubmit}
            className="max-w-md w-full bg-[#0B1526] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5"
          >
            <div className="text-center space-y-1">
              <Users className="w-10 h-10 text-teal-300 mx-auto mb-2" />
              <h2 className="font-display font-black text-2xl text-slate-50">
                انضمام إلى غرفة اللعب
              </h2>
              <p className="text-sm text-slate-300">
                أدخل رمز الغرفة الذي يظهر عند المضيف واسمك المستعار.
              </p>
            </div>

            {errorMsg && (
              <div role="alert" className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-400/40 text-rose-200 text-sm flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <label className="block space-y-1.5">
              <span className="text-sm font-semibold text-slate-200">رمز الغرفة (6 أحرف)</span>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="مثال: K7M4P9"
                maxLength={8}
                required
                dir="ltr"
                className="w-full min-h-[50px] px-4 rounded-xl bg-[#070E1A] border border-white/15 text-center font-mono-code font-bold text-xl tracking-widest text-amber-300 focus:outline-none focus:border-teal-400"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-semibold text-slate-200">اسم العرض المستعار</span>
              <input
                type="text"
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                placeholder="اكتب اسمك المستعار..."
                maxLength={22}
                required
                className="w-full min-h-[50px] px-4 rounded-xl bg-[#070E1A] border border-white/15 text-slate-100 focus:outline-none focus:border-teal-400"
              />
            </label>

            <button
              type="submit"
              className="w-full min-h-[54px] rounded-2xl bg-teal-500 hover:bg-teal-400 text-[#051019] font-display font-extrabold text-lg cursor-pointer"
            >
              دخول الغرفة
            </button>
          </form>
        </main>
      </div>
    );
  }

  if (!roomState) {
    return (
      <div className="min-h-screen bg-[#070E1A] text-slate-100 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <p className="text-lg font-bold text-slate-200">
          {errorMsg || 'جاري الاتصال بغرفة اللعب الآمنة...'}
        </p>
        <button
          type="button"
          onClick={() => {
            try {
              sessionStorage.removeItem('hm_multi_session');
            } catch {
              // ignore
            }
            setSession(null);
            onExitHome();
          }}
          className="min-h-[44px] px-5 rounded-xl bg-white/10 text-sm font-semibold cursor-pointer"
        >
          العودة للرئيسية
        </button>
      </div>
    );
  }

  const me = roomState.players.find((p) => p.id === session.playerId) || roomState.players[0];
  const joinUrl = `${window.location.origin}/?join=${roomState.roomCode}`;
  const projectorUrl = `${window.location.origin}/?projector=${roomState.roomCode}`;
  const starterPlayer = roomState.players.find((p) => p.id === roomState.starterPlayerId) || null;

  const triggerVotingWithSuspicion = () => {
    setSuspicionLeft(2);
    const t = window.setInterval(() => {
      setSuspicionLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(t);
          apiCall('/voting/begin');
          return 0;
        }
        return prev - 1;
      });
    }, 900);
  };

  return (
    <div className="min-h-screen bg-[#070E1A] text-slate-100 flex flex-col">
      {/* Top Bar */}
      <header className="border-b border-white/10 bg-[#0B1526]/90 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <GameBrandLockup compact />

        <div className="flex items-center gap-3 text-xs sm:text-sm tabular-nums">
          <span className="font-mono-code font-bold text-amber-300">{roomState.roomCode}</span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-300">{me.name}</span>
          {roomState.currentRound > 0 && (
            <>
              <span className="text-slate-500">·</span>
              <span className="text-teal-300">
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
                className="min-h-[40px] px-3 rounded-xl bg-teal-500/15 border border-teal-400/40 text-teal-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <MonitorPlay className="w-4 h-4" />
                <span className="hidden sm:inline">شاشة البروجكتر</span>
              </button>
              <button
                type="button"
                onClick={() => setShowHostDrawer((v) => !v)}
                className="min-h-[40px] px-3 rounded-xl bg-amber-400/15 border border-amber-400/40 text-amber-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Sliders className="w-4 h-4" />
                <span>تحكم المضيف</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleDeleteSessionAndExit}
            className="min-h-[40px] px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold cursor-pointer whitespace-nowrap"
          >
            خروج
          </button>
        </div>
      </header>

      {/* Host Side Controls Drawer (Strict separation from Audience Screen) */}
      {isHost && showHostDrawer && (
        <section className="bg-[#0E1B31] border-b border-amber-400/30 px-4 sm:px-8 py-4">
          <div className="max-w-5xl mx-auto space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display font-bold text-base text-amber-300">
                لوحة تحكم المشرف وسجل التدقيق
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => apiCall('/lock', 'POST', { locked: !roomState.locked })}
                  className="min-h-[38px] px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  {roomState.locked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  <span>{roomState.locked ? 'فتح الانضمام' : 'قفل الغرفة'}</span>
                </button>
                {roomState.phase !== 'LOBBY' && roomState.phase !== 'FINAL_WINNER' && (
                  <button
                    type="button"
                    onClick={() => apiCall('/skip-word')}
                    className="min-h-[38px] px-3 rounded-lg bg-amber-500/15 border border-amber-400/40 text-amber-200 text-xs font-semibold cursor-pointer"
                  >
                    تخطي الكلمة وإعادة التوزيع
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleDeleteSessionAndExit}
                  className="min-h-[38px] px-3 rounded-lg bg-rose-500/15 border border-rose-400/40 text-rose-200 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف الغرفة</span>
                </button>
              </div>
            </div>

            {/* Score Adjustment + Audit */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <p className="text-slate-400 font-semibold">إدارة اللاعبين والنقاط:</p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {roomState.players.map((p) => (
                    <div key={p.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#070E1A]">
                      <span className="font-semibold text-slate-200 truncate">
                        {p.name} ({p.score} ن)
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => apiCall('/adjust-score', 'POST', { playerId: p.id, delta: 1, reason: 'تصحيح مضيف' })}
                          className="px-2 py-1 rounded bg-teal-500/20 text-teal-200 font-bold cursor-pointer"
                        >
                          +1
                        </button>
                        <button
                          type="button"
                          onClick={() => apiCall('/adjust-score', 'POST', { playerId: p.id, delta: -1, reason: 'تصحيح مضيف' })}
                          className="px-2 py-1 rounded bg-rose-500/20 text-rose-200 font-bold cursor-pointer"
                        >
                          -1
                        </button>
                        {!p.isHost && (
                          <button
                            type="button"
                            onClick={() => apiCall('/kick', 'POST', { playerId: p.id })}
                            aria-label={`استبعاد ${p.name}`}
                            className="p-1 rounded hover:bg-rose-500/25 text-rose-300 cursor-pointer"
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
                <p className="text-slate-400 font-semibold">سجل التعديلات والأحداث:</p>
                <div className="space-y-1 max-h-40 overflow-y-auto bg-[#070E1A] p-2.5 rounded-lg border border-white/10">
                  {roomState.auditLog.map((log) => (
                    <div key={log.id} className="text-slate-300 leading-snug">
                      <strong className="text-teal-300">{log.action}:</strong> {log.detail}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 sm:py-8 space-y-5">
        {errorMsg && (
          <div role="alert" className="p-4 rounded-xl bg-rose-500/15 border border-rose-400/40 text-rose-200 text-sm flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {suspicionLeft > 0 && <SuspicionMomentBanner secondsLeft={suspicionLeft} />}

        {/* LOBBY */}
        {roomState.phase === 'LOBBY' && suspicionLeft === 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 bg-[#0B1526] border border-white/10 rounded-3xl p-6 space-y-5 text-center">
              <div>
                <p className="text-xs text-slate-400">رمز الانضمام للغرفة</p>
                <div
                  dir="ltr"
                  className="font-mono-code font-black text-4xl sm:text-5xl tracking-[0.2em] text-amber-300 mt-1"
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
                  className="min-h-[42px] px-3 rounded-xl bg-[#101E36] hover:bg-[#162947] border border-white/10 text-slate-200 font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  {copiedKey === 'join' ? <Check className="w-4 h-4 text-teal-300" /> : <Copy className="w-4 h-4 text-teal-300" />}
                  <span>{copiedKey === 'join' ? 'تم نسخ رابط اللاعبين' : 'نسخ رابط انضمام اللاعبين'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => copyText('proj', projectorUrl)}
                  className="min-h-[42px] px-3 rounded-xl bg-[#101E36] hover:bg-[#162947] border border-white/10 text-slate-200 font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  {copiedKey === 'proj' ? <Check className="w-4 h-4 text-amber-300" /> : <MonitorPlay className="w-4 h-4 text-amber-300" />}
                  <span>{copiedKey === 'proj' ? 'تم نسخ رابط البروجكتر' : 'نسخ رابط شاشة البروجكتر (16:9)'}</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-7 bg-[#0B1526] border border-white/10 rounded-3xl p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h2 className="font-display font-extrabold text-xl text-slate-50 tabular-nums">
                  اللاعبون المتصلون ({roomState.players.length}/12)
                </h2>
                <span className="text-xs text-teal-300">
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
                    className="p-3 rounded-2xl bg-[#101E36] border border-white/10 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <PlayerAvatar index={p.avatarIndex} size="sm" highlighted={p.isHost} />
                      <div className="min-w-0">
                        <div className="font-bold text-slate-100 truncate">{p.name}</div>
                        <div className="text-xs text-slate-400">
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
                  className="w-full min-h-[56px] rounded-2xl bg-amber-400 hover:bg-amber-300 text-[#051019] font-display font-extrabold text-lg inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-5 h-5" />
                  <span>بدء المباراة الآن ({roomState.players.length} لاعبين)</span>
                </button>
              ) : (
                <div className="p-4 rounded-2xl bg-[#101E36] text-center text-sm text-teal-200">
                  أنت داخل الغرفة بأمان! بانتظار المضيف لبدء الجولة الأولى...
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECRET REVEAL */}
        {roomState.phase === 'SECRET_REVEAL' && suspicionLeft === 0 && (
          <div className="space-y-6">
            {secretView && acknowledgedRound < roomState.currentRound ? (
              <SecretCardReveal
                playerName={me.name}
                avatarIndex={me.avatarIndex}
                categoryNameAr={secretView.categoryNameAr}
                secretWord={secretView.secretWord}
                showOutlierCard={secretView.showOutlierHint}
                isPassAndPlay={false}
                playerStepText={`الجولة ${roomState.currentRound} من ${roomState.config.totalRounds}`}
                onAcknowledgeAndHide={() => {
                  setAcknowledgedRound(roomState.currentRound);
                  apiCall('/revealed', 'POST', {}, true);
                }}
              />
            ) : (
              <div className="max-w-lg mx-auto bg-[#0B1526] border border-white/10 rounded-3xl p-8 text-center space-y-5">
                <h2 className="font-display font-extrabold text-2xl text-teal-300">
                  تم إخفاء بطاقتك السرية
                </h2>
                <p className="text-sm text-slate-300 tabular-nums">
                  اطّلع على دوره: <strong className="text-amber-300">{roomState.revealedCount}</strong> من {roomState.players.length} لاعبين
                </p>
                {secretView && (
                  <button
                    type="button"
                    onClick={() => setAcknowledgedRound(0)}
                    className="text-xs text-teal-300 underline cursor-pointer"
                  >
                    مراجعة بطاقتي السرية مجددًا
                  </button>
                )}
              </div>
            )}

            {isHost && (
              <div className="max-w-lg mx-auto">
                <button
                  type="button"
                  onClick={() => apiCall('/discussion/begin')}
                  className="w-full min-h-[54px] rounded-2xl bg-teal-500 hover:bg-teal-400 text-[#051019] font-display font-extrabold text-lg cursor-pointer"
                >
                  بدء مرحلة النقاش ({roomState.revealedCount}/{roomState.players.length} جاهز)
                </button>
              </div>
            )}
          </div>
        )}

        {/* DISCUSSION */}
        {roomState.phase === 'DISCUSSION' && suspicionLeft === 0 && (
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
            onStartVoting={triggerVotingWithSuspicion}
            onSkipWord={() => apiCall('/skip-word')}
          />
        )}

        {/* VOTING & TIE-BREAKER */}
        {(roomState.phase === 'VOTING' || roomState.phase === 'TIE_BREAKER') && suspicionLeft === 0 && (
          <div className="space-y-5">
            <VotingStage
              players={roomState.players}
              currentVoter={me}
              gameMode={roomState.config.gameMode}
              isTieBreaker={roomState.phase === 'TIE_BREAKER'}
              tieCandidateIds={roomState.tieCandidateIds}
              allowVoteChange={roomState.config.allowVoteChangeBeforeClose}
              alreadyVotedTargetIds={secretView?.myVoteTargetIds || []}
              isPassAndPlay={false}
              voterProgressText={`صوّت حتى الآن: ${roomState.votedCount} من ${roomState.players.length}`}
              onSubmitVote={(targetIds) => apiCall('/voting/cast', 'POST', { targetIds }, true)}
            />

            {isHost && (
              <div className="max-w-3xl mx-auto">
                <button
                  type="button"
                  onClick={() => apiCall('/voting/close')}
                  className="w-full min-h-[54px] rounded-2xl bg-teal-500 hover:bg-teal-400 text-[#051019] font-display font-extrabold text-lg cursor-pointer"
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
              onNextStep={() => apiCall('/advance')}
              onPlayAgainSameSettings={isHost ? () => apiCall('/start') : undefined}
              onExitHome={onExitHome}
              onDeleteSessionData={isHost ? handleDeleteSessionAndExit : undefined}
            />
          )}
      </main>
    </div>
  );
};
