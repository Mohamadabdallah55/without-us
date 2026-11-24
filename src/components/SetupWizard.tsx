import { hasRoundCapacity } from '../game/rules';
import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronLeft,
  Clock,
  Layers,
  Plus,
  ShieldAlert,
  Smartphone,
  Sparkles,
  Trash2,
  Users,
  Wifi,
} from 'lucide-react';
import { DEFAULT_SCORING_RULES } from '../game/rules';
import { sanitizeUserText } from '../game/arabic';
import { filterPairsForPlay, filterWordsForPlay } from '../game/wordBankService';
import type { AgeBand, GameConfig, GameMode, WordBankData } from '../types/game';
import { PlayerAvatar } from './SvgAssets';

interface SetupWizardProps {
  bank: WordBankData;
  initialConfig: GameConfig;
  initialPlayers: string[];
  onBack: () => void;
  onStartSingleDevice: (config: GameConfig, playerNames: string[]) => void;
  onCreateMultiDeviceRoom: (config: GameConfig, hostName: string) => Promise<void>;
}

const AGE_BAND_OPTIONS: Array<{ id: AgeBand; label: string; desc: string }> = [
  { id: 'children_7_10', label: 'أطفال (7–10)', desc: 'كلمات يومية بسيطة (صعوبة 1–2)' },
  { id: 'preteens_11_13', label: 'ناشئة (11–13)', desc: 'رياضة، مدرسة، معالم (صعوبة 1–3)' },
  { id: 'teens_14_17', label: 'طلاب (14–17)', desc: 'تقنيات، دراسة، مواقف (صعوبة 2–4)' },
  { id: 'adults_18_plus', label: 'شباب وبالغون (+18)', desc: 'جميع الكلمات والمهن والمفاهيم' },
  { id: 'families_mixed', label: 'عائلات (مختلط)', desc: 'كلمات مشتركة تناسب الصغير والكبير' },
];

