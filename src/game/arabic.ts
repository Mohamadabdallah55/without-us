/**
 * Arabic linguistic normalization & content safety utilities
 * Ported accurately from PDF Page 19 specification (normalize_arabic & FORBIDDEN_TERMS).
 */

export const FORBIDDEN_TERMS: readonly string[] = [
  'الله',
  'الرحمن',
  'الرحيم',
  'جبريل',
  'ميكائيل',
  'اسرافيل',
  'محمد صلى الله عليه وسلم',
  'عيسى',
  'موسى',
  'ابراهيم',
  'آية الكرسي',
  'سورة الفاتحة',
  'الكعبة المشرفة',
];

export const SENSITIVE_REVIEW_TERMS: readonly string[] = [
  'سب',
  'شتم',
  'سخرية',
  'قمار',
  'خمر',
  'تدخين',
  'أرجيلة',
  'شيشة',
];

/**
 * Normalizes Arabic text for deterministic duplicate detection:
 * - trims whitespace
 * - removes tashkeel (harakat) and tatweel
 * - normalizes alif variants (أ إ آ ٱ -> ا)
 * - normalizes waw hamza (ؤ -> و)
 * - normalizes ya/alif maqsura (ى ئ -> ي)
 * - normalizes ta marbuta / ha (ه -> ة at word boundaries or matching PDF rule)
 * - strips leading 'ال' from each token for root-level duplicate comparison
 */
export function normalizeArabic(text: string): string {
  let clean = text.trim();
  // Remove diacritics and tatweel
  clean = clean.replace(/[\u064B-\u065F\u0670\u0640]/g, '');
  // Normalize alif forms
  clean = clean.replace(/[أإآٱ]/g, 'ا');
  // Normalize hamza on waw
  clean = clean.replace(/[ؤ]/g, 'و');
  // Normalize ya / alif maqsura / hamza on ya
  clean = clean.replace(/[ىئ]/g, 'ي');
  // Normalize ha to ta marbuta at word ends (matching PDF normalize_arabic)
  clean = clean.replace(/ه(?=\s|$)/g, 'ة');
  // Collapse whitespace and strip leading definite article 'ال'
  const words = clean
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => (w.length > 3 ? w.replace(/^ال/, '') : w));
  return words.join(' ');
}

export function checkWordSafety(text: string): { safe: boolean; needsReview: boolean; reason?: string } {
  const normalized = normalizeArabic(text);
  for (const term of FORBIDDEN_TERMS) {
    const normTerm = normalizeArabic(term);
    if (normalized === normTerm || (normTerm.length >= 4 && normalized.includes(normTerm))) {
      return {
        safe: false,
        needsReview: true,
        reason: `يحتوي على لفظ خاضع للضوابط الشرعية أو التربوية (${term})`,
      };
    }
  }
  for (const term of SENSITIVE_REVIEW_TERMS) {
    const normTerm = normalizeArabic(term);
    if (normalized === normTerm || normalized.includes(normTerm)) {
      return {
        safe: true,
        needsReview: true,
        reason: `يحتاج مراجعة تربوية (${term})`,
      };
    }
  }
  return { safe: true, needsReview: false };
}

export function sanitizeUserText(input: string, maxLength = 40): string {
  return input
    .replace(/[<>&"'`\\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}
