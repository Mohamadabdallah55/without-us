import React, { useCallback, useEffect, useState } from 'react';
import { AdminDashboard } from './components/AdminDashboard';
import { MultiDeviceView } from './components/MultiDeviceView';
import { PassAndPlayView } from './components/PassAndPlayView';
import { ProjectorView } from './components/ProjectorView';
import { SetupWizard } from './components/SetupWizard';
import { TitleScreen } from './components/TitleScreen';
import { DEFAULT_GAME_CONFIG } from './game/rules';
import { buildInitialBankFromPdfSeed } from './game/wordBankService';
import type { GameConfig, WordBankData } from './types/game';
import { soundFx } from './utils/sound';

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

  const [screen, setScreen] = useState<AppScreen>('title');
  const [config, setConfig] = useState<GameConfig>(DEFAULT_GAME_CONFIG);
  const [singleDevicePlayers, setSingleDevicePlayers] = useState<string[]>([
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
  const [joinCodeParam, setJoinCodeParam] = useState('');
  const [projectorCodeParam, setProjectorCodeParam] = useState('');

  // Quiet Mode (muted = true) is default for mosque setting
  const [muted, setMuted] = useState<boolean>(true);
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

  // URL parameter routing (?autostart=1, ?join=CODE, ?projector=CODE)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const join = params.get('join');
    const projector = params.get('projector');
    const autostart = params.get('autostart');
    if (projector) {
      setProjectorCodeParam(projector.toUpperCase());
      setScreen('projector');
    } else if (join) {
      setJoinCodeParam(join.toUpperCase());
      setScreen('multi_device');
    } else if (autostart === '1') {
      setScreen('setup');
    }
  }, []);

  // Mirror state to document.body.dataset.state & reduce-motion class
  useEffect(() => {
    document.body.dataset.state = screen === 'title' ? 'title' : 'playing';
  }, [screen]);

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reduceMotion);
  }, [reduceMotion]);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    soundFx.setMuted(next);
    if (!next) soundFx.playTap();
  };

  const handleQuickStart = () => {
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
      console.error(err);
    }
  };

  if (screen === 'title') {
    return (
      <TitleScreen
        wordCount={bank.words.length}
        pairCount={bank.confusing_pairs.length}
        cardCount={bank.discussion_cards.length}
        muted={muted}
        reduceMotion={reduceMotion}
        onToggleMute={toggleMute}
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
        onExitHome={() => setScreen('title')}
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
          setScreen('title');
        }}
        onOpenProjector={(code) => {
          setProjectorCodeParam(code);
          setScreen('projector');
        }}
      />
    );
  }

  if (screen === 'projector') {
    return (
      <ProjectorView
        initialRoomCode={projectorCodeParam}
        onExitHome={() => setScreen('title')}
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
