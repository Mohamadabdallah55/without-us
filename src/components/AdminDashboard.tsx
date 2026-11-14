import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Lock,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  Upload,
} from 'lucide-react';
import type { AgeBand, ImportReport, ItemStatus, WordBankData, WordEntry } from '../types/game';

interface AdminDashboardProps {
  onExitHome: () => void;
  onBankMutated: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onExitHome,
  onBankMutated,
}) => {
  const [token, setToken] = useState<string>(() => {
    try {
      return sessionStorage.getItem('hm_admin_token') || '';
    } catch {
      return '';
    }
  });
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  const [bank, setBank] = useState<WordBankData | null>(null);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [duplicates, setDuplicates] = useState<Array<{ id: string; text_ar: string; duplicateOf: string }>>([]);
  const [tab, setTab] = useState<'report' | 'words' | 'pairs' | 'cards' | 'import_export'>('report');

  // Word filters
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('ALL');
  const [filterAge, setFilterAge] = useState<'ALL' | AgeBand>('ALL');
  const [filterDiff, setFilterDiff] = useState<number>(5);
  const [filterStatus, setFilterStatus] = useState<'ALL' | ItemStatus>('ALL');

  // New Word form
  const [newWordText, setNewWordText] = useState('');
  const [newWordCat, setNewWordCat] = useState('CAT_FOOD');
  const [newWordSubcat, setNewWordSubcat] = useState('مخصص');
  const [newWordDiff, setNewWordDiff] = useState(2);

  // Edit word inline
  const [editingWord, setEditingWord] = useState<WordEntry | null>(null);

  // New Pair form
  const [pairWordA, setPairWordA] = useState('');
  const [pairWordB, setPairWordB] = useState('');
  const [pairReason, setPairReason] = useState('');

  // New Card form
  const [newCardPrompt, setNewCardPrompt] = useState('');

  // Bulk import
  const [importFormat, setImportFormat] = useState<'json' | 'csv'>('json');
  const [importPayload, setImportPayload] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const loadAdminData = async (tok: string) => {
    const res = await fetch('/api/admin/bank', {
      headers: { Authorization: `Bearer ${tok}` },
    });
    if (res.status === 401) {
      setToken('');
      try {
        sessionStorage.removeItem('hm_admin_token');
      } catch {
        // ignore
      }
      return;
    }
    if (res.ok) {
      const data = await res.json();
      setBank(data.bank);
      setReport(data.report);
      setDuplicates(data.duplicates || []);
    }
  };

  useEffect(() => {
    if (token) {
      loadAdminData(token);
    }
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل تسجيل الدخول');
      setToken(data.token);
      try {
        sessionStorage.setItem('hm_admin_token', data.token);
      } catch {
        // ignore
      }
    } catch (err) {
      setAuthError((err as Error).message);
    }
  };

  const adminFetch = async (url: string, method = 'POST', body?: unknown) => {
    setStatusMsg(null);
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'فشل التنفيذ');
    await loadAdminData(token);
    onBankMutated();
    return data;
  };

  const filteredWords = useMemo(() => {
    if (!bank) return [];
    const q = search.trim();
    return bank.words.filter((w) => {
      if (filterCat !== 'ALL' && w.category !== filterCat) return false;
      if (filterAge !== 'ALL' && !w.age_bands.includes(filterAge)) return false;
      if (w.difficulty > filterDiff) return false;
      if (filterStatus !== 'ALL' && w.status !== filterStatus) return false;
      if (q && !w.text_ar.includes(q) && !w.id.includes(q)) return false;
      return true;
    });
  }, [bank, search, filterCat, filterAge, filterDiff, filterStatus]);

  const handleDownloadExport = async (format: 'json' | 'csv') => {
    const res = await fetch(`/api/admin/export?format=${format}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = format === 'csv' ? 'ho_maana_words.csv' : 'ho_maana_word_bank.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#070E1A] text-slate-100 flex flex-col items-center justify-center p-4">
        <form
          onSubmit={handleLogin}
          className="max-w-md w-full bg-[#0B1526] border border-white/10 rounded-3xl p-8 space-y-5 shadow-2xl"
        >
          <div className="text-center space-y-2">
            <Lock className="w-10 h-10 text-amber-300 mx-auto" />
            <h2 className="font-display font-black text-2xl text-slate-50">
              لوحة إدارة بنك الكلمات
            </h2>
            <p className="text-sm text-slate-300">
              مخصصة لمشرفي مكتبة الألعاب في مسجد ابن تيمية.
            </p>
          </div>

          {authError && (
            <div role="alert" className="p-3 rounded-xl bg-rose-500/15 border border-rose-400/40 text-rose-200 text-sm">
              {authError}
            </div>
          )}

          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-slate-200">رمز مرور المشرف</span>
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="أدخل رمز المشرف..."
              required
              className="w-full min-h-[48px] px-4 rounded-xl bg-[#070E1A] border border-white/15 text-slate-100 focus:outline-none focus:border-teal-400"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onExitHome}
              className="min-h-[48px] rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold cursor-pointer"
            >
              رجوع
            </button>
            <button
              type="submit"
              className="min-h-[48px] rounded-xl bg-teal-500 hover:bg-teal-400 text-[#051019] font-extrabold cursor-pointer"
            >
              دخول الإدارة
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070E1A] text-slate-100 flex flex-col">
      <header className="border-b border-white/10 bg-[#0B1526]/90 px-4 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-xl text-slate-50">
            إدارة بنك الكلمات وتقرير استيراد PDF
          </h1>
          <p className="text-xs text-slate-400">
            مكتبة الألعاب الدائمة — مسجد ابن تيمية · استيراد آمن بدون تكرار
          </p>
        </div>
        <button
          type="button"
          onClick={onExitHome}
          className="min-h-[40px] px-4 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة للعبة</span>
        </button>
      </header>

      <nav className="border-b border-white/10 bg-[#0B1526]/50 px-4 sm:px-8 py-2.5 flex flex-wrap gap-2">
        {[
          { id: 'report', label: 'تقرير الاستيراد الحقيقي' },
          { id: 'words', label: `الكلمات (${bank?.words.length ?? 0})` },
          { id: 'pairs', label: `أزواج الملخبط (${bank?.confusing_pairs.length ?? 0})` },
          { id: 'cards', label: `بطاقات النقاش (${bank?.discussion_cards.length ?? 0})` },
          { id: 'import_export', label: 'استيراد / تصدير JSON & CSV' },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id as typeof tab)}
            className={`min-h-[40px] px-4 rounded-xl text-xs sm:text-sm font-bold cursor-pointer tabular-nums ${
              tab === item.id
                ? 'bg-teal-500 text-[#051019]'
                : 'bg-[#101E36] text-slate-300 hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-8 py-6 space-y-6">
        {statusMsg && (
          <div className="p-3.5 rounded-xl bg-teal-500/15 border border-teal-400/40 text-teal-200 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* TAB 1: Truthful Import Report */}
        {tab === 'report' && report && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display font-extrabold text-2xl text-slate-50">
                  تقرير استيراد ملف PDF المرجعي
                </h2>
                <p className="text-sm text-slate-400 mt-0.5">
                  المصدر: {report.sourceDocument}
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  const res = await adminFetch('/api/admin/reimport-pdf', 'POST');
                  setStatusMsg(
                    `تم فحص إعادة الاستيراد (UPSERT): أُضيف ${res.addedCount}، حُدّث ${res.updatedCount}، مكرر متجاهل ${res.skippedDuplicates}.`
                  );
                }}
                className="min-h-[44px] px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#051019] font-bold text-sm inline-flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>إعادة فحص واستيراد PDF (بدون مضاعفة)</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-2xl bg-[#0B1526] border border-white/10">
                <p className="text-xs text-slate-400">الكلمات المستخرجة فعليًا</p>
                <p className="font-display font-black text-3xl text-teal-300 tabular-nums mt-1">
                  {report.extractedWords}
                </p>
                <p className="text-xs text-slate-400 mt-1">الهدف المستقبلي بالوثيقة: {report.targetWordsDeclared}</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#0B1526] border border-white/10">
                <p className="text-xs text-slate-400">الكلمات المعتمدة للعب</p>
                <p className="font-display font-black text-3xl text-slate-50 tabular-nums mt-1">
                  {report.availableWordsForPlay}
                </p>
                <p className="text-xs text-slate-400 mt-1">المكرر المكتشف: {report.duplicateWords}</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#0B1526] border border-white/10">
                <p className="text-xs text-slate-400">أزواج الملخبط المستخرجة</p>
                <p className="font-display font-black text-3xl text-amber-300 tabular-nums mt-1">
                  {report.validPairs}
                </p>
                <p className="text-xs text-amber-200/80 mt-1">
                  مذكور بالملخص {report.pairsDeclaredInSummary} ({report.pairsMissingFromDocument} غير مدرجة بالجدول)
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#0B1526] border border-white/10">
                <p className="text-xs text-slate-400">بطاقات النقاش المعتمدة</p>
                <p className="font-display font-black text-3xl text-teal-300 tabular-nums mt-1">
                  {report.availableCardsForPlay}
                </p>
                <p className="text-xs text-slate-400 mt-1">قيد المراجعة: {report.needsReviewCount}</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#0B1526] border border-white/10 space-y-2 text-sm text-slate-300 leading-relaxed">
              <h3 className="font-bold text-amber-300">بيان الشفافية والتحقق من البيانات:</h3>
              <p>
                تم استخراج <strong>650 كلمة سرية كاملة</strong> (من W_0001 إلى W_0650)، و<strong>100 بطاقة نقاش كاملة</strong> (من DC_001 إلى DC_100)، و<strong>60 زوجًا تفصيليًا للملخبط</strong> (من CP_001 إلى CP_060) من جداول ملف PDF المرفق.
              </p>
              <p>
                لم يتم إنشاء أي سجلات وهمية للـ 90 زوجًا الإضافية (CP_061–CP_150) أو الـ 1350 كلمة المستهدفة غير المدرجة نصيًا في الوثيقة. كما تم تصحيح أرقام معرفات بعض الأزواج (مثل CP_013–CP_015) لتطابق الكلمات الفعلية في الجدول ({report.pairIdReconciliations.length} مطابقة معرفات تلقائية).
              </p>
            </div>

            {duplicates.length > 0 && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-400/30 space-y-2">
                <h3 className="font-bold text-rose-200 text-sm flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  <span>كلمات متشابهة أو مكررة ({duplicates.length}):</span>
                </h3>
                <ul className="text-xs text-rose-100 space-y-1">
                  {duplicates.map((d) => (
                    <li key={d.id}>
                      {d.id}: «{d.text_ar}» يطابق {d.duplicateOf}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Words CRUD */}
        {tab === 'words' && bank && (
          <div className="space-y-5">
            {/* Add Word Form */}
            <div className="p-5 rounded-2xl bg-[#0B1526] border border-white/10 space-y-3">
              <h3 className="font-bold text-base text-teal-300">إضافة كلمة جديدة</h3>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                <input
                  type="text"
                  value={newWordText}
                  onChange={(e) => setNewWordText(e.target.value)}
                  placeholder="الكلمة العربية..."
                  className="sm:col-span-2 min-h-[44px] px-3 rounded-xl bg-[#070E1A] border border-white/15 text-sm"
                />
                <select
                  value={newWordCat}
                  onChange={(e) => setNewWordCat(e.target.value)}
                  className="min-h-[44px] px-3 rounded-xl bg-[#070E1A] border border-white/15 text-sm"
                >
                  {bank.categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name_ar}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={newWordDiff}
                  onChange={(e) => setNewWordDiff(Number(e.target.value) || 2)}
                  aria-label="مستوى الصعوبة"
                  className="min-h-[44px] px-3 rounded-xl bg-[#070E1A] border border-white/15 text-sm tabular-nums"
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (!newWordText.trim()) return;
                    await adminFetch('/api/admin/words', 'POST', {
                      text_ar: newWordText,
                      category: newWordCat,
                      subcategory: newWordSubcat,
                      difficulty: newWordDiff,
                    });
                    setNewWordText('');
                    setStatusMsg('تمت إضافة الكلمة وحفظها في البنك.');
                  }}
                  className="min-h-[44px] px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-[#051019] font-bold text-sm inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة</span>
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
              <div className="sm:col-span-2 relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="بحث بالكلمة أو المعرف..."
                  className="w-full min-h-[44px] pr-9 pl-3 rounded-xl bg-[#0B1526] border border-white/15 text-sm"
                />
              </div>
              <select
                value={filterCat}
                onChange={(e) => setFilterCat(e.target.value)}
                className="min-h-[44px] px-3 rounded-xl bg-[#0B1526] border border-white/15 text-sm"
              >
                <option value="ALL">جميع الفئات</option>
                {bank.categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name_ar}</option>
                ))}
              </select>
              <select
                value={filterAge}
                onChange={(e) => setFilterAge(e.target.value as typeof filterAge)}
                className="min-h-[44px] px-3 rounded-xl bg-[#0B1526] border border-white/15 text-sm"
              >
                <option value="ALL">جميع الأعمار</option>
                <option value="children_7_10">أطفال (7–10)</option>
                <option value="preteens_11_13">ناشئة (11–13)</option>
                <option value="teens_14_17">طلاب (14–17)</option>
                <option value="adults_18_plus">بالغون (+18)</option>
                <option value="families_mixed">عائلات</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                className="min-h-[44px] px-3 rounded-xl bg-[#0B1526] border border-white/15 text-sm"
              >
                <option value="ALL">كل الحالات</option>
                <option value="approved">معتمد</option>
                <option value="needs_review">قيد المراجعة</option>
                <option value="draft">مسودة</option>
                <option value="archived">مؤرشف</option>
              </select>
            </div>

            <p className="text-xs text-slate-400 tabular-nums">
              عرض {Math.min(filteredWords.length, 100)} من أصل {filteredWords.length} كلمة مطابقة
            </p>

            {/* Words List */}
            <div className="space-y-2">
              {filteredWords.slice(0, 100).map((w) => (
                <div
                  key={w.id}
                  className="p-3.5 rounded-xl bg-[#0B1526] border border-white/10 flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    {editingWord?.id === w.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingWord.text_ar}
                          onChange={(e) =>
                            setEditingWord({ ...editingWord, text_ar: e.target.value })
                          }
                          className="px-2.5 py-1 rounded bg-[#070E1A] border border-teal-400 text-sm"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            await adminFetch(`/api/admin/words/${w.id}`, 'PATCH', {
                              text_ar: editingWord.text_ar,
                            });
                            setEditingWord(null);
                          }}
                          className="px-2.5 py-1 rounded bg-teal-500 text-[#051019] text-xs font-bold cursor-pointer"
                        >
                          حفظ
                        </button>
                      </div>
                    ) : (
                      <div className="font-bold text-base text-slate-50">{w.text_ar}</div>
                    )}
                    <div className="text-xs text-slate-400 tabular-nums mt-0.5">
                      {w.id} · {bank.categories.find((c) => c.id === w.category)?.name_ar} · صعوبة {w.difficulty} · {w.status === 'approved' ? 'معتمد' : w.status}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setEditingWord(w)}
                      className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 cursor-pointer"
                    >
                      تعديل
                    </button>
                    {w.status !== 'approved' ? (
                      <button
                        type="button"
                        onClick={() => adminFetch(`/api/admin/words/${w.id}`, 'PATCH', { status: 'approved' })}
                        className="px-2.5 py-1.5 rounded-lg bg-teal-500/20 text-teal-200 font-bold cursor-pointer"
                      >
                        اعتماد
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => adminFetch(`/api/admin/words/${w.id}`, 'PATCH', { status: 'needs_review' })}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 text-amber-200 cursor-pointer"
                      >
                        مراجعة
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => adminFetch(`/api/admin/words/${w.id}`, 'DELETE')}
                      aria-label={`أرشفة ${w.text_ar}`}
                      className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-300 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Confusing Pairs */}
        {tab === 'pairs' && bank && (
          <div className="space-y-5">
            <div className="p-5 rounded-2xl bg-[#0B1526] border border-white/10 space-y-3">
              <h3 className="font-bold text-base text-amber-300">ربط زوج «الملخبط» من كلمات موجودة</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <select
                  value={pairWordA}
                  onChange={(e) => setPairWordA(e.target.value)}
                  className="min-h-[44px] px-3 rounded-xl bg-[#070E1A] border border-white/15 text-sm"
                >
                  <option value="">اختر الكلمة الأولى...</option>
                  {bank.words.filter((w) => w.status === 'approved').map((w) => (
                    <option key={w.id} value={w.id}>{w.text_ar} ({w.id})</option>
                  ))}
                </select>
                <select
                  value={pairWordB}
                  onChange={(e) => setPairWordB(e.target.value)}
                  className="min-h-[44px] px-3 rounded-xl bg-[#070E1A] border border-white/15 text-sm"
                >
                  <option value="">اختر الكلمة الثانية...</option>
                  {bank.words.filter((w) => w.status === 'approved').map((w) => (
                    <option key={w.id} value={w.id}>{w.text_ar} ({w.id})</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={pairReason}
                  onChange={(e) => setPairReason(e.target.value)}
                  placeholder="سبب التشابه والاختلاف (reason_ar)..."
                  className="sm:col-span-2 min-h-[44px] px-3 rounded-xl bg-[#070E1A] border border-white/15 text-sm"
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (!pairWordA || !pairWordB) return;
                    await adminFetch('/api/admin/pairs', 'POST', {
                      word_a_id: pairWordA,
                      word_b_id: pairWordB,
                      reason_ar: pairReason,
                    });
                    setPairReason('');
                    setStatusMsg('تم ربط الزوج بنجاح.');
                  }}
                  className="sm:col-span-2 min-h-[44px] rounded-xl bg-amber-400 hover:bg-amber-300 text-[#051019] font-bold text-sm cursor-pointer"
                >
                  حفظ الزوج المتشابه
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              {bank.confusing_pairs.map((p) => (
                <div key={p.id} className="p-4 rounded-xl bg-[#0B1526] border border-white/10 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-base text-slate-50">
                      {p.word_a_text || p.word_a_id} <span className="text-amber-300 mx-1">⇄</span> {p.word_b_text || p.word_b_id}
                    </span>
                    <span className="text-xs text-teal-300 tabular-nums">{p.id} · تقارب {p.similarity_level}/5</span>
                  </div>
                  <p className="text-xs text-slate-300">{p.reason_ar}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: Discussion Cards */}
        {tab === 'cards' && bank && (
          <div className="space-y-5">
            <div className="p-5 rounded-2xl bg-[#0B1526] border border-white/10 flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                value={newCardPrompt}
                onChange={(e) => setNewCardPrompt(e.target.value)}
                placeholder="اكتب سؤال بطاقة نقاش جديدة لا يكشف الكلمة..."
                className="flex-1 min-h-[44px] px-3 rounded-xl bg-[#070E1A] border border-white/15 text-sm"
              />
              <button
                type="button"
                onClick={async () => {
                  if (!newCardPrompt.trim()) return;
                  await adminFetch('/api/admin/cards', 'POST', { prompt_ar: newCardPrompt });
                  setNewCardPrompt('');
                  setStatusMsg('تمت إضافة بطاقة النقاش.');
                }}
                className="min-h-[44px] px-5 rounded-xl bg-teal-500 text-[#051019] font-bold text-sm cursor-pointer"
              >
                إضافة بطاقة
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {bank.discussion_cards.map((c) => (
                <div key={c.id} className="p-3.5 rounded-xl bg-[#0B1526] border border-white/10 space-y-1">
                  <p className="text-xs font-bold text-amber-300 tabular-nums">{c.id}</p>
                  <p className="text-sm text-slate-100">{c.prompt_ar}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: Import / Export */}
        {tab === 'import_export' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-[#0B1526] border border-white/10 space-y-4">
              <h3 className="font-display font-bold text-xl text-slate-50">تصدير بنك الكلمات</h3>
              <p className="text-sm text-slate-300">
                صدّر البنك الكامل بصيغة JSON المطابقة للمخطط الرسمي أو CSV للجداول.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleDownloadExport('json')}
                  className="min-h-[48px] px-4 rounded-xl bg-teal-500 text-[#051019] font-bold text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>تصدير JSON</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadExport('csv')}
                  className="min-h-[48px] px-4 rounded-xl bg-[#101E36] border border-white/15 text-slate-100 font-bold text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-amber-300" />
                  <span>تصدير CSV</span>
                </button>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#0B1526] border border-white/10 space-y-4">
              <h3 className="font-display font-bold text-xl text-slate-50">استيراد JSON أو CSV</h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setImportFormat('json')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    importFormat === 'json' ? 'bg-teal-500 text-[#051019]' : 'bg-[#101E36] text-slate-300'
                  }`}
                >
                  JSON
                </button>
                <button
                  type="button"
                  onClick={() => setImportFormat('csv')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    importFormat === 'csv' ? 'bg-teal-500 text-[#051019]' : 'bg-[#101E36] text-slate-300'
                  }`}
                >
                  CSV
                </button>
              </div>
              <textarea
                rows={5}
                value={importPayload}
                onChange={(e) => setImportPayload(e.target.value)}
                placeholder={importFormat === 'json' ? '{"words": [...]}' : 'id,text_ar,category,...'}
                dir="ltr"
                className="w-full p-3 rounded-xl bg-[#070E1A] border border-white/15 text-xs font-mono-code"
              />
              <button
                type="button"
                onClick={async () => {
                  const res = await adminFetch('/api/admin/import', 'POST', {
                    format: importFormat,
                    content: importPayload,
                  });
                  setStatusMsg(
                    `تم الاستيراد: أُضيف ${res.addedCount}، حُدّث ${res.updatedCount}، تجاهل المكرر ${res.skippedDuplicates}.`
                  );
                }}
                className="w-full min-h-[48px] rounded-xl bg-amber-400 text-[#051019] font-extrabold text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>تنفيذ الاستيراد الآمن (UPSERT)</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
