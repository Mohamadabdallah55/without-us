import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Crown, Flame, MonitorPlay, ShieldCheck, Timer, Vote } from 'lucide-react';
import type { PublicRoomState } from '../types/game';
import { GameBrandLockup, PlayerAvatar } from './SvgAssets';

interface ProjectorViewProps {
  initialRoomCode?: string;
  onExitHome: () => void;
}

export const ProjectorView: React.FC<ProjectorViewProps> = ({
  initialRoomCode = '',
  onExitHome,
}) => {
  const [roomCode, setRoomCode] = useState(initialRoomCode);
  const [activeCode, setActiveCode] = useState(initialRoomCode ? initialRoomCode.toUpperCase() : '');
  const [state, setState] = useState<PublicRoomState | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!activeCode) return;
    let closed = false;
    let reconnectTimer: number | null = null;

    const connect = () => {
      if (closed) return;
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${proto}//${window.location.host}/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'subscribe', roomCode: activeCode, role: 'projector' }));
      };
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data) as {
            type: string;
            state?: PublicRoomState;
            error?: string;
          };
          if (msg.type === 'room:state' && msg.state) {
            setState(msg.state);
            setErrorMsg(null);
          } else if (msg.type === 'room:error' && msg.error) {
            setErrorMsg(msg.error);
          } else if (msg.type === 'room:closed') {
            setErrorMsg('تم إغلاق الغرفة.');
            setState(null);
          }
        } catch {
          // ignore
        }
      };
      ws.onclose = () => {
        if (!closed) reconnectTimer = window.setTimeout(connect, 2000);
      };
    };

    connect();
    return () => {
      closed = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      wsRef.current?.close();
    };
  }, [activeCode]);

  if (!activeCode) {
    return (
      <div className="min-h-screen bg-[#070E1A] text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#0B1526] border border-white/10 rounded-3xl p-8 text-center space-y-5 shadow-2xl">
          <MonitorPlay className="w-12 h-12 text-teal-300 mx-auto" />
          <h2 className="font-display font-black text-2xl text-slate-50">
            شاشة البروجكتر والجمهور (16:9)
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            تعرض هذه الشاشة المؤقت واللاعبين والنتائج دون كشف أي كلمة سرية أو دور مخفي قبل نهاية الجولة.
          </p>
          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="أدخل رمز الغرفة..."
            dir="ltr"
            className="w-full min-h-[52px] px-4 rounded-xl bg-[#070E1A] border border-white/15 text-center font-mono-code font-black text-2xl tracking-widest text-amber-300"
          />
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onExitHome}
              className="min-h-[48px] rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold cursor-pointer"
            >
              رجوع
            </button>
            <button
              type="button"
              onClick={() => {
                if (roomCode.trim().length >= 4) setActiveCode(roomCode.trim().toUpperCase());
              }}
              className="min-h-[48px] rounded-xl bg-teal-500 hover:bg-teal-400 text-[#051019] font-extrabold cursor-pointer"
            >
              عرض الشاشة
            </button>
          </div>
        </div>
      </div>
    );
  }

  const joinUrl = `${window.location.origin}/?join=${activeCode}`;
  const sortedPlayers = state ? [...state.players].sort((a, b) => b.score - a.score) : [];
  const topScore = sortedPlayers[0]?.score ?? 0;

  return (
    <div className="min-h-screen w-full bg-[#070E1A] text-slate-100 flex flex-col justify-between p-6 lg:p-10">
      {/* 16:9 Top Stage Bar */}
      <header className="flex items-center justify-between gap-6 border-b border-white/10 pb-5">
        <GameBrandLockup compact />

        {state && (
          <div className="flex items-center gap-6 text-lg font-bold tabular-nums">
            <span className="text-slate-300">
              الغرفة: <strong dir="ltr" className="font-mono-code text-amber-300">{state.roomCode}</strong>
            </span>
            {state.currentRound > 0 && (
              <span className="text-teal-300">
                الجولة {state.currentRound} من {state.config.totalRounds}
              </span>
            )}
            {state.currentCategoryNameAr && (
              <span className="text-slate-200">الفئة: {state.currentCategoryNameAr}</span>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={onExitHome}
          className="min-h-[40px] px-4 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 inline-flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>إغلاق العرض</span>
        </button>
      </header>

      {/* Main Stage */}
      <main className="flex-1 flex flex-col justify-center py-6 max-w-7xl mx-auto w-full">
        {errorMsg && (
          <div className="p-8 rounded-3xl bg-rose-500/15 border border-rose-400/40 text-center text-2xl font-bold text-rose-200">
            {errorMsg}
          </div>
        )}

        {state && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Center-Left Primary Stage (8 cols) */}
            <div className="lg:col-span-8 bg-[#0B1526] border border-white/10 rounded-3xl p-8 lg:p-12 text-center shadow-2xl space-y-6">
              {state.phase === 'LOBBY' && (
                <div className="space-y-6">
                  <p className="text-xl text-teal-300 font-bold">امسح الرمز أو أدخل الكود من هاتفك للانضمام</p>
                  <div dir="ltr" className="font-mono-code font-black text-7xl tracking-[0.22em] text-amber-300">
                    {state.roomCode}
                  </div>
                  <div className="w-52 h-52 mx-auto bg-white p-3 rounded-2xl">
                    <img
                      src={`/api/qr?url=${encodeURIComponent(joinUrl)}`}
                      alt="QR انضمام"
                      referrerPolicy="no-referrer"
                      className="w-full h-full"
                    />
                  </div>
                </div>
              )}

              {state.phase === 'SECRET_REVEAL' && (
                <div className="space-y-4 py-6">
                  <ShieldCheck className="w-16 h-16 text-teal-300 mx-auto" />
                  <h2 className="font-display font-black text-4xl lg:text-5xl text-slate-50">
                    توزيع البطاقات السرية...
                  </h2>
                  <p className="text-2xl text-amber-300 font-bold tabular-nums">
                    اطّلع على دوره: {state.revealedCount} من {state.players.length} لاعبين
                  </p>
                  <p className="text-base text-slate-400">
                    كل لاعب يرى بطاقته على هاتفه الخاص فقط
                  </p>
                </div>
              )}

              {state.phase === 'DISCUSSION' && (
                <div className="space-y-6">
                  {state.currentRound >= state.config.totalRounds && (
                    <p className="font-display font-black text-2xl text-amber-300">
                      الجولة الأخيرة — جولة الحسم!
                    </p>
                  )}
                  <div className="inline-flex items-center gap-3 text-xl text-teal-300 font-bold">
                    <Timer className="w-7 h-7" />
                    <span>يبدأ النقاش: {state.starterPlayerName}</span>
                  </div>
                  {state.config.discussionSeconds > 0 ? (
                    <div
                      className={`font-display font-black text-8xl lg:text-9xl tabular-nums ${
                        state.timerRemaining <= 10 ? 'text-rose-400' : 'text-teal-300'
                      }`}
                    >
                      {state.timerRemaining}
                    </div>
                  ) : (
                    <div className="font-display font-black text-5xl text-teal-300 py-4">
                      نقاش مفتوح
                    </div>
                  )}
                  {state.activeDiscussionCard && (
                    <div className="p-6 rounded-2xl bg-[#101E36] border border-amber-400/40">
                      <p className="text-sm text-amber-300 font-bold mb-1">بطاقة تنشيط النقاش</p>
                      <p className="font-display font-bold text-3xl text-slate-50">
                        «{state.activeDiscussionCard.prompt_ar}»
                      </p>
                    </div>
                  )}
                </div>
              )}

              {(state.phase === 'VOTING' || state.phase === 'TIE_BREAKER') && (
                <div className="space-y-5 py-6">
                  <Vote className="w-16 h-16 text-amber-300 mx-auto" />
                  <h2 className="font-display font-black text-4xl lg:text-5xl text-slate-50">
                    {state.phase === 'TIE_BREAKER' ? 'جولة تصويت فاصلة!' : 'مين فيكم مش معنا؟ التصويت جارٍ...'}
                  </h2>
                  <p className="text-3xl font-black text-teal-300 tabular-nums">
                    صوّت حتى الآن: {state.votedCount} من {state.players.length}
                  </p>
                  <p className="text-base text-slate-400">
                    الأصوات سرية بالكامل حتى إغلاق المرحلة
                  </p>
                </div>
              )}

              {state.phase === 'OUTLIER_GUESS' && (
                <div className="space-y-4 py-8">
                  <h2 className="font-display font-black text-4xl lg:text-5xl text-amber-300">
                    فرصة التخمين الأخيرة!
                  </h2>
                  <p className="text-2xl text-slate-200">
                    المختلف المكشوف يحاول تخمين الكلمة السرية الآن...
                  </p>
                </div>
              )}

              {(state.phase === 'REVEAL' || state.phase === 'RESULTS') && state.lastReveal && (
                <div className="space-y-5">
                  {state.lastReveal.leaderChanged && state.lastReveal.newLeaderName && (
                    <div className="inline-flex items-center gap-2 text-amber-300 font-display font-black text-2xl">
                      <Flame className="w-7 h-7" />
                      <span>الصدارة تغيّرت! المتصدر: {state.lastReveal.newLeaderName}</span>
                    </div>
                  )}
                  <p className="text-xl text-teal-300 font-bold">كشف الحقيقة</p>
                  <h2 className="font-display font-black text-4xl lg:text-6xl text-amber-300">
                    {state.lastReveal.outlierNames.join(' و ')}
                  </h2>
                  <div className="p-6 rounded-2xl bg-[#101E36] border border-teal-400/40 space-y-2">
                    <p className="text-base text-teal-300">
                      {state.lastReveal.gameMode === 'confusing_pair' ? 'الكلمتان المتشابهتان' : 'الكلمة السرية'}
                    </p>
                    <p className="font-display font-black text-4xl text-slate-50">
                      {state.lastReveal.wordA}
                      {state.lastReveal.wordB ? `  /  ${state.lastReveal.wordB}` : ''}
                    </p>
                    {state.lastReveal.reasonAr && (
                      <p className="text-lg text-slate-300 pt-2">{state.lastReveal.reasonAr}</p>
                    )}
                  </div>
                </div>
              )}

              {state.phase === 'FINAL_WINNER' && (
                <div className="space-y-5 py-6">
                  <Crown className="w-20 h-20 text-amber-300 mx-auto" />
                  <h2 className="font-display font-black text-5xl lg:text-6xl text-amber-300">
                    بطل الجلسة!
                  </h2>
                  <p className="font-display font-black text-4xl text-slate-50">
                    {sortedPlayers.filter((p) => p.score === topScore).map((w) => w.name).join(' و ')}
                  </p>
                  <p className="text-2xl text-teal-300 font-bold tabular-nums">{topScore} نقطة</p>
                </div>
              )}
            </div>

            {/* Right Sidebar: Players & Live Leaderboard (4 cols) */}
            <aside className="lg:col-span-4 bg-[#0B1526] border border-white/10 rounded-3xl p-6 space-y-3">
              <h3 className="font-display font-extrabold text-xl text-slate-50 border-b border-white/10 pb-3 tabular-nums">
                المشاركون والصدارة ({state.players.length})
              </h3>
              <div className="space-y-2.5">
                {sortedPlayers.map((p, idx) => (
                  <div
                    key={p.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                      idx === 0 && p.score > 0
                        ? 'bg-amber-400/15 border-amber-400/50'
                        : 'bg-[#101E36] border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <PlayerAvatar index={p.avatarIndex} size="sm" highlighted={idx === 0 && p.score > 0} />
                      <div className="min-w-0">
                        <div className="font-bold text-lg text-slate-100 truncate">{p.name}</div>
                        <div className="text-xs text-slate-400">
                          {state.phase === 'SECRET_REVEAL'
                            ? p.hasRevealed
                              ? 'اطّلع على دوره'
                              : 'ينتظر الكشف'
                            : state.phase === 'VOTING' || state.phase === 'TIE_BREAKER'
                            ? p.hasVoted
                              ? 'صوّت'
                              : 'يفكّر...'
                            : p.connected
                            ? 'متصل'
                            : 'غير متصل'}
                        </div>
                      </div>
                    </div>
                    <span className="font-display font-black text-2xl text-teal-300 tabular-nums">
                      {p.score}
                    </span>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        )}
      </main>

      <footer className="text-center text-sm text-slate-400 border-t border-white/10 pt-4">
        مكتبة الألعاب الدائمة — مسجد ابن تيمية · شاشة عرض الجمهور محمية ضد تسريب الكلمات السرية
      </footer>
    </div>
  );
};