export const SetupWizard: React.FC<SetupWizardProps> = ({
  bank,
  initialConfig,
  initialPlayers,
  onBack,
  onStartSingleDevice,
  onCreateMultiDeviceRoom,
}) => {
  const [step, setStep] = useState<number>(1);
  const [config, setConfig] = useState<GameConfig>(initialConfig);
  const [playerNames, setPlayerNames] = useState<string[]>(
    initialPlayers.length >= 3 ? initialPlayers : ['أحمد', 'سالم', 'عمر', 'خالد', 'يوسف']
  );
  const [newPlayerInput, setNewPlayerInput] = useState('');
  const [hostName, setHostName] = useState('أبو يوسف');
  const [customRoundsInput, setCustomRoundsInput] = useState(String(initialConfig.totalRounds));
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const availablePoolCount = useMemo(() => {
    if (config.gameMode === 'confusing_pair') {
      return filterPairsForPlay(bank, {
        categories: config.categories,
        ageBand: config.ageBand,
        maxDifficulty: config.maxDifficulty,
        playedPairIdsHistory: [],
      }).length;
    }
    return filterWordsForPlay(bank, {
      categories: config.categories,
      ageBand: config.ageBand,
      maxDifficulty: config.maxDifficulty,
      playedIdsHistory: [],
    }).length;
  }, [bank, config]);

  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of bank.categories) {
      if (config.gameMode === 'confusing_pair') {
        map[c.id] = bank.confusing_pairs.filter(
          (p) => p.status === 'approved' && p.category === c.id
        ).length;
      } else {
        map[c.id] = bank.words.filter(
          (w) => w.status === 'approved' && w.category === c.id
        ).length;
      }
    }
    return map;
  }, [bank, config.gameMode]);

  const handleAddPlayer = () => {
    setErrorMsg(null);
    const clean = sanitizeUserText(newPlayerInput, 22);
    if (clean.length < 2) {
      setErrorMsg('أدخل اسمًا لا يقل عن حرفين.');
      return;
    }
    if (playerNames.length >= 12) {
      setErrorMsg('الحد الأقصى 12 لاعبًا.');
      return;
    }
    if (playerNames.some((n) => n.toLowerCase() === clean.toLowerCase())) {
      setErrorMsg('هذا الاسم مضاف بالفعل.');
      return;
    }
    setPlayerNames([...playerNames, clean]);
    setNewPlayerInput('');
  };

  const handleRemovePlayer = (idx: number) => {
    setPlayerNames(playerNames.filter((_, i) => i !== idx));
  };

  const toggleCategory = (catId: string) => {
    const exists = config.categories.includes(catId);
    const next = exists
      ? config.categories.filter((c) => c !== catId)
      : [...config.categories, catId];
    setConfig({ ...config, categories: next });
  };

  const selectAllCategories = () => {
    setConfig({ ...config, categories: bank.categories.map((c) => c.id) });
  };

  const handleModeChange = (mode: GameMode) => {
    setErrorMsg(null);
    setConfig({ ...config, gameMode: mode });
  };

  const canProceedFromStep = (): { ok: boolean; msg?: string } => {
    if (step === 2) {
      if (config.deviceMode === 'single_device') {
        const minPlayers = config.gameMode === 'two_outliers' ? 8 : 3;
        if (playerNames.length < minPlayers) {
          return { ok: false, msg: `أضف ${minPlayers} لاعبين على الأقل للمتابعة.` };
        }
      } else {
        if (sanitizeUserText(hostName, 22).length < 2) {
          return { ok: false, msg: 'أدخل اسم المضيف (حرفين على الأقل).' };
        }
      }
    }
    if (step === 3 && config.deviceMode === 'single_device' && config.gameMode === 'two_outliers' && playerNames.length < 8) {
      return { ok: false, msg: 'وضع «اثنين مش معنا» يتطلب 8 لاعبين على الأقل. أرجع للخطوة 2 أو اختر وضعًا آخر.' };
    }
    if (step === 4) {
      if (config.categories.length === 0) {
        return { ok: false, msg: 'اختر فئة واحدة على الأقل.' };
      }
      if (availablePoolCount === 0) {
        return { ok: false, msg: 'لا توجد عناصر مطابقة للفئة والعمر والصعوبة المختارة. وسّع الفلاتر.' };
      }
    }
    return { ok: true };
  };

  const handleNext = () => {
    const check = canProceedFromStep();
    if (!check.ok) {
      setErrorMsg(check.msg || 'تحقق من المدخلات');
      return;
    }
    setErrorMsg(null);
    setStep((s) => Math.min(7, s + 1));
  };

  const creating = React.useRef(false);
  const handleFinish = async () => {
    if (creating.current) return;
    if (!hasRoundCapacity(config, bank, config.totalRounds)) {
      setErrorMsg('عدد الجولات أكبر من الكلمات المتاحة بدون تكرار. وسّع الفئات أو قلّل الجولات.');
      return;
    }
    if (config.categories.length === 0 || availablePoolCount === 0) {
      setErrorMsg('اختر فئة تحتوي على كلمات أو أزواج متاحة.');
      return;
    }
    if (config.deviceMode === 'single_device') {
      const minPlayers = config.gameMode === 'two_outliers' ? 8 : 3;
      if (playerNames.length < minPlayers) {
        setErrorMsg(`هذا الوضع يتطلب ${minPlayers} لاعبين على الأقل.`);
        return;
      }
      onStartSingleDevice(config, playerNames);
    } else {
      const cleanHost = sanitizeUserText(hostName, 22) || 'المضيف';
      creating.current = true;
      try {
        await onCreateMultiDeviceRoom(config, cleanHost);
      } catch (error) {
        setErrorMsg((error as Error).message);
      } finally {
        creating.current = false;
      }
    }
  };

  const stepLabels = [
    'وضع الأجهزة',
    config.deviceMode === 'single_device' ? 'اللاعبون' : 'اسم المضيف',
    'وضع اللعبة',
    'الفئات والأعمار',
    'الجولات',
    'المؤقت والنقاط',
    'المراجعة والبدء',
  ];

  return (
    <div className="min-h-svh bg-transparent text-ink flex flex-col">
      {/* Top Bar */}
      <header className="border-b border-ink/25 bg-paper/90 px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] px-3.5 rounded-xl bg-lilac hover:bg-lilac text-ink text-sm font-medium inline-flex items-center gap-2 cursor-pointer whitespace-nowrap"
        >
          <ArrowRight className="w-4 h-4" />
          <span>الرئيسية</span>
        </button>

        <div className="text-center">
          <h2 className="font-display font-bold text-lg sm:text-xl text-ink">
            معالج إعداد المباراة
          </h2>
          <p className="text-xs text-berry tabular-nums">
            الخطوة {step} من 7 · {stepLabels[step - 1]}
          </p>
        </div>

        <div className="text-xs text-caption tabular-nums hidden sm:block">
          المتاح للعب: <strong className="text-berry">{availablePoolCount}</strong>
        </div>
      </header>

      {/* Interactive Stepper Bar */}
      <nav aria-label="خطوات الإعداد" className="px-4 sm:px-8 pt-4 max-w-5xl mx-auto w-full">
        <div className="kh-setup-steps grid grid-cols-7 gap-1.5">
          {stepLabels.map((lbl, idx) => {
            const num = idx + 1;
            const active = num === step;
            const done = num < step;
            return (
              <button
                key={lbl}
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setStep(num);
                }}
                className={`min-h-[40px] px-1.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer truncate ${
                  active
                    ? 'bg-mintplay text-ink'
                    : done
                    ? 'bg-teal-500/20 text-berry border border-teal-400/30'
                    : 'bg-lilac text-caption border border-ink/25 hover:text-ink'
                }`}
                title={lbl}
              >
                <span className="tabular-nums">{num}.</span>{' '}
                <span className="hidden md:inline">{lbl}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Step Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-8 py-6 flex flex-col justify-between gap-6">
        <div className="bg-paper border border-ink/25 rounded-2xl p-5 sm:p-8 shadow-xl">
          {errorMsg && (
            <div role="alert" className="mb-5 p-4 rounded-xl bg-rose-500/15 border border-rose-400/40 text-rose-800 text-sm flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 shrink-0 text-rose-800" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: Device Mode */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h3 className="font-display font-bold text-2xl text-ink">
                  كيف ستلعبون اليوم؟
                </h3>
                <p className="text-sm text-caption mt-1">
                  اختر اللعب بالتمرير على هاتف واحد، أو ربط هواتف اللاعبين بغرفة خاصة وبروجكتر.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, deviceMode: 'single_device' })}
                  className={`text-right p-6 rounded-2xl border transition-all cursor-pointer flex flex-col gap-3 ${
                    config.deviceMode === 'single_device'
                      ? 'bg-mintplay/40 border-teal-400 ring-1 ring-teal-400'
                      : 'bg-lilac border-ink/25 hover:border-teal-400/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Smartphone className="w-7 h-7 text-berry" />
                    <span className="text-xs font-bold text-berry">Pass & Play</span>
                  </div>
                  <div className="font-display font-extrabold text-xl text-ink">
                    جهاز واحد (تمرير الهاتف)
                  </div>
                  <p className="text-sm text-caption leading-relaxed">
                    هاتف واحد يتنقل بين اللاعبين مع شاشة حجب كاملة وزر ضغط مطول لكشف الكلمة سرًا. يعمل حتى بدون إنترنت بعد التحميل.
                  </p>
                  <p className="text-xs text-berry pt-2 border-t border-ink/25">
                    تنبيه خصوصية: وضع الجهاز الواحد يحمي أثناء التمرير فقط، بينما العزل التقني الكامل يتحقق في وضع الأجهزة المتعددة.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setConfig({ ...config, deviceMode: 'multi_device' })}
                  className={`text-right p-6 rounded-2xl border transition-all cursor-pointer flex flex-col gap-3 ${
                    config.deviceMode === 'multi_device'
                      ? 'bg-mintplay/40 border-teal-400 ring-1 ring-teal-400'
                      : 'bg-lilac border-ink/25 hover:border-teal-400/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Wifi className="w-7 h-7 text-berry" />
                    <span className="text-xs font-bold text-berry">غرفة خاصة + QR + بروجكتر</span>
                  </div>
                  <div className="font-display font-extrabold text-xl text-ink">
                    أجهزة متعددة (كل لاعب بهاتفه)
                  </div>
                  <p className="text-sm text-caption leading-relaxed">
                    ينشئ المشرف غرفة برمز انضمام وQR. يستلم كل لاعب كلمته سرًا على جهازه عبر الخادم مع إمكانية عرض شاشة 16:9 على البروجكتر.
                  </p>
                  <p className="text-xs text-berry pt-2 border-t border-ink/25">
                    حماية خادم حقيقية: لا تُرسل كلمات أو أدوار الآخرين إلى متصفح اللاعب أو شاشة البروجكتر.
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Players or Room Host */}
          {step === 2 && (
            <div className="space-y-5">
              {config.deviceMode === 'single_device' ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-display font-bold text-2xl text-ink">
                        أسماء اللاعبين ({playerNames.length}/12)
                      </h3>
                      <p className="text-sm text-caption mt-1">
                        أضف من 3 إلى 12 لاعبًا (وضع «اثنين مش معنا» يتطلب 8 لاعبين على الأقل).
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2.5">
                    <input
                      type="text"
                      value={newPlayerInput}
                      onChange={(e) => setNewPlayerInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddPlayer();
                        }
                      }}
                      placeholder="اكتب اسم اللاعب..."
                      aria-label="اسم اللاعب الجديد"
                      maxLength={22}
                      className="flex-1 min-h-[48px] px-4 rounded-xl bg-paper border border-ink/25 text-ink placeholder:text-ink0 focus:outline-none focus:border-teal-400"
                    />
                    <button
                      type="button"
                      onClick={handleAddPlayer}
                      className="min-h-[48px] px-5 rounded-xl bg-mintplay hover:bg-mintplay text-ink font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <Plus className="w-5 h-5" />
                      <span>إضافة</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {playerNames.map((name, idx) => (
                      <div
                        key={`${name}-${idx}`}
                        className="flex items-center justify-between gap-2.5 p-3 rounded-xl bg-lilac border border-ink/25"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <PlayerAvatar index={idx} size="sm" />
                          <span className="font-semibold text-ink truncate">{name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemovePlayer(idx)}
                          aria-label={`حذف ${name}`}
                          className="min-h-[36px] min-w-[36px] rounded-lg hover:bg-rose-500/20 text-caption hover:text-rose-800 flex items-center justify-center cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="max-w-md space-y-4">
                  <div>
                    <h3 className="font-display font-bold text-2xl text-ink">
                      اسم المضيف (المشرف)
                    </h3>
                    <p className="text-sm text-caption mt-1">
                      بعد إنهاء الإعداد سيتم فتح غرفة خاصة برمز وQR لينضم إليها باقي اللاعبين من هواتفهم.
                    </p>
                  </div>
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-ink">الاسم المستعار للمضيف</span>
                    <input
                      type="text"
                      value={hostName}
                      onChange={(e) => setHostName(e.target.value)}
                      maxLength={22}
                      className="w-full min-h-[48px] px-4 rounded-xl bg-paper border border-ink/25 text-ink focus:outline-none focus:border-teal-400"
                    />
                  </label>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Game Mode */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h3 className="font-display font-bold text-2xl text-ink">
                  اختر وضع اللعب
                </h3>
                <p className="text-sm text-caption mt-1">
                  لكل وضع قواعده الخاصة وتحديه الفريد في النقاش والاستنتاج.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => handleModeChange('classic')}
                  className={`text-right p-5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2.5 ${
                    config.gameMode === 'classic'
                      ? 'bg-mintplay/40 border-teal-400 ring-1 ring-teal-400'
                      : 'bg-lilac border-ink/25 hover:border-teal-400/40'
                  }`}
                >
                  <div className="font-display font-extrabold text-xl text-berry">
                    مين مش معنا؟ (الكلاسيكي)
                  </div>
                  <p className="text-sm text-caption leading-relaxed">
                    3–12 لاعبًا. الجميع يعرفون الكلمة السرية إلا لاعبًا واحدًا يرى «أنت مش معنا». إذا اكتُشف، يحصل على فرصة واحدة لتخمين الكلمة!
                  </p>
                  <p className="text-xs text-caption mt-auto pt-2 border-t border-ink/25">
                    النقاط: +{config.scoringRules.classicCorrectVote} للمصوّت الصحيح · +{config.scoringRules.classicOutlierSurvive} لنجاة المختلف · +{config.scoringRules.classicOutlierGuessBonus} لتخمين الكلمة
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleModeChange('confusing_pair')}
                  className={`text-right p-5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2.5 ${
                    config.gameMode === 'confusing_pair'
                      ? 'bg-amber-500/15 border-amber-400 ring-1 ring-amber-400'
                      : 'bg-lilac border-ink/25 hover:border-amber-400/40'
                  }`}
                >
                  <div className="font-display font-extrabold text-xl text-berry">
                    الملخبط (كلمتان متشابهتان)
                  </div>
                  <p className="text-sm text-caption leading-relaxed">
                    الأغلبية تحصل على كلمة (مثل «منسف») ولاعب واحد يحصل على كلمة قريبة (مثل «مقلوبة») دون أي تنبيه أنه المختلف!
                  </p>
                  <p className="text-xs text-caption mt-auto pt-2 border-t border-ink/25">
                    يعتمد على {bank.confusing_pairs.filter((p) => p.status === 'approved').length} زوجًا معتمدًا من الدليل مع شرح الفرق بعد الجولة.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleModeChange('two_outliers')}
                  className={`text-right p-5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2.5 ${
                    config.gameMode === 'two_outliers'
                      ? 'bg-mintplay/40 border-teal-400 ring-1 ring-teal-400'
                      : 'bg-lilac border-ink/25 hover:border-teal-400/40'
                  }`}
                >
                  <div className="font-display font-extrabold text-xl text-sky-300">
                    اثنين مش معنا (8–12 لاعبًا)
                  </div>
                  <p className="text-sm text-caption leading-relaxed">
                    لاعبان مختلفان وسط المجموعة! يصوّت كل لاعب على شخصين مختلفين سرًا، مع احتساب نقطة عن كل مختلف يتم كشفه.
                  </p>
                  <p className="text-xs text-berry mt-auto pt-2 border-t border-ink/25">
                    متاح فقط من 8 لاعبين فأكثر لضمان توازن اللعب.
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Categories, Age Band & Difficulty */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-display font-bold text-2xl text-ink">
                    الفئات والفئة العمرية ومستوى الصعوبة
                  </h3>
                  <p className="text-sm text-caption mt-1">
                    الرصيد المطابق لاختياراتك حاليًا: <strong className="text-berry tabular-nums">{availablePoolCount}</strong> {config.gameMode === 'confusing_pair' ? 'زوجًا' : 'كلمة'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={selectAllCategories}
                  className="min-h-[40px] px-4 rounded-xl bg-mintplay/40 border border-teal-400/40 text-berry text-xs font-bold cursor-pointer whitespace-nowrap"
                >
                  تحديد جميع الفئات
                </button>
              </div>

              {/* Age & Difficulty */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-ink block">الفئة العمرية المناسبة</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {AGE_BAND_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setConfig({ ...config, ageBand: opt.id })}
                        className={`p-3 rounded-xl border text-right transition-colors cursor-pointer ${
                          config.ageBand === opt.id
                            ? 'bg-teal-500/20 border-teal-400 text-berry'
                            : 'bg-lilac border-ink/25 text-caption hover:border-ink/25'
                        }`}
                      >
                        <div className="text-sm font-bold">{opt.label}</div>
                        <div className="text-xs text-caption mt-0.5">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-ink block">
                    الحد الأقصى للصعوبة ({config.maxDifficulty}/5)
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setConfig({ ...config, maxDifficulty: lvl })}
                        className={`min-h-[48px] rounded-xl border font-bold tabular-nums cursor-pointer ${
                          config.maxDifficulty === lvl
                            ? 'bg-lemon text-ink border-amber-300'
                            : 'bg-lilac border-ink/25 text-caption hover:border-amber-400/40'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-caption leading-relaxed pt-1">
                    المستوى 1–2 مباشر ومألوف للناشئة والأطفال، والمستوى 3–5 يضيف مصطلحات أعمق للشباب والعائلات.
                  </p>
                </div>
              </div>

              {/* Categories Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {bank.categories.map((cat) => {
                  const selected = config.categories.includes(cat.id);
                  const count = categoryCounts[cat.id] || 0;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className={`p-4 rounded-xl border text-right transition-all cursor-pointer flex flex-col gap-1.5 ${
                        selected
                          ? 'bg-mintplay/40 border-teal-400 text-ink'
                          : 'bg-lilac border-ink/25 text-caption hover:border-ink/25'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display font-bold text-base">{cat.name_ar}</span>
                        {selected && <Check className="w-4 h-4 text-berry shrink-0" />}
                      </div>
                      <p className="text-xs text-caption line-clamp-1">{cat.subcategories_summary}</p>
                      <p className="text-xs text-berry tabular-nums pt-1">
                        {count} {config.gameMode === 'confusing_pair' ? 'زوج' : 'كلمة'}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: Rounds */}
          {step === 5 && (
            <div className="space-y-5">
              <div>
                <h3 className="font-display font-bold text-2xl text-ink">
                  عدد الجولات
                </h3>
                <p className="text-sm text-caption mt-1">
                  تستمر المباراة دون تكرار الكلمات حتى إعلان الفائز النهائي.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[3, 5, 7].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setConfig({ ...config, totalRounds: r });
                      setCustomRoundsInput(String(r));
                    }}
                    className={`min-h-[72px] rounded-2xl border font-display font-extrabold text-2xl tabular-nums cursor-pointer ${
                      config.totalRounds === r
                        ? 'bg-mintplay text-ink border-teal-300'
                        : 'bg-lilac border-ink/25 text-ink hover:border-teal-400/40'
                    }`}
                  >
                    {r} جولات
                  </button>
                ))}

                <div className="p-3 rounded-2xl bg-lilac border border-ink/25 flex flex-col justify-center gap-1">
                  <label className="text-xs text-caption">تخصيص (1–15)</label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={customRoundsInput}
                    onChange={(e) => {
                      setCustomRoundsInput(e.target.value);
                      const val = Math.min(15, Math.max(1, Math.trunc(Number(e.target.value)) || 3));
                      setConfig({ ...config, totalRounds: val });
                    }}
                    className="w-full px-3 py-1.5 rounded-lg bg-paper border border-ink/25 text-ink font-bold tabular-nums"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Discussion Timer & Pre-match Scoring Rules */}
          {step === 6 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-display font-bold text-2xl text-ink">
                  ظبّطوا وقت الحكي
                </h3>
                <p className="text-sm text-caption mt-1">
                  تُثبّت قواعد النقاط هنا قبل يلا نبلّش! ولا يمكن تغييرها سرًا أثناء اللعب.
                </p>
              </div>

              <div>
                <label className="text-sm font-semibold text-ink mb-2.5 block">
                  مؤقت النقاش لكل جولة
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {[
                    { sec: 30, lbl: '30 ثانية' },
                    { sec: 60, lbl: '60 ثانية' },
                    { sec: 90, lbl: '90 ثانية' },
                    { sec: 120, lbl: '120 ثانية' },
                    { sec: 0, lbl: 'بلا مؤقت' },
                  ].map((t) => (
                    <button
                      key={t.sec}
                      type="button"
                      onClick={() => setConfig({ ...config, discussionSeconds: t.sec })}
                      className={`min-h-[52px] rounded-xl border font-bold text-sm tabular-nums cursor-pointer ${
                        config.discussionSeconds === t.sec
                          ? 'bg-lemon text-ink border-amber-300'
                          : 'bg-lilac border-ink/25 text-ink hover:border-amber-400/40'
                      }`}
                    >
                      {t.lbl}
                    </button>
                  ))}
                </div>
              </div>

              <fieldset className="space-y-2">
                <legend className="font-bold">وقت كل مواجهة</legend>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[0, 20, 30, 60].map((seconds) => (
                    <button type="button" key={seconds} aria-pressed={config.questionSeconds === seconds}
                      onClick={() => setConfig({ ...config, questionSeconds: seconds })}
                      className={`min-h-[48px] rounded-xl border font-bold ${config.questionSeconds === seconds ? 'bg-lemon text-ink' : 'bg-lilac border-ink/25'}`}>
                      {seconds ? `${seconds} ثانية` : 'بلا مؤقت'}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-ink/25">
                <div className="space-y-3">
                  <h4 className="font-bold text-base text-berry">نقاط المباراة (معلنة للجميع)</h4>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <label className="bg-lilac p-3 rounded-xl border border-ink/25 space-y-1">
                      <span className="text-caption block">اكتشاف المختلف</span>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        value={config.scoringRules.classicCorrectVote}
                        onChange={(e) => {
                          const v = Math.max(1, Math.min(5, Number(e.target.value) || 1));
                          setConfig({
                            ...config,
                            scoringRules: {
                              ...config.scoringRules,
                              classicCorrectVote: v,
                              confusingCorrectVote: v,
                              twoOutliersPerCorrectVote: v,
                            },
                          });
                        }}
                        className="w-full px-2 py-1 rounded bg-paper border border-ink/25 font-bold tabular-nums text-berry"
                      />
                    </label>
                    <label className="bg-lilac p-3 rounded-xl border border-ink/25 space-y-1">
                      <span className="text-caption block">نجاة المختلف</span>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        value={config.scoringRules.classicOutlierSurvive}
                        onChange={(e) => {
                          const v = Math.max(1, Math.min(5, Number(e.target.value) || 2));
                          setConfig({
                            ...config,
                            scoringRules: {
                              ...config.scoringRules,
                              classicOutlierSurvive: v,
                              confusingOutlierSurvive: v,
                              twoOutliersSurviveEach: v,
                            },
                          });
                        }}
                        className="w-full px-2 py-1 rounded bg-paper border border-ink/25 font-bold tabular-nums text-berry"
                      />
                    </label>
                    <label className="bg-lilac p-3 rounded-xl border border-ink/25 space-y-1">
                      <span className="text-caption block">تخمين الكلمة</span>
                      <input
                        type="number"
                        min={0}
                        max={3}
                        value={config.scoringRules.classicOutlierGuessBonus}
                        onChange={(e) => {
                          const v = Math.max(0, Math.min(3, Number(e.target.value) || 0));
                          setConfig({
                            ...config,
                            scoringRules: {
                              ...config.scoringRules,
                              classicOutlierGuessBonus: v,
                            },
                          });
                        }}
                        className="w-full px-2 py-1 rounded bg-paper border border-ink/25 font-bold tabular-nums text-berry"
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, scoringRules: { ...DEFAULT_SCORING_RULES } })}
                    className="text-xs text-caption hover:text-berry underline cursor-pointer"
                  >
                    استعادة النقاط الافتراضية المتوازنة (+1 / +2 / +1)
                  </button>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-base text-berry">خيار التصويت</h4>
                  <label className="flex items-start gap-3 p-3.5 rounded-xl bg-lilac border border-ink/25 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.allowVoteChangeBeforeClose}
                      onChange={(e) =>
                        setConfig({ ...config, allowVoteChangeBeforeClose: e.target.checked })
                      }
                      className="mt-1 w-4 h-4 accent-teal-400"
                    />
                    <span className="text-sm text-ink leading-relaxed">
                      السماح للاعب بتغيير تصويته قبل إغلاق المرحلة (الافتراضي: التصويت نهائي بمجرد الاعتماد).
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: Review & Start */}
          {step === 7 && (
            <div className="space-y-5">
              <div>
                <h3 className="font-display font-bold text-2xl text-ink">
                  مراجعة الإعدادات ويلا نبلّش!
                </h3>
                <p className="text-sm text-caption mt-1">
                  تأكد من تفاصيل جلستكم قبل الانطلاق.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-sm">
                <div className="p-4 rounded-xl bg-lilac border border-ink/25">
                  <div className="text-xs text-caption flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-berry" />
                    <span>وضع الأجهزة</span>
                  </div>
                  <div className="font-bold text-base text-ink mt-1">
                    {config.deviceMode === 'single_device' ? 'جهاز واحد (Pass & Play)' : 'أجهزة متعددة (غرفة خاصة)'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-lilac border border-ink/25">
                  <div className="text-xs text-caption flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-berry" />
                    <span>وضع اللعبة</span>
                  </div>
                  <div className="font-bold text-base text-ink mt-1">
                    {config.gameMode === 'classic'
                      ? 'مين مش معنا؟ (الكلاسيكي)'
                      : config.gameMode === 'confusing_pair'
                      ? 'الملخبط'
                      : 'اثنين مش معنا'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-lilac border border-ink/25">
                  <div className="text-xs text-caption flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-berry" />
                    <span>المشاركون</span>
                  </div>
                  <div className="font-bold text-base text-ink mt-1 tabular-nums">
                    {config.deviceMode === 'single_device'
                      ? `${playerNames.length} لاعبين (${playerNames.slice(0, 3).join('، ')}${playerNames.length > 3 ? '...' : ''})`
                      : `المضيف: ${hostName} (سينضم اللاعبون بالرمز)`}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-lilac border border-ink/25">
                  <div className="text-xs text-caption flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-berry" />
                    <span>الفئات والرصيد المتاح</span>
                  </div>
                  <div className="font-bold text-base text-ink mt-1 tabular-nums">
                    {config.categories.length} فئات · {availablePoolCount} متاح للعب
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-lilac border border-ink/25">
                  <div className="text-xs text-caption flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-berry" />
                    <span>الجولات والمؤقت</span>
                  </div>
                  <div className="font-bold text-base text-ink mt-1 tabular-nums">
                    {config.totalRounds} جولات · {config.discussionSeconds > 0 ? `${config.discussionSeconds} ثانية` : 'بلا مؤقت'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-lilac border border-ink/25">
                  <div className="text-xs text-caption">قواعد النقاط المثبتة</div>
                  <div className="font-bold text-sm text-berry mt-1 tabular-nums">
                    اكتشاف +{config.scoringRules.classicCorrectVote} · نجاة +{config.scoringRules.classicOutlierSurvive} · تخمين +{config.scoringRules.classicOutlierGuessBonus}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => {
              setErrorMsg(null);
              if (step === 1) onBack();
              else setStep((s) => s - 1);
            }}
            className="min-h-[48px] px-5 rounded-xl bg-lilac hover:bg-lilac border border-ink/25 text-ink font-semibold inline-flex items-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <ArrowRight className="w-4 h-4" />
            <span>السابق</span>
          </button>

          {step < 7 ? (
            <button
              type="button"
              onClick={handleNext}
              className="min-h-[48px] px-7 rounded-xl bg-mintplay hover:bg-mintplay text-ink font-extrabold inline-flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <span>التالي</span>
              <ChevronLeft className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="min-h-[52px] px-8 rounded-xl bg-lemon hover:bg-lemon text-ink font-display font-extrabold text-lg inline-flex items-center gap-2 shadow-[0_10px_28px_rgba(245,196,81,0.3)] cursor-pointer whitespace-nowrap"
            >
              <span>{config.deviceMode === 'single_device' ? 'ابدأ المباراة الآن' : 'إنشاء الغرفة وبدء التجمع'}</span>
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
        </div>
      </main>
    </div>
  );
};
