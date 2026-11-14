import React, { useCallback, useEffect, useState } from 'react';
import { AdminDashboard } from './components/AdminDashboard';
import { MultiDeviceView } from './components/MultiDeviceView';
import { PassAndPlayView, readLocalMatch } from './components/PassAndPlayView';
import { ProjectorView } from './components/ProjectorView';
import { SetupWizard } from './components/SetupWizard';
import { TitleScreen } from './components/TitleScreen';
import { DEFAULT_GAME_CONFIG } from './game/rules';
import { buildInitialBankFromPdfSeed } from './game/wordBankService';
import type { GameConfig, WordBankData } from './types/game';
import { LOCAL_MATCH_KEY, ROOM_SESSION_KEY, readSession, writeSession } from './game/session';
import { soundFx, type SoundMode } from './utils/sound';

type AppScreen = 'title' | 'setup' | 'pass_and_play' | 'multi_device' | 'projector' | 'admin';

const OFFLINE_BANK_CACHE_KEY = 'hm_offline_playable_bank_v1';

export default function App() {
  const [bank, setBank] = useState<WordBankData>(() => {
    try {
      const cached = localStorage.getItem(OFFLINE_BANK_CACHE_KEY);
      if (cached) return JSON.parse(cached) as WordBankData;
    } catch {
      // ignore
    }
    return buildInitialBankFromPdfSeed().bank;
  });

  const [savedMatch] = useState(readLocalMatch);
  const [route] = useState(() => new URLSearchParams(window.location.search));
  const [screen, setScreen] = useState<AppScreen>(() => {
    if (route.get('projector')) return 'projector';
    if (route.get('join')) return 'multi_device';
    if (route.get('autostart') === '1') return 'setup';
    if (savedMatch) return 'pass_and_play';
    if (readSession(ROOM_SESSION_KEY)) return 'multi_device';
    return 'title';
  });
  const [config, setConfig] = useState<GameConfig>(savedMatch?.config ?? DEFAULT_GAME_CONFIG);
  const [singleDevicePlayers, setSingleDevicePlayers] = useState<string[]>(savedMatch?.playerNames ?? [
    'أحمد',
    'سالم',
    'عمر',
    'خالد',
    'يوسف',
  ]);
  const [multiSession, setMultiSession] = useState<{
    roomCode: string;
    playerId: string;
    playerToken: string;
    hostToken?: string;
  } | null>(null);
  const [joinCodeParam, setJoinCodeParam] = useState(route.get('join')?.toUpperCase() ?? '');
  const [projectorCodeParam, setProjectorCodeParam] = useState(route.get('projector')?.toUpperCase() ?? '');

  // Quiet Mode (muted = true) is default for mosque setting
  const [soundMode, setSoundMode] = useState<SoundMode>(() => readSession<SoundMode>('khalf_sound') ?? 'muted');
  useEffect(() => soundFx.setMode(soundMode), [soundMode]);
  const [reduceMotion, setReduceMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
  });

  const refreshPlayableBank = useCallback(async () => {
    try {
      const res = await fetch('/api/bank/playable');
      if (res.ok) {
        const data = (await res.json()) as WordBankData;
        setBank(data);
        try {
          localStorage.setItem(OFFLINE_BANK_CACHE_KEY, JSON.stringify(data));
        } catch {
          // ignore storage quota
        }
      }
    } catch {
      // Offline fallback remains active for Pass & Play
    }
  }, []);

  useEffect(() => {
    refreshPlayableBank();
  }, [refreshPlayableBank]);

  // Mirror state to document.body.dataset.state & reduce-motion class
  useEffect(() => {
    document.body.dataset.state = screen;
  }, [screen]);

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reduceMotion);
  }, [reduceMotion]);

  const changeSoundMode = () => {
    const next = soundMode === 'muted' ? 'quiet' : soundMode === 'quiet' ? 'on' : 'muted';
    soundFx.setMode(next);
    setSoundMode(next);
    writeSession('khalf_sound', next);
    soundFx.playTap();
  };

  const handleQuickStart = () => {
    writeSession(ROOM_SESSION_KEY, null);
    writeSession(LOCAL_MATCH_KEY, null);
    soundFx.playTap();
    setConfig({
      ...DEFAULT_GAME_CONFIG,
      deviceMode: 'single_device',
      gameMode: 'classic',
      totalRounds: 5,
      discussionSeconds: 60,
    });
    setScreen('pass_and_play');
  };

  const handleCreateMultiDeviceRoom = async (nextConfig: GameConfig, hostName: string) => {
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostName, config: nextConfig }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'تعذر إنشاء الغرفة');
      setConfig(nextConfig);
      setMultiSession({
        roomCode: data.roomCode,
        playerId: data.playerId,
        playerToken: data.playerToken,
        hostToken: data.hostToken,
      });
      setScreen('multi_device');
    } catch (err) {
      throw new Error((err as Error).message || 'تعذر إنشاء الغرفة.');
    }
  };

  if (screen === 'title') {
    return (
      <TitleScreen
        wordCount={bank.words.filter((w) => w.status === 'approved').length}
        pairCount={bank.confusing_pairs.filter((p) => p.status === 'approved').length}
        cardCount={bank.discussion_cards.filter((c) => c.status === 'approved').length}
        soundMode={soundMode}
        reduceMotion={reduceMotion}
        onChangeSoundMode={changeSoundMode}
        onToggleReduceMotion={() => setReduceMotion((r) => !r)}
        onQuickStart={handleQuickStart}
        onCustomSetup={() => {
          soundFx.playTap();
          setScreen('setup');
        }}
        onJoinRoom={() => {
          soundFx.playTap();
          setMultiSession(null);
          setScreen('multi_device');
        }}
        onOpenProjector={() => {
          soundFx.playTap();
          setProjectorCodeParam('');
          setScreen('projector');
        }}
        onOpenAdmin={() => {
          soundFx.playTap();
          setScreen('admin');
        }}
      />
    );
  }

  if (screen === 'setup') {
    return (
      <SetupWizard
        bank={bank}
        initialConfig={config}
        initialPlayers={singleDevicePlayers}
        onBack={() => setScreen('title')}
        onStartSingleDevice={(nextCfg, names) => {
          writeSession(ROOM_SESSION_KEY, null);
          writeSession(LOCAL_MATCH_KEY, null);
          setConfig(nextCfg);
          setSingleDevicePlayers(names);
          setScreen('pass_and_play');
        }}
        onCreateMultiDeviceRoom={handleCreateMultiDeviceRoom}
      />
    );
  }

  if (screen === 'pass_and_play') {
    return (
      <PassAndPlayView
        bank={bank}
        config={config}
        playerNames={singleDevicePlayers}
        onExitHome={() => {
          writeSession(LOCAL_MATCH_KEY, null);
          setScreen('title');
        }}
      />
    );
  }

  if (screen === 'multi_device') {
    return (
      <MultiDeviceView
        initialSession={multiSession}
        initialJoinCode={joinCodeParam}
        onExitHome={() => {
          setMultiSession(null);
          setJoinCodeParam('');
          writeSession(ROOM_SESSION_KEY, null);
          if (new URLSearchParams(window.location.search).has('join')) window.history.replaceState(null, '', window.location.pathname);
          setScreen('title');
        }}
        onOpenProjector={(code) => {
          window.open(`/?projector=${encodeURIComponent(code)}`, '_blank', 'noopener');
        }}
      />
    );
  }

  if (screen === 'projector') {
    return (
      <ProjectorView
        initialRoomCode={projectorCodeParam}
        onExitHome={() => {
          if (route.get('projector')) window.history.replaceState(null, '', window.location.pathname);
          setScreen('title');
        }}
      />
    );
  }

  return (
    <AdminDashboard
      onExitHome={() => setScreen('title')}
      onBankMutated={refreshPlayableBank}
    />
  );
}
