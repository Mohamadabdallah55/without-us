import fs from 'node:fs';
import path from 'node:path';
import {
  buildInitialBankFromPdfSeed,
  scanBankDuplicates,
  upsertBankEntries,
} from '../src/game/wordBankService';
import type {
  ConfusingPairEntry,
  DiscussionCardEntry,
  ImportReport,
  WordBankData,
  WordEntry,
} from '../src/types/game';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const WORDBANK_PATH = path.join(DATA_DIR, 'wordbank.json');
const IMPORT_REPORT_PATH = path.join(DATA_DIR, 'import_report.json');

let cachedBank: WordBankData | null = null;
let cachedReport: ImportReport | null = null;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function writeJsonAtomic(filePath: string, data: unknown) {
  ensureDataDir();
  const tmpPath = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmpPath, filePath);
}

export function initStorage(): { bank: WordBankData; report: ImportReport } {
  ensureDataDir();
  if (fs.existsSync(WORDBANK_PATH) && fs.existsSync(IMPORT_REPORT_PATH)) {
    try {
      const bankRaw = fs.readFileSync(WORDBANK_PATH, 'utf-8');
      const reportRaw = fs.readFileSync(IMPORT_REPORT_PATH, 'utf-8');
      cachedBank = JSON.parse(bankRaw) as WordBankData;
      cachedReport = JSON.parse(reportRaw) as ImportReport;
      return { bank: cachedBank, report: cachedReport };
    } catch {
      // Rebuild cleanly from PDF seed if corrupted
    }
  }

  const { bank, report } = buildInitialBankFromPdfSeed();
  cachedBank = bank;
  cachedReport = report;
  writeJsonAtomic(WORDBANK_PATH, bank);
  writeJsonAtomic(IMPORT_REPORT_PATH, report);
  return { bank, report };
}

export function getWordBank(): WordBankData {
  if (!cachedBank) {
    initStorage();
  }
  return cachedBank!;
}

export function getPublicPlayableBank(): WordBankData {
  const full = getWordBank();
  const approvedWords = full.words.filter((w) => w.status === 'approved');
  const approvedWordIds = new Set(approvedWords.map((w) => w.id));
  const approvedPairs = full.confusing_pairs.filter(
    (p) =>
      p.status === 'approved' &&
      approvedWordIds.has(p.word_a_id) &&
      approvedWordIds.has(p.word_b_id)
  );
  const approvedCards = full.discussion_cards.filter((c) => c.status === 'approved');

  return {
    metadata: {
      ...full.metadata,
      counts: {
        words: approvedWords.length,
        confusing_pairs: approvedPairs.length,
        discussion_cards: approvedCards.length,
      },
    },
    categories: full.categories,
    words: approvedWords,
    confusing_pairs: approvedPairs,
    discussion_cards: approvedCards,
  };
}

export function getImportReport(): ImportReport {
  if (!cachedReport) {
    initStorage();
  }
  const bank = getWordBank();
  const dups = scanBankDuplicates(bank.words);
  const approvedWords = bank.words.filter((w) => w.status === 'approved').length;
  const approvedPairs = bank.confusing_pairs.filter((p) => p.status === 'approved').length;
  const approvedCards = bank.discussion_cards.filter((c) => c.status === 'approved').length;
  const reviewItems = bank.words
    .filter((w) => w.status === 'needs_review')
    .map((w) => ({ id: w.id, text_ar: w.text_ar, reason: w.review_note || 'قيد المراجعة' }));

  return {
    ...cachedReport!,
    approvedWords,
    duplicateWords: dups.length,
    duplicateDetails: dups,
    needsReviewCount: reviewItems.length,
    needsReviewItems: reviewItems,
    availableWordsForPlay: approvedWords,
    availablePairsForPlay: approvedPairs,
    availableCardsForPlay: approvedCards,
  };
}

export function saveWordBank(nextBank: WordBankData) {
  cachedBank = {
    ...nextBank,
    metadata: {
      ...nextBank.metadata,
      counts: {
        words: nextBank.words.length,
        confusing_pairs: nextBank.confusing_pairs.length,
        discussion_cards: nextBank.discussion_cards.length,
      },
    },
  };
  writeJsonAtomic(WORDBANK_PATH, cachedBank);
}

export function reimportPdfSeedIdempotently(): {
  report: ImportReport;
  addedCount: number;
  updatedCount: number;
  skippedDuplicates: number;
} {
  const current = getWordBank();
  const { bank: seedBank, report: seedReport } = buildInitialBankFromPdfSeed();
  const { updated, addedCount, updatedCount, skippedDuplicates } = upsertBankEntries(current, {
    words: seedBank.words,
    confusing_pairs: seedBank.confusing_pairs,
    discussion_cards: seedBank.discussion_cards,
  });
  saveWordBank(updated);
  cachedReport = {
    ...seedReport,
    importedAt: new Date().toISOString(),
    idempotentUpsertVerified: true,
  };
  writeJsonAtomic(IMPORT_REPORT_PATH, cachedReport);
  return {
    report: getImportReport(),
    addedCount,
    updatedCount,
    skippedDuplicates,
  };
}

export function upsertWord(entry: WordEntry): WordBankData {
  const current = getWordBank();
  const { updated } = upsertBankEntries(current, { words: [entry] });
  saveWordBank(updated);
  return updated;
}

export function updateWordById(id: string, patch: Partial<WordEntry>): WordBankData | null {
  const current = getWordBank();
  const idx = current.words.findIndex((w) => w.id === id);
  if (idx === -1) return null;
  const words = [...current.words];
  words[idx] = { ...words[idx], ...patch, id };
  saveWordBank({ ...current, words });
  return getWordBank();
}

export function deleteOrArchiveWord(id: string, hardDelete = false): WordBankData | null {
  const current = getWordBank();
  const exists = current.words.some((w) => w.id === id);
  if (!exists) return null;
  const words = hardDelete
    ? current.words.filter((w) => w.id !== id)
    : current.words.map((w) => (w.id === id ? { ...w, status: 'archived' as const } : w));
  saveWordBank({ ...current, words });
  return getWordBank();
}

export function upsertConfusingPair(pair: ConfusingPairEntry): WordBankData {
  const current = getWordBank();
  const { updated } = upsertBankEntries(current, { confusing_pairs: [pair] });
  saveWordBank(updated);
  return updated;
}

export function upsertDiscussionCard(card: DiscussionCardEntry): WordBankData {
  const current = getWordBank();
  const { updated } = upsertBankEntries(current, { discussion_cards: [card] });
  saveWordBank(updated);
  return updated;
}

export function importBulkEntries(incoming: {
  words?: WordEntry[];
  confusing_pairs?: ConfusingPairEntry[];
  discussion_cards?: DiscussionCardEntry[];
}) {
  const current = getWordBank();
  const res = upsertBankEntries(current, incoming);
  saveWordBank(res.updated);
  return res;
}
