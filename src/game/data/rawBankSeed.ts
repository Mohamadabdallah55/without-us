import type {
  AgeBand,
  CategoryMeta,
  ConfusingPairEntry,
  DiscussionCardEntry,
  WordEntry,
  WordRegion,
} from '../../types/game';

export const OFFICIAL_CATEGORIES: CategoryMeta[] = [
  {
    id: 'CAT_FOOD',
    name_ar: 'أكلات ومشروبات',
    target_count: 220,
    subcategories_summary: 'أطباق شعبية، حلويات، مشروبات، معجنات، فواكه وخضار',
    accentColor: '#F59E0B',
  },
  {
    id: 'CAT_JORDAN',
    name_ar: 'الحياة الأردنية',
    target_count: 180,
    subcategories_summary: 'مواصلات شعبية، معالم، عادات، مصطلحات يومية، طقس',
    accentColor: '#14B8A6',
  },
  {
    id: 'CAT_EDU',
    name_ar: 'المدرسة والجامعة',
    target_count: 180,
    subcategories_summary: 'قرطاسية، مرافق، مواد دراسية، حياة جامعية، امتحانات',
    accentColor: '#38BDF8',
  },
  {
    id: 'CAT_SEASONS',
    name_ar: 'رمضان والعيد والمناسبات',
    target_count: 150,
    subcategories_summary: 'أجواء رمضان، العيدين، مناسبات عائلية، نجاح وتخرج',
    accentColor: '#EAB308',
  },
  {
    id: 'CAT_ISLAMIC',
    name_ar: 'المسجد والعبادات والمفاهيم',
    target_count: 150,
    subcategories_summary: 'مرافق المسجد، عبادات، أخلاق، حلقات تحفيظ، آداب',
    accentColor: '#10B981',
  },
  {
    id: 'CAT_SPORTS',
    name_ar: 'الرياضة وكرة القدم',
    target_count: 180,
    subcategories_summary: 'مراكز وقوانين الكرة، رياضات فردية، لياقة، أدوات',
    accentColor: '#22C55E',
  },
  {
    id: 'CAT_NATURE',
    name_ar: 'الحيوانات والطبيعة',
    target_count: 160,
    subcategories_summary: 'حيوانات أليفة وبرية، طيور، نباتات، ظواهر طبيعية',
    accentColor: '#34D399',
  },
  {
    id: 'CAT_JOBS',
    name_ar: 'المهن والوظائف',
    target_count: 130,
    subcategories_summary: 'حرف يدوية، مهن طبية وهندسية، خدمات، تجارة',
    accentColor: '#60A5FA',
  },
  {
    id: 'CAT_TECH',
    name_ar: 'التكنولوجيا والألعاب',
    target_count: 160,
    subcategories_summary: 'أجهزة ذكية، برمجيات، ألعاب جماعية، شبكات، ملحقات',
    accentColor: '#2DD4BF',
  },
  {
    id: 'CAT_TRAVEL',
    name_ar: 'أماكن وسفر ومواصلات',
    target_count: 150,
    subcategories_summary: 'مركبات، مطارات، مرافق عامة، سياحة، طرق',
    accentColor: '#818CF8',
  },
  {
    id: 'CAT_ITEMS',
    name_ar: 'أدوات وأشياء يومية',
    target_count: 160,
    subcategories_summary: 'أثاث، أدوات مطبخ، ملابس، أدوات صيانة، مقتنيات',
    accentColor: '#FBBF24',
  },
  {
    id: 'CAT_FICTION',
    name_ar: 'شخصيات وأعمال خيالية',
    target_count: 80,
    subcategories_summary: 'رسوم متحركة قديمة، قصص تراثية، أبطال مغامرات',
    accentColor: '#A78BFA',
  },
  {
    id: 'CAT_SOCIAL',
    name_ar: 'مواقف وأنشطة اجتماعية',
    target_count: 100,
    subcategories_summary: 'زيارات، عمل تطوعي، رحلات، مواقف يومية، هوايات',
    accentColor: '#FB7185',
  },
];

interface WordGroupSpec {
  startId: number;
  category: string;
  subcategory: string;
  age_bands: AgeBand[];
  difficulty: number;
  region: WordRegion;
  words: string[];
}

const ALL_AGE_BANDS: AgeBand[] = [
  'children_7_10',
  'preteens_11_13',
  'teens_14_17',
  'adults_18_plus',
  'families_mixed',
];

const FAMILIES_UP: AgeBand[] = ['preteens_11_13', 'teens_14_17', 'adults_18_plus', 'families_mixed'];
const TEENS_UP: AgeBand[] = ['teens_14_17', 'adults_18_plus'];
const PRETEENS_UP: AgeBand[] = ['preteens_11_13', 'teens_14_17', 'adults_18_plus'];

const WORD_GROUPS: WordGroupSpec[] = [
  // CAT_FOOD (75: W_0001 - W_0075)
  {
    startId: 1,
    category: 'CAT_FOOD',
    subcategory: 'أطباق أردنية وشامية',
    age_bands: FAMILIES_UP,
    difficulty: 2,
    region: 'jordan_levant',
    words: [
      'منسف', 'مقلوبة', 'مسخن', 'مجدرة', 'ششبرك',
      'كبة لبنية', 'ورق عنب', 'محشي كوسا', 'ملوخية', 'فريكة',
      'مفتول', 'أوزي', 'قلاية بندورة', 'كفتة بالطحينية', 'صينية بطاطا',
    ],
  },
  {
    startId: 16,
    category: 'CAT_FOOD',
    subcategory: 'فطور وشعبيات',
    age_bands: ALL_AGE_BANDS,
    difficulty: 1,
    region: 'jordan_levant',
    words: [
      'فلافل', 'حمص', 'فول مدمس', 'فتة حمص', 'مسبحة',
      'شكشوكة', 'لبنة جرشية', 'زعتر وزيت', 'جبنة نابلسية', 'مقدوس',
      'زيتون أخضر', 'بيض مقلي', 'مفركة بطاطا', 'مناقيش زعتر', 'معجنات سبانخ',
    ],
  },
  {
    startId: 31,
    category: 'CAT_FOOD',
    subcategory: 'مشاوي وسندويشات',
    age_bands: PRETEENS_UP,
    difficulty: 2,
    region: 'pan_arab',
    words: [
      'شاورما دجاج', 'شاورما لحم', 'كباب مشوي', 'شقف', 'عرايس لحمة',
      'دجاج مسحب', 'فاهيتا', 'زنجر', 'برغر', 'بطاطا مقلية',
      'صاجية', 'مخشي', 'كرشات وفوارغ', 'سمك مشوي', 'صيادية سمك',
    ],
  },
  {
    startId: 46,
    category: 'CAT_FOOD',
    subcategory: 'حلويات شرقية',
    age_bands: ALL_AGE_BANDS,
    difficulty: 2,
    region: 'jordan_levant',
    words: [
      'كنافة ناعمة', 'كنافة خشنة', 'هريسة', 'وربات بالقشطة', 'عوامة',
      'أصابع زينب', 'كلاج', 'قطايف عصافيري', 'قطايف بالجوز', 'معمول بالتمر',
      'كعك العيد', 'حلاوة الجبن', 'رز بحليب', 'مهلبية', 'أم علي',
    ],
  },
  {
    startId: 61,
    category: 'CAT_FOOD',
    subcategory: 'مشروبات ومكونات',
    age_bands: FAMILIES_UP,
    difficulty: 2,
    region: 'jordan_levant',
    words: [
      'شاي بالميرمية', 'شاي بالنعناع', 'قهوة سادة', 'قهوة تركية', 'سحلب',
      'تمر هندي', 'خروب', 'عصير ليمون ونعناع', 'عيران', 'شنينة',
      'جميد كركي', 'سمن بلدي', 'سماق', 'طحينية', 'دبس رمان',
    ],
  },

  // CAT_JORDAN (60: W_0076 - W_0135)
  {
    startId: 76,
    category: 'CAT_JORDAN',
    subcategory: 'مواصلات وشوارع',
    age_bands: ['preteens_11_13', 'teens_14_17', 'adults_18_plus', 'families_mixed'],
    difficulty: 2,
    region: 'jordan_levant',
    words: [
      'سرفيس', 'باص الكوستر', 'الباص السريع', 'دوّار', 'تاكسي أصفر',
      'مجمع رغدان', 'مجمع الشمال', 'نفق', 'جسر عبدون', 'إشارة ضوئية',
      'مطب صناعي', 'أزمة سير', 'كراج', 'موقف باصات', 'كنترول الباص',
    ],
  },
  {
    startId: 91,
    category: 'CAT_JORDAN',
    subcategory: 'معالم ومناطق',
    age_bands: ALL_AGE_BANDS,
    difficulty: 2,
    region: 'jordan_levant',
    words: [
      'المدرج الروماني', 'وسط البلد', 'جبل القلعة', 'البتراء', 'وادي رم',
      'البحر الميت', 'خليج العقبة', 'قلعة عجلون', 'آثار جرش', 'أم قيس',
      'غابات دبين', 'شارع الرينبو', 'سبيل الحوريات', 'سد الملك طلال', 'نهر الأردن',
    ],
  },
  {
    startId: 106,
    category: 'CAT_JORDAN',
    subcategory: 'تفاصيل البيت والحارة',
    age_bands: FAMILIES_UP,
    difficulty: 2,
    region: 'jordan_levant',
    words: [
      'دكان الحارة', 'صوبة غاز', 'صوبة كاز', 'أسطوانة غاز', 'سيارة الغاز',
      'خزان ماء', 'سطح البيت', 'برندة', 'مضافة', 'ديوان العشيرة',
      'بيت شعر', 'دلة قهوة', 'مهباش', 'شماغ أحمر', 'عقال',
    ],
  },
  {
    startId: 121,
    category: 'CAT_JORDAN',
    subcategory: 'مواسم وعادات',
    age_bands: ['teens_14_17', 'adults_18_plus', 'families_mixed'],
    difficulty: 3,
    region: 'jordan_levant',
    words: [
      'موسم الزيتون', 'معصرة زيتون', 'تنكة زيت', 'طشة عائلية', 'سيران',
      'منخفض جوي', 'عطلة ثلج', 'خبز طابون', 'خبز شراك', 'كعك بالسمسم',
      'سوق الجمعة', 'حسبة الخضار', 'دفتر الدكان', 'عراضة', 'جاهة',
    ],
  },

  // CAT_EDU (55: W_0136 - W_0190)
  {
    startId: 136,
    category: 'CAT_EDU',
    subcategory: 'طابور ومرافق',
    age_bands: ['children_7_10', 'preteens_11_13', 'teens_14_17', 'families_mixed'],
    difficulty: 1,
    region: 'pan_arab',
    words: [
      'طابور الصباح', 'الإذاعة المدرسية', 'مقصف المدرسة', 'جرس الحصة', 'الفرصة',
      'ساحة المدرسة', 'غرفة المعلمين', 'مكتب المدير', 'مختبر العلوم', 'مختبر الحاسوب',
      'مكتبة المدرسة', 'لوح أبيض', 'طباشير', 'مساحة لوح', 'قلم خط',
    ],
  },
  {
    startId: 151,
    category: 'CAT_EDU',
    subcategory: 'قرطاسية وأدوات',
    age_bands: ALL_AGE_BANDS,
    difficulty: 1,
    region: 'pan_arab',
    words: [
      'حقيبة مدرسية', 'مقلمة', 'دفتر مربعات', 'دفتر مسطر', 'قلم رصاص',
      'مبراة', 'ممحاة', 'مسطرة', 'فرجار', 'منقلة',
      'ألوان خشبية', 'ملف بلاستيكي', 'جلاد كتب', 'طابعة ورق', 'آلة حاسبة',
    ],
  },
  {
    startId: 166,
    category: 'CAT_EDU',
    subcategory: 'دراسة وامتحانات',
    age_bands: TEENS_UP,
    difficulty: 2,
    region: 'jordan_levant',
    words: [
      'امتحان التوجيهي', 'رقم الجلوس', 'نتائج التوجيهي', 'شهادة مدرسية', 'واجب بيتي',
      'جدول الحصص', 'حصة الرياضة', 'حصة الفن', 'رحلة مدرسية', 'بطاقة جامعية',
      'مدرج جامعي', 'محاضرة', 'بحث تخرج', 'سكن طلابي', 'كافتيريا الجامعة',
    ],
  },
  {
    startId: 181,
    category: 'CAT_EDU',
    subcategory: 'تخصصات ومفاهيم',
    age_bands: TEENS_UP,
    difficulty: 3,
    region: 'pan_arab',
    words: [
      'منحة دراسية', 'فصل صيفي', 'معدل تراكمي', 'حفل تخرج', 'روب التخرج',
      'دفتر حضور وغياب', 'مراقب الامتحان', 'ورقة إجابة', 'تسميع غيبي', 'مشروع جماعي',
    ],
  },

  // CAT_SEASONS (50: W_0191 - W_0240)
  {
    startId: 191,
    category: 'CAT_SEASONS',
    subcategory: 'أجواء رمضان',
    age_bands: ALL_AGE_BANDS,
    difficulty: 1,
    region: 'islamic_general',
    words: [
      'مدفع الإفطار', 'وجبة السحور', 'فانوس رمضان', 'هلال رمضان', 'إمساكية رمضان',
      'تمر ولبن', 'شوربة عدس', 'سمبوسك', 'صلاة التراويح', 'قيام الليل',
      'العشر الأواخر', 'مسحراتي', 'مائدة الرحمن', 'طرود الخير', 'زكاة الفطر',
      'ختمة قرآن', 'دعاء الإفطار', 'زينة رمضان',
    ],
  },
  {
    startId: 209,
    category: 'CAT_SEASONS',
    subcategory: 'العيدين والفرح',
    age_bands: ALL_AGE_BANDS,
    difficulty: 1,
    region: 'islamic_general',
    words: [
      'تكبيرات العيد', 'صلاة العيد', 'عيدية', 'ملابس العيد', 'قهوة العيد',
      'شوكولاتة العيد', 'زيارة الأقارب', 'صلة الرحم', 'أضحية العيد', 'عيد الفطر',
      'عيد الأضحى', 'مراجيح العيد', 'بالونات', 'بطاقة تهنئة', 'بخور وعطر',
      'جمعة العائلة', 'فطور العيد',
    ],
  },
  {
    startId: 226,
    category: 'CAT_SEASONS',
    subcategory: 'مناسبات اجتماعية',
    age_bands: FAMILIES_UP,
    difficulty: 2,
    region: 'pan_arab',
    words: [
      'حفل زفاف', 'فرقة أناشيد', 'كوشة العروس', 'بطاقة دعوة', 'حلوان النجاح',
      'عقيقة المولود', 'استقبال الحجاج', 'ماء زمزم', 'هدايا العمرة', 'ذكرى الهجرة النبوية',
      'يوم عرفة', 'صيام عاشوراء', 'تهنئة بالمنزل الجديد', 'زيارة المريض', 'عزيمة عشاء',
    ],
  },

  // CAT_ISLAMIC (50: W_0241 - W_0290)
  {
    startId: 241,
    category: 'CAT_ISLAMIC',
    subcategory: 'مرافق المسجد',
    age_bands: ALL_AGE_BANDS,
    difficulty: 1,
    region: 'islamic_general',
    words: [
      'مئذنة', 'محراب', 'منبر الخطبة', 'سجادة صلاة', 'مكان الوضوء',
      'رف الأحذية', 'حامل المصحف', 'مكتبة المسجد', 'ساعة مواقيت الصلاة', 'مكبر الصوت',
      'قبة المسجد', 'ساحة المسجد', 'حلقة تحفيظ', 'إمام المسجد', 'المؤذن',
      'خادم المسجد', 'خطيب الجمعة', 'درس علم',
    ],
  },
  {
    startId: 259,
    category: 'CAT_ISLAMIC',
    subcategory: 'عبادات وشعائر',
    age_bands: PRETEENS_UP,
    difficulty: 2,
    region: 'islamic_general',
    words: [
      'الوضوء', 'التيمم', 'السواك', 'الأذان', 'الإقامة',
      'صلاة الفجر', 'صلاة الجماعة', 'صلاة الجمعة', 'صلاة الاستسقاء', 'سجود التلاوة',
      'سجود السهو', 'أذكار الصباح', 'أذكار المساء', 'التسبيح', 'الصدقة الجارية',
      'كفالة يتيم', 'إماطة الأذى',
    ],
  },
  {
    startId: 276,
    category: 'CAT_ISLAMIC',
    subcategory: 'أخلاق ومفاهيم',
    age_bands: ALL_AGE_BANDS,
    difficulty: 2,
    region: 'islamic_general',
    words: [
      'بر الوالدين', 'الأمانة', 'الصدق', 'إكرام الضيف', 'حق الجار',
      'التسامح', 'عيادة المريض', 'إفشاء السلام', 'الكلمة الطيبة', 'حفظ اللسان',
      'غض البصر', 'التواضع', 'الإيثار', 'الوفاء بالعهد', 'طلب العلم',
    ],
  },

  // CAT_SPORTS (55: W_0291 - W_0345)
  {
    startId: 291,
    category: 'CAT_SPORTS',
    subcategory: 'كرة القدم والمراكز',
    age_bands: PRETEENS_UP,
    difficulty: 2,
    region: 'pan_arab',
    words: [
      'حارس مرمى', 'مهاجم صريح', 'خط وسط', 'قلب دفاع', 'ظهير أيمن',
      'حكم الساحة', 'حكم الراية', 'مدرب الفريق', 'دكة البدلاء', 'شارة القيادة',
      'ركلة جزاء', 'ركلة ركنية', 'رمية تماس', 'ركلة حرة', 'مصيدة التسلل',
      'بطاقة صفراء', 'بطاقة حمراء', 'وقت بدل ضائع', 'أشواط إضافية', 'تقنية الفار',
    ],
  },
  {
    startId: 311,
    category: 'CAT_SPORTS',
    subcategory: 'ملاعب وتجهيزات',
    age_bands: ALL_AGE_BANDS,
    difficulty: 2,
    region: 'jordan_levant',
    words: [
      'ملعب خماسي', 'استاد عمان الدولي', 'شبك المرمى', 'صافرة الحكم', 'حذاء رياضي',
      'قفازات الحارس', 'واقي الساق', 'قميص المنتخب', 'كأس البطولة', 'ميدالية ذهبية',
      'مدرجات الجماهير', 'معلق رياضي', 'إحماء اللاعبين', 'تمريرة حاسمة', 'ضربة مقصية',
      'هدف ذهبي', 'هاتريك', 'صافرة النهاية',
    ],
  },
  {
    startId: 329,
    category: 'CAT_SPORTS',
    subcategory: 'رياضات متنوعة',
    age_bands: ALL_AGE_BANDS,
    difficulty: 2,
    region: 'pan_arab',
    words: [
      'كرة السلة', 'كرة الطائرة', 'تنس الطاولة', 'السباحة', 'تايكوندو',
      'كاراتيه', 'سباق الجري', 'ركوب الخيل', 'ركوب الدراجات', 'رفع الأثقال',
      'الرماية', 'صالة رياضية', 'حبل القفز', 'ساعة إيقاف', 'ماراثون',
      'رمي الرمح', 'القفز العالي',
    ],
  },

  // CAT_NATURE (50: W_0346 - W_0395)
  {
    startId: 346,
    category: 'CAT_NATURE',
    subcategory: 'حيوانات وطيور',
    age_bands: ALL_AGE_BANDS,
    difficulty: 1,
    region: 'pan_arab',
    words: [
      'جمل', 'حصان عربي', 'خروف', 'ماعز', 'غزال',
      'المها العربي', 'أسد', 'نمر', 'فهد', 'ذئب',
      'ثعلب', 'أرنب', 'قنفذ', 'سلحفاة', 'صقر',
      'نسر', 'حمامة', 'عصفور دوري', 'هدهد', 'نعامة',
    ],
  },
  {
    startId: 366,
    category: 'CAT_NATURE',
    subcategory: 'كائنات ونباتات',
    age_bands: ALL_AGE_BANDS,
    difficulty: 2,
    region: 'jordan_levant',
    words: [
      'نحلة', 'خلية نحل', 'نملة', 'فراشة', 'دلفين',
      'حوت', 'سمكة قرش', 'شجرة زيتون', 'شجرة نخيل', 'شجرة صنوبر',
      'شجرة تين', 'زهرة السوسنة السوداء', 'ميرمية', 'بابونج', 'صبار',
    ],
  },
  {
    startId: 381,
    category: 'CAT_NATURE',
    subcategory: 'ظواهر وتضاريس',
    age_bands: ALL_AGE_BANDS,
    difficulty: 1,
    region: 'pan_arab',
    words: [
      'مطر غزير', 'ثلج أبيض', 'حبات البرد', 'ضباب كثيف', 'قوس المطر',
      'برق', 'رعد', 'نسيم الفجر', 'صحراء', 'وادي',
      'جبل', 'ينبوع ماء', 'شلال', 'كهف', 'بدر مكتمل',
    ],
  },

  // CAT_JOBS (45: W_0396 - W_0440)
  {
    startId: 396,
    category: 'CAT_JOBS',
    subcategory: 'مهن طبية وتعليمية وهندسية',
    age_bands: ALL_AGE_BANDS,
    difficulty: 2,
    region: 'pan_arab',
    words: [
      'طبيب أسنان', 'طبيب أطفال', 'جراح', 'صيدلي', 'ممرض',
      'مسعف', 'معلم مدرسة', 'أستاذ جامعي', 'مهندس معماري', 'مهندس مدني',
      'مبرمج حاسوب', 'محاسب', 'محامي', 'قاضي', 'صحفي',
      'مصور فوتوغرافي', 'مترجم', 'طيار', 'قبطان سفينة', 'مراقب جوي',
    ],
  },
  {
    startId: 416,
    category: 'CAT_JOBS',
    subcategory: 'حرف وخدمات يومية',
    age_bands: ALL_AGE_BANDS,
    difficulty: 2,
    region: 'jordan_levant',
    words: [
      'نجار', 'حداد', 'كهربائي', 'سباك (مواسرجي)', 'دهان',
      'بناء', 'ميكانيكي سيارات', 'خباز', 'حلواني', 'طباخ',
      'جزار (لحام)', 'خياط', 'حلاق', 'مزارع', 'بائع خضار',
      'سائق باص', 'رجل إطفاء', 'شرطي سير', 'عامل وطن', 'ساعي بريد',
      'خطاط', 'صائغ ذهب', 'أمين مكتبة', 'حارس أمن', 'دليل سياحي',
    ],
  },

  // CAT_TECH (50: W_0441 - W_0490)
  {
    startId: 441,
    category: 'CAT_TECH',
    subcategory: 'أجهزة وملحقات',
    age_bands: ALL_AGE_BANDS,
    difficulty: 2,
    region: 'pan_arab',
    words: [
      'هاتف ذكي', 'جهاز لوحي', 'حاسوب محمول', 'شاشة عرض', 'لوحة مفاتيح',
      'فأرة حاسوب', 'سماعات رأس', 'سماعة بلوتوث', 'شاحن متنقل (باور بانك)', 'سلك شحن',
      'ذاكرة فلاش', 'قرص صلب', 'كاميرا رقمية', 'ساعة ذكية', 'جهاز تحكم (ريموت)',
      'راوتر إنترنت', 'طابعة ليزر', 'ميكروفون', 'جهاز عرض (بروجكتر)', 'بطارية',
    ],
  },
  {
    startId: 461,
    category: 'CAT_TECH',
    subcategory: 'برمجيات وألعاب',
    age_bands: PRETEENS_UP,
    difficulty: 2,
    region: 'pan_arab',
    words: [
      'شبكة واي فاي', 'كلمة مرور', 'رمز استجابة سريعة (QR)', 'رسالة صوتية', 'مكالمة فيديو',
      'مجموعة واتساب', 'خرائط جوجل', 'منبه الهاتف', 'وضع الطيران', 'تحديث النظام',
      'ذكاء اصطناعي', 'روبوت', 'لعبة الشطرنج', 'لعبة الضامة', 'مكعب روبيك',
      'ألغاز الكلمات المتقاطعة', 'تركيب الصور (بازل)', 'طاولة الزهر', 'لعبة الكرات الزجاجية (قلول)', 'الحجلة',
      'الغميضة', 'شد الحبل', 'سباق الأكياس', 'بلايستيشن', 'يد تحكم',
      'واقع افتراضي', 'بث مباشر', 'ملف بي دي إف', 'بريد إلكتروني', 'لقطة شاشة',
    ],
  },

  // CAT_TRAVEL (45: W_0491 - W_0535)
  {
    startId: 491,
    category: 'CAT_TRAVEL',
    subcategory: 'سفر ومطارات',
    age_bands: ALL_AGE_BANDS,
    difficulty: 2,
    region: 'jordan_levant',
    words: [
      'مطار الملكة علياء', 'جواز سفر', 'تذكرة طيران', 'حقيبة سفر', 'صالة الانتظار',
      'بوابة الصعود', 'حزام الأمتعة', 'طائرة ركاب', 'مروحية', 'قطار الحجاز',
      'مترو الأنفاق', 'سفينة', 'قارب زجاجي', 'دراجة هوائية', 'دراجة نارية',
      'سيارة إسعاف', 'سيارة إطفاء', 'شاحنة نقل', 'محطة وقود', 'استراحة المسافرين',
      'حدود برية', 'تأشيرة سفر',
    ],
  },
  {
    startId: 513,
    category: 'CAT_TRAVEL',
    subcategory: 'مرافق عامة',
    age_bands: ALL_AGE_BANDS,
    difficulty: 2,
    region: 'jordan_levant',
    words: [
      'مستشفى', 'مركز صحي', 'صيدلية مناوبة', 'مخبز آلي', 'سوق تجاري (مول)',
      'حديقة عامة', 'مدينة ملاهي', 'متحف السيارات الملكي', 'مكتب بريد', 'محطة قطار',
      'ميناء بحري', 'فندق', 'شاليه', 'مخيم كشفي', 'مكتبة عامة',
      'مركز ثقافي', 'قاعة مؤتمرات', 'نفق مشاة', 'جسر معلق', 'منارة بحرية',
      'بوصلة', 'خريطة ورقية', 'مظلة سفر',
    ],
  },

  // CAT_ITEMS (50: W_0536 - W_0585)
  {
    startId: 536,
    category: 'CAT_ITEMS',
    subcategory: 'أدوات منزل ومطبخ',
    age_bands: ALL_AGE_BANDS,
    difficulty: 1,
    region: 'pan_arab',
    words: [
      'إبريق شاي', 'ركوة قهوة', 'ترمس قهوة', 'فنجان', 'طنجرة ضغط',
      'مقلاة', 'صينية فرن', 'مصفاة', 'ملعقة خشب', 'شوكة',
      'سكين مطبخ', 'لوح تقطيع', 'ثلاجة', 'غسالة ملابس', 'فرن غاز',
      'ميكروويف', 'خلاط كهربائي', 'مكنسة كهربائية', 'مكواة ملابس', 'مروحة سقف',
      'مكيف هواء', 'مدفأة كهربائية', 'غلاية ماء', 'سلة مهملات', 'مفرش طاولة',
    ],
  },
  {
    startId: 561,
    category: 'CAT_ITEMS',
    subcategory: 'مقتنيات وأثاث',
    age_bands: ALL_AGE_BANDS,
    difficulty: 1,
    region: 'pan_arab',
    words: [
      'ميدالية مفاتيح', 'محفظة نقود', 'نظارة طبية', 'نظارة شمسية', 'ساعة يد',
      'مظلة مطر', 'مصباح يدوي', 'مقص أظافر', 'مشط شعر', 'فرشاة أسنان',
      'معجون أسنان', 'منشفة', 'صابونة', 'مرآة', 'وسادة',
      'بطانية شتوية', 'خزانة ملابس', 'مكتب دراسة', 'كرسي خشبي', 'سجادة غرفة',
      'ستارة نافذة', 'قفل باب', 'مفك براغي', 'مطرقة', 'شريط لاصق',
    ],
  },

  // CAT_FICTION (30: W_0586 - W_0615)
  {
    startId: 586,
    category: 'CAT_FICTION',
    subcategory: 'كرتون وقصص تراثية',
    age_bands: ['children_7_10', 'preteens_11_13', 'teens_14_17', 'families_mixed'],
    difficulty: 2,
    region: 'pan_arab',
    words: [
      'المحقق كونان', 'كابتن ماجد', 'بسام الكابتن ماجد', 'عدنان ولينا', 'القبطان نامق',
      'عبسي', 'سالي', 'هايدي', 'ريمي', 'عهد الأصدقاء',
      'سندباد البحري', 'علاء الدين', 'علي بابا', 'جحا', 'الشاطر حسن',
      'سلاحف النينجا', 'توم وجيري', 'سبونج بوب', 'سيمبا الأسد الملك', 'ماوكلي فتى الأدغال',
      'روبن هود', 'زورو', 'بابار فيل', 'النمر الوردي', 'نقار الخشب',
      'السنافر', 'بابا سنفور', 'شرشبيل', 'جزيرة الكنز', 'القرصان سيلفر',
    ],
  },

  // CAT_SOCIAL (35: W_0616 - W_0650)
  {
    startId: 616,
    category: 'CAT_SOCIAL',
    subcategory: 'أنشطة ومواقف',
    age_bands: ALL_AGE_BANDS,
    difficulty: 2,
    region: 'pan_arab',
    words: [
      'حفلة شواء', 'رحلة تخييم', 'عمل تطوعي', 'حملة تنظيف', 'التبرع بالدم',
      'مسابقة ثقافية', 'البحث عن المفقودات', 'انقطاع الكهرباء', 'انتظار الباص', 'الضياع في السوق',
      'نسيان المفتاح', 'تأخر عن الموعد', 'مفاجأة سارة', 'استقبال مسافر', 'توديع صديق',
      'صلح بين متخاصمين', 'اجتماع عائلي', 'سهرة سمر', 'قراءة قصة قبل النوم', 'ترتيب الغرفة',
      'مساعدة الجيران', 'قطف الزيتون', 'سقي الأشجار', 'إطعام القطط', 'زيارة الجد والجدة',
      'التسوق للعيد', 'تجهيز حقيبة السفر', 'التقاط صورة جماعية', 'تعلم السباحة', 'حفظ سورة جديدة',
      'المشاركة في الإذاعة', 'الفوز بجائزة', 'استعارة كتاب', 'كتابة رسائل ورقية', 'إعداد الشاي على الحطب',
    ],
  },
];

export function buildSeedWords(): WordEntry[] {
  const result: WordEntry[] = [];
  for (const group of WORD_GROUPS) {
    group.words.forEach((text_ar, idx) => {
      const num = group.startId + idx;
      const id = `W_${String(num).padStart(4, '0')}`;
      result.push({
        id,
        text_ar,
        category: group.category,
        subcategory: group.subcategory,
        age_bands: group.age_bands,
        difficulty: group.difficulty,
        tags: [group.subcategory],
        region: group.region,
        status: 'approved',
      });
    });
  }
  return result;
}

export interface RawPairSpec {
  id: string;
  word_a_id: string;
  word_a_text: string;
  word_b_id: string;
  word_b_text: string;
  category: string;
  similarity_level: number;
  reason_ar: string;
}

/**
 * All 60 verified Confusing Pairs explicitly present in PDF pages 12-16 (CP_001 to CP_060).
 * Pairs CP_061..CP_150 are NOT present in the PDF document and are NOT fabricated.
 */
export const RAW_CONFUSING_PAIRS: RawPairSpec[] = [
  {
    id: 'CP_001', word_a_id: 'W_0001', word_a_text: 'منسف', word_b_id: 'W_0002', word_b_text: 'مقلوبة',
    category: 'CAT_FOOD', similarity_level: 4,
    reason_ar: 'كلاهما طبق رئيسي بالأرز واللحم أو الدجاج في الولائم، لكن المنسف بالجميد واللبن والمقلوبة بالخضار المقلية وتُقلب في الصينية.',
  },
  {
    id: 'CP_002', word_a_id: 'W_0046', word_a_text: 'كنافة ناعمة', word_b_id: 'W_0048', word_b_text: 'هريسة',
    category: 'CAT_FOOD', similarity_level: 4,
    reason_ar: 'كلاهما حلوى شرقية بالقطر وتقدم في السدر، لكن الكنافة محشوة بالجبنة النابلسية وساخنة بينما الهريسة من السميد واللوز بدون جبن.',
  },
  {
    id: 'CP_003', word_a_id: 'W_0061', word_a_text: 'شاي بالميرمية', word_b_id: 'W_0062', word_b_text: 'شاي بالنعناع',
    category: 'CAT_FOOD', similarity_level: 5,
    reason_ar: 'نفس المشروب الساخن اليومي، ويختلفان في العشبة المضافة (الميرمية الشتوية الدافئة مقابل النعناع المنعش).',
  },
  {
    id: 'CP_004', word_a_id: 'W_0016', word_a_text: 'فلافل', word_b_id: 'W_0017', word_b_text: 'حمص',
    category: 'CAT_FOOD', similarity_level: 4,
    reason_ar: 'مصنوعان من نفس الحبوب ويباعان في نفس المطعم الشعبي صباحًا، لكن الفلافل أقراص مقلية والحمص مهروس بالطحينية والزيت.',
  },
  {
    id: 'CP_005', word_a_id: 'W_0031', word_a_text: 'شاورما دجاج', word_b_id: 'W_0037', word_b_text: 'فاهيتا',
    category: 'CAT_FOOD', similarity_level: 4,
    reason_ar: 'كلاهما شرائح دجاج متبلة في سندويش، لكن الشاورما على سيخ عمودي مع المثومة والفاهيتا مع الفلفل الحلو والجبنة.',
  },
  {
    id: 'CP_006', word_a_id: 'W_0007', word_a_text: 'ورق عنب', word_b_id: 'W_0008', word_b_text: 'محشي كوسا',
    category: 'CAT_FOOD', similarity_level: 5,
    reason_ar: 'يُطبخان غالبًا في طنجرة واحدة بنفس حشوة الأرز واللحم، لكن الأول ملفوف بأوراق العنب والثاني محفور داخل الكوسا.',
  },
  {
    id: 'CP_007', word_a_id: 'W_0063', word_a_text: 'قهوة سادة', word_b_id: 'W_0064', word_b_text: 'قهوة تركية',
    category: 'CAT_FOOD', similarity_level: 4,
    reason_ar: 'كلاهما قهوة تقدم في فناجين صغيرة، لكن السادة عربية بالهيل في الدلة للمناسبات والتركية تغلى بالركوة مع وجه رغوي.',
  },
  {
    id: 'CP_008', word_a_id: 'W_0052', word_a_text: 'قطايف عصافيري', word_b_id: 'W_0053', word_b_text: 'قطايف بالجوز',
    category: 'CAT_FOOD', similarity_level: 5,
    reason_ar: 'نفس حلوى رمضان الشهيرة، لكن العصافيري صغيرة محشوة بالقشطة دون قلي أو شوي، والثانية تغلق وتقلى أو تشوى.',
  },
  {
    id: 'CP_009', word_a_id: 'W_0128', word_a_text: 'خبز طابون', word_b_id: 'W_0129', word_b_text: 'خبز شراك',
    category: 'CAT_JORDAN', similarity_level: 4,
    reason_ar: 'خبز تراثي أردني شهير، لكن الطابون سميك يخبز على حجارة ساخنة والشراك رقيق جدًا يخبز على صاج محدب.',
  },
  {
    id: 'CP_010', word_a_id: 'W_0076', word_a_text: 'سرفيس', word_b_id: 'W_0079', word_b_text: 'تاكسي أصفر',
    category: 'CAT_JORDAN', similarity_level: 4,
    reason_ar: 'سيارتا أجرة للركاب، لكن السرفيس أبيض يلتزم بخط محدد ويتشاركه الركاب، والتاكسي الأصفر يتجه لأي مكان حسب الطلب.',
  },
  {
    id: 'CP_011', word_a_id: 'W_0077', word_a_text: 'باص الكوستر', word_b_id: 'W_0078', word_b_text: 'الباص السريع',
    category: 'CAT_JORDAN', similarity_level: 4,
    reason_ar: 'حافلتان للنقل العام في الأردن، لكن الكوستر تقليدي بوجود الكنترول والباص السريع حديث بمسار مخصص ودفع إلكتروني.',
  },
  {
    id: 'CP_012', word_a_id: 'W_0107', word_a_text: 'صوبة غاز', word_b_id: 'W_0108', word_b_text: 'صوبة كاز',
    category: 'CAT_JORDAN', similarity_level: 5,
    reason_ar: 'وسيلتا التدفئة الأشهر في شتاء الأردن، الأولى تعمل بأسطوانة الغاز وثلاث لوحات، والثانية أسطوانية بفتيل ورائحة كاز.',
  },
  {
    id: 'CP_013', word_a_id: 'W_0095', word_a_text: 'البحر الميت', word_b_id: 'W_0096', word_b_text: 'خليج العقبة',
    category: 'CAT_JORDAN', similarity_level: 4,
    reason_ar: 'المسطحان المائيان السياحيان في الأردن، لكن البحر الميت شديد الملوحة بلا أسماك والعقبة على البحر الأحمر بمياهها ومرجانها.',
  },
  {
    id: 'CP_014', word_a_id: 'W_0097', word_a_text: 'قلعة عجلون', word_b_id: 'W_0098', word_b_text: 'آثار جرش',
    category: 'CAT_JORDAN', similarity_level: 4,
    reason_ar: 'معلمان تاريخيان متجاوران شمال الأردن، لكن عجلون قلعة إسلامية فوق جبل وجرش مدينة أعمدة ومسارح رومانية.',
  },
  {
    id: 'CP_015', word_a_id: 'W_0082', word_a_text: 'نفق', word_b_id: 'W_0083', word_b_text: 'جسر عبدون',
    category: 'CAT_JORDAN', similarity_level: 3,
    reason_ar: 'كلاهما لتسهيل حركة السيارات دون إشارات، لكن النفق تحت الأرض والجسر معلق في الهواء.',
  },
  {
    id: 'CP_016', word_a_id: 'W_0138', word_a_text: 'مقصف المدرسة', word_b_id: 'W_0180', word_b_text: 'كافتيريا الجامعة',
    category: 'CAT_EDU', similarity_level: 4,
    reason_ar: 'مكان شراء الطعام أثناء الدراسة، لكن المقصف نافذة صغيرة في الفرصة والكافتيريا صالة واسعة بطاولات ووجبات.',
  },
  {
    id: 'CP_017', word_a_id: 'W_0148', word_a_text: 'لوح أبيض', word_b_id: 'W_0154', word_b_text: 'دفتر مسطر',
    category: 'CAT_EDU', similarity_level: 3,
    reason_ar: 'كلاهما يُكتب عليه في الحصة، لكن اللوح معلق على الحائط يكتب عليه المعلم والدفتر أمام الطالب.',
  },
  {
    id: 'CP_018', word_a_id: 'W_0155', word_a_text: 'قلم رصاص', word_b_id: 'W_0150', word_b_text: 'قلم خط',
    category: 'CAT_EDU', similarity_level: 4,
    reason_ar: 'أداتا كتابة مدرسية، لكن قلم الرصاص يُمحى ويُبرى، وقلم الخط بالحبر السائل ولا يُمحى بالممحاة.',
  },
  {
    id: 'CP_019', word_a_id: 'W_0158', word_a_text: 'فرجار', word_b_id: 'W_0159', word_b_text: 'منقلة',
    category: 'CAT_EDU', similarity_level: 4,
    reason_ar: 'أداتان داخل علبة الهندسة، لكن الفرجار معدني لرسم الدوائر والمنقلة بلاستيكية نصف دائرية لقياس الزوايا.',
  },
  {
    id: 'CP_020', word_a_id: 'W_0145', word_a_text: 'مختبر العلوم', word_b_id: 'W_0146', word_b_text: 'مختبر الحاسوب',
    category: 'CAT_EDU', similarity_level: 4,
    reason_ar: 'قاعتان للتطبيق العملي في المدرسة، الأولى فيها أنابيب ومجاهر وتجارب، والثانية فيها شاشات وأجهزة حاسوب.',
  },
  {
    id: 'CP_021', word_a_id: 'W_0192', word_a_text: 'وجبة السحور', word_b_id: 'W_0225', word_b_text: 'فطور العيد',
    category: 'CAT_SEASONS', similarity_level: 3,
    reason_ar: 'وجبتان مرتبطتان برمضان، لكن السحور قبل الفجر استعدادًا للصيام، وفطور العيد صباح يوم العيد إيذانًا بانتهاء الصيام.',
  },
  {
    id: 'CP_022', word_a_id: 'W_0220', word_a_text: 'عيد الفطر', word_b_id: 'W_0221', word_b_text: 'عيد الأضحى',
    category: 'CAT_SEASONS', similarity_level: 5,
    reason_ar: 'العيدان الإسلاميان بصلاة العيد والزيارات، لكن الفطر بعد رمضان بصدقة الفطر والكعك، والأضحى في الحج بذبح الأضاحي.',
  },
  {
    id: 'CP_023', word_a_id: 'W_0200', word_a_text: 'صلاة التراويح', word_b_id: 'W_0210', word_b_text: 'صلاة العيد',
    category: 'CAT_SEASONS', similarity_level: 4,
    reason_ar: 'صلاتان جامعتان تشهدان إقبالًا كبيرًا، لكن التراويح ليلًا بعد العشاء طوال رمضان، وصلاة العيد صباحًا بعد الشروق مع خطبة.',
  },
  {
    id: 'CP_024', word_a_id: 'W_0205', word_a_text: 'زكاة الفطر', word_b_id: 'W_0273', word_b_text: 'الصدقة الجارية',
    category: 'CAT_ISLAMIC', similarity_level: 4,
    reason_ar: 'كلاهما إنفاق في سبيل الله، لكن زكاة الفطر واجبة بمقدار محدد قبل صلاة العيد، والصدقة الجارية تطوعية يدوم نفعها.',
  },
  {
    id: 'CP_025', word_a_id: 'W_0262', word_a_text: 'الأذان', word_b_id: 'W_0263', word_b_text: 'الإقامة',
    category: 'CAT_ISLAMIC', similarity_level: 5,
    reason_ar: 'نداءان للصلاة بنفس الألفاظ تقريبًا، لكن الأذان لدخول الوقت من المئذنة والإقامة داخل الصفوف لبدء الفريضة فورًا.',
  },
  {
    id: 'CP_026', word_a_id: 'W_0242', word_a_text: 'محراب', word_b_id: 'W_0243', word_b_text: 'منبر الخطبة',
    category: 'CAT_ISLAMIC', similarity_level: 4,
    reason_ar: 'ركنان في مقدمة المسجد، لكن المحراب تجويف يقف فيه الإمام للصلاة والمنبر درجات يرتقيها الخطيب يوم الجمعة.',
  },
  {
    id: 'CP_027', word_a_id: 'W_0259', word_a_text: 'الوضوء', word_b_id: 'W_0260', word_b_text: 'التيمم',
    category: 'CAT_ISLAMIC', similarity_level: 4,
    reason_ar: 'طهارة مشروعة للصلاة، لكن الوضوء بغسل الأعضاء بالماء والتيمم بمسح الوجه واليدين بالتراب الطاهر عند فقد الماء.',
  },
  {
    id: 'CP_028', word_a_id: 'W_0268', word_a_text: 'سجود التلاوة', word_b_id: 'W_0269', word_b_text: 'سجود السهو',
    category: 'CAT_ISLAMIC', similarity_level: 4,
    reason_ar: 'سجود مشروع خارج الركعات المعتادة، لكن الأول عند قراءة آية سجدة والثاني في آخر الصلاة لجبر نسيان أو شك.',
  },
  {
    id: 'CP_029', word_a_id: 'W_0296', word_a_text: 'حكم الساحة', word_b_id: 'W_0297', word_b_text: 'حكم الراية',
    category: 'CAT_SPORTS', similarity_level: 4,
    reason_ar: 'كلاهما يدير مباراة كرة القدم، لكن حكم الساحة يجري داخل الملعب بالصافرة والبطاقات، وحكم الراية على الخط لكشف التسلل.',
  },
  {
    id: 'CP_030', word_a_id: 'W_0301', word_a_text: 'ركلة جزاء', word_b_id: 'W_0304', word_b_text: 'ركلة حرة',
    category: 'CAT_SPORTS', similarity_level: 4,
    reason_ar: 'مخالفتان في كرة القدم، لكن ركلة الجزاء من نقطة قريبة في مواجهة الحارس فقط، والركلة الحرة من خارج المنطقة بوجود حائط صد.',
  },
  {
    id: 'CP_031', word_a_id: 'W_0306', word_a_text: 'بطاقة صفراء', word_b_id: 'W_0307', word_b_text: 'بطاقة حمراء',
    category: 'CAT_SPORTS', similarity_level: 5,
    reason_ar: 'عقوبتان يرفعهما الحكم، لكن الصفراء إنذار أول يسمح بإكمال اللعب، والحمراء طرد فوري خارج الملعب.',
  },
  {
    id: 'CP_032', word_a_id: 'W_0311', word_a_text: 'ملعب خماسي', word_b_id: 'W_0341', word_b_text: 'صالة رياضية',
    category: 'CAT_SPORTS', similarity_level: 3,
    reason_ar: 'مكانان لممارسة الرياضة، لكن الخماسي ملعب عشب صناعي لكرة القدم، والصالة مغلقة لأجهزة اللياقة أو السلة.',
  },
  {
    id: 'CP_033', word_a_id: 'W_0329', word_a_text: 'كرة السلة', word_b_id: 'W_0330', word_b_text: 'كرة الطائرة',
    category: 'CAT_SPORTS', similarity_level: 4,
    reason_ar: 'رياضتان جماعيتان تُلعبان باليد، لكن السلة بالتسجيل داخل طوق مرتفع، والطائرة بتمرير الكرة فوق شبكة تفصل الفريقين.',
  },
  {
    id: 'CP_034', word_a_id: 'W_0333', word_a_text: 'تايكوندو', word_b_id: 'W_0334', word_b_text: 'كاراتيه',
    category: 'CAT_SPORTS', similarity_level: 5,
    reason_ar: 'فنان قتاليان ببدلة بيضاء وأحزمة ملونة، لكن التايكوندو يركز أكثر على ركلات القدم مع واقي الصدر والخوذة.',
  },
  {
    id: 'CP_035', word_a_id: 'W_0381', word_a_text: 'مطر غزير', word_b_id: 'W_0382', word_b_text: 'ثلج أبيض',
    category: 'CAT_NATURE', similarity_level: 4,
    reason_ar: 'هطول شتوي من السحب، لكن المطر قطرات ماء سائلة والثلج رقائق بيضاء متجمدة تتراكم على الأرض.',
  },
  {
    id: 'CP_036', word_a_id: 'W_0386', word_a_text: 'برق', word_b_id: 'W_0387', word_b_text: 'رعد',
    category: 'CAT_NATURE', similarity_level: 5,
    reason_ar: 'يحدثان معًا في العاصفة الماطرة، لكن البرق وميض ضوء يُرى بالعين أولًا، والرعد صوت قوي يُسمع بالأذن بعده.',
  },
  {
    id: 'CP_037', word_a_id: 'W_0360', word_a_text: 'صقر', word_b_id: 'W_0361', word_b_text: 'نسر',
    category: 'CAT_NATURE', similarity_level: 4,
    reason_ar: 'طائران جارحان يحلقان عاليًا، لكن الصقر يصطاد فرائسه حية بسرعة فائقة ويمكن تدريبه، والنسر أكبر حجمًا.',
  },
  {
    id: 'CP_038', word_a_id: 'W_0366', word_a_text: 'نحلة', word_b_id: 'W_0369', word_b_text: 'فراشة',
    category: 'CAT_NATURE', similarity_level: 4,
    reason_ar: 'حشرتان تطيران بين الأزهار، لكن النحلة تعيش في خلية وتصنع العسل وتلسع، والفراشة بأجنحة ملونة واسعة ولا تلسع.',
  },
  {
    id: 'CP_039', word_a_id: 'W_0373', word_a_text: 'شجرة زيتون', word_b_id: 'W_0374', word_b_text: 'شجرة نخيل',
    category: 'CAT_NATURE', similarity_level: 3,
    reason_ar: 'شجرتان مباركتان معمرتان، لكن الزيتون متفرعة تعطي الزيت والزيتون، والنخيل عالية الساق تعطي التمر والرطب.',
  },
  {
    id: 'CP_040', word_a_id: 'W_0396', word_a_text: 'طبيب أسنان', word_b_id: 'W_0399', word_b_text: 'صيدلي',
    category: 'CAT_JOBS', similarity_level: 3,
    reason_ar: 'يرتديان المعطف الأبيض في المجال الصحي، لكن طبيب الأسنان يعالج الفم في عيادته والصيدلي يصرف الأدوية في الصيدلية.',
  },
  {
    id: 'CP_041', word_a_id: 'W_0416', word_a_text: 'نجار', word_b_id: 'W_0417', word_b_text: 'حداد',
    category: 'CAT_JOBS', similarity_level: 4,
    reason_ar: 'حرفيان يصنعان الأبواب والنوافذ، لكن النجار يقص ويشكل الأخشاب بالمنشار، والحداد يلحم ويشكل الحديد بالنار والشرار.',
  },
  {
    id: 'CP_042', word_a_id: 'W_0418', word_a_text: 'كهربائي', word_b_id: 'W_0419', word_b_text: 'سباك (مواسرجي)',
    category: 'CAT_JOBS', similarity_level: 4,
    reason_ar: 'فنيان لصيانة تمديدات المنزل، لكن الكهربائي يصلح الأسلاك والقواطع والإنارة، والسباك يصلح أنابيب المياه والحنفيات.',
  },
  {
    id: 'CP_043', word_a_id: 'W_0423', word_a_text: 'خباز', word_b_id: 'W_0424', word_b_text: 'حلواني',
    category: 'CAT_JOBS', similarity_level: 4,
    reason_ar: 'يعملان أمام الأفران بالعجين والدقيق، لكن الخباز ينتج الخبز اليومي والحلواني يصنع الكنافة والحلويات بالقطر.',
  },
  {
    id: 'CP_044', word_a_id: 'W_0413', word_a_text: 'طيار', word_b_id: 'W_0414', word_b_text: 'قبطان سفينة',
    category: 'CAT_JOBS', similarity_level: 4,
    reason_ar: 'يقودان وسائل نقل عملاقة بزي رسمي، لكن الطيار يحلق في السماء بين المطارات والقبطان يبحر في المحيطات بين الموانئ.',
  },
  {
    id: 'CP_045', word_a_id: 'W_0441', word_a_text: 'هاتف ذكي', word_b_id: 'W_0442', word_b_text: 'جهاز لوحي',
    category: 'CAT_TECH', similarity_level: 5,
    reason_ar: 'يعملان باللمس ونفس التطبيقات، لكن الهاتف صغير يوضع في الجيب للمكالمات، والجهاز اللوحي بشاشة كبيرة للقراءة والرسم.',
  },
  {
    id: 'CP_046', word_a_id: 'W_0443', word_a_text: 'حاسوب محمول', word_b_id: 'W_0441', word_b_text: 'هاتف ذكي',
    category: 'CAT_TECH', similarity_level: 3,
    reason_ar: 'جهازان ذكيان محمولان، لكن الحاسوب يفتح كالكتاب بلوحة مفاتيح كاملة للعمل، والهاتف يمسك بيد واحدة.',
  },
  {
    id: 'CP_047', word_a_id: 'W_0447', word_a_text: 'سماعات رأس', word_b_id: 'W_0458', word_b_text: 'ميكروفون',
    category: 'CAT_TECH', similarity_level: 3,
    reason_ar: 'ملحقان صوتيان، لكن السماعات توضع على الأذنين لسماع الصوت، والميكروفون يُتحدث أمامه لتسجيل أو تكبير الصوت.',
  },
  {
    id: 'CP_048', word_a_id: 'W_0473', word_a_text: 'لعبة الشطرنج', word_b_id: 'W_0474', word_b_text: 'لعبة الضامة',
    category: 'CAT_TECH', similarity_level: 5,
    reason_ar: 'تُلعبان على نفس الرقعة المربعة (64 مربعًا)، لكن الشطرنج بقطع متنوعة الحركات (ملك، وزير، حصان) والضامة بأقراص متشابهة.',
  },
  {
    id: 'CP_049', word_a_id: 'W_0464', word_a_text: 'رسالة صوتية', word_b_id: 'W_0465', word_b_text: 'مكالمة فيديو',
    category: 'CAT_TECH', similarity_level: 4,
    reason_ar: 'وسيلتا تواصل عبر التطبيقات، لكن الرسالة الصوتية مسجلة تُسمع لاحقًا، ومكالمة الفيديو مباشرة بالصوت والصورة في نفس اللحظة.',
  },
  {
    id: 'CP_050', word_a_id: 'W_0501', word_a_text: 'قطار الحجاز', word_b_id: 'W_0502', word_b_text: 'مترو الأنفاق',
    category: 'CAT_TRAVEL', similarity_level: 4,
    reason_ar: 'يسيران على قضبان حديدية، لكن قطار الحجاز تراثي بخاري يسير فوق الأرض بين المدن، والمترو كهربائي سريع تحت الأرض.',
  },
  {
    id: 'CP_051', word_a_id: 'W_0505', word_a_text: 'دراجة هوائية', word_b_id: 'W_0506', word_b_text: 'دراجة نارية',
    category: 'CAT_TRAVEL', similarity_level: 4,
    reason_ar: 'مركبتان بعجلتين ومقود، لكن الهوائية تتحرك بجهد القدمين على الدواسات، والنارية بمحرك وقود وسرعة عالية.',
  },
  {
    id: 'CP_052', word_a_id: 'W_0507', word_a_text: 'سيارة إسعاف', word_b_id: 'W_0508', word_b_text: 'سيارة إطفاء',
    category: 'CAT_TRAVEL', similarity_level: 4,
    reason_ar: 'مركبتا طوارئ بصافرة إنذار، لكن الإسعاف لنقل المرضى للمستشفى، والإطفاء حمراء كبيرة بخراطيم المياه لإخماد الحرائق.',
  },
  {
    id: 'CP_053', word_a_id: 'W_0492', word_a_text: 'جواز سفر', word_b_id: 'W_0493', word_b_text: 'تذكرة طيران',
    category: 'CAT_TRAVEL', similarity_level: 4,
    reason_ar: 'وثيقتان لازمتان في المطار، لكن الجواز دفتر رسمي يثبت الهوية لسنوات، والتذكرة حجز لرحلة واحدة بمقعد وموعد محدد.',
  },
  {
    id: 'CP_054', word_a_id: 'W_0536', word_a_text: 'إبريق شاي', word_b_id: 'W_0538', word_b_text: 'ترمس قهوة',
    category: 'CAT_ITEMS', similarity_level: 4,
    reason_ar: 'وعاءان لتقديم المشروبات الساخنة، لكن الإبريق معدني يوضع مباشرة على النار، والترمس حافظ للحرارة لا يوضع على النار.',
  },
  {
    id: 'CP_055', word_a_id: 'W_0563', word_a_text: 'نظارة طبية', word_b_id: 'W_0564', word_b_text: 'نظارة شمسية',
    category: 'CAT_ITEMS', similarity_level: 5,
    reason_ar: 'توضعان على الوجه بنفس الشكل، لكن الطبية بعدسات شفافة لتصحيح النظر، والشمسية بعدسات داكنة للحماية من أشعة الشمس.',
  },
  {
    id: 'CP_056', word_a_id: 'W_0555', word_a_text: 'مروحة سقف', word_b_id: 'W_0556', word_b_text: 'مكيف هواء',
    category: 'CAT_ITEMS', similarity_level: 4,
    reason_ar: 'جهازان لتخفيف حر الصيف، لكن المروحة تحرك هواء الغرفة بشفرات دوارة، والمكيف يبرد درجة حرارة الهواء بغاز التبريد.',
  },
  {
    id: 'CP_057', word_a_id: 'W_0586', word_a_text: 'المحقق كونان', word_b_id: 'W_0587', word_b_text: 'كابتن ماجد',
    category: 'CAT_FICTION', similarity_level: 3,
    reason_ar: 'أشهر بطلي أنمي مدبلج للعربية، لكن كونان يحل الألغاز والقضايا بذكائه، وماجد يقود فريقه للفوز ببطولات كرة القدم.',
  },
  {
    id: 'CP_058', word_a_id: 'W_0595', word_a_text: 'سندباد البحري', word_b_id: 'W_0596', word_b_text: 'علاء الدين',
    category: 'CAT_FICTION', similarity_level: 4,
    reason_ar: 'بطلا حكايات تراثية شهيرة، لكن سندباد يسافر بالسفينة عبر الجزر والبحار، وعلاء الدين يشتهر بالمصباح وبساط الريح.',
  },
  {
    id: 'CP_059', word_a_id: 'W_0616', word_a_text: 'حفلة شواء', word_b_id: 'W_0617', word_b_text: 'رحلة تخييم',
    category: 'CAT_SOCIAL', similarity_level: 4,
    reason_ar: 'نشاطان في الطبيعة والهواء الطلق، لكن الشواء يركز على إعداد الطعام لعدة ساعات، والتخييم يتضمن نصب الخيام والمبيت.',
  },
  {
    id: 'CP_060', word_a_id: 'W_0629', word_a_text: 'استقبال مسافر', word_b_id: 'W_0630', word_b_text: 'توديع صديق',
    category: 'CAT_SOCIAL', similarity_level: 4,
    reason_ar: 'موقفان عاطفيان في المطار أو المحطة، لكن الاستقبال فرح بعودة الغائب بالهدايا، والتوديع لحظة فراق قبل السفر.',
  },
];

/**
 * Maps Arabic category labels used in Discussion Cards (DC_001..DC_100) to official category IDs.
 */
function mapCardCategories(label: string): string[] {
  if (label.includes('جميع الفئات')) {
    return OFFICIAL_CATEGORIES.map((c) => c.id);
  }
  const cats: string[] = [];
  if (label.includes('أكلات')) cats.push('CAT_FOOD');
  if (label.includes('الأردنية') || label.includes('أردنية')) cats.push('CAT_JORDAN');
  if (label.includes('مدرسة') || label.includes('جامعة')) cats.push('CAT_EDU');
  if (label.includes('رمضان') || label.includes('مناسبات')) cats.push('CAT_SEASONS');
  if (label.includes('مسجد') || label.includes('عبادات')) cats.push('CAT_ISLAMIC');
  if (label.includes('رياضة')) cats.push('CAT_SPORTS');
  if (label.includes('طبيعة') || label.includes('حيوانات')) cats.push('CAT_NATURE');
  if (label.includes('مهن')) cats.push('CAT_JOBS');
  if (label.includes('تكنولوجيا') || label.includes('ألعاب')) cats.push('CAT_TECH');
  if (label.includes('مواصلات') || label.includes('أماكن') || label.includes('سفر')) cats.push('CAT_TRAVEL');
  if (label.includes('أدوات') || label.includes('ملابس')) cats.push('CAT_ITEMS');
  if (label.includes('شخصيات')) cats.push('CAT_FICTION');
  if (label.includes('مواقف')) cats.push('CAT_SOCIAL');
  return cats.length > 0 ? Array.from(new Set(cats)) : OFFICIAL_CATEGORIES.map((c) => c.id);
}

function mapCardAgeBands(label: string): AgeBand[] {
  const bands = new Set<AgeBand>();
  if (label.includes('جميع الأعمار')) {
    ALL_AGE_BANDS.forEach((b) => bands.add(b));
  }
  if (label.includes('أطفال')) bands.add('children_7_10');
  if (label.includes('ناشئة')) bands.add('preteens_11_13');
  if (label.includes('طلاب')) bands.add('teens_14_17');
  if (label.includes('شباب') || label.includes('بالغون')) bands.add('adults_18_plus');
  if (label.includes('عائلات')) bands.add('families_mixed');
  if (bands.size === 0) ALL_AGE_BANDS.forEach((b) => bands.add(b));
  return Array.from(bands);
}

const RAW_DISCUSSION_CARDS: Array<[string, string, string, string]> = [
  ['DC_001', 'هل نتعامل معه أو نراه بشكل يومي أم في أوقات متباعدة؟', 'جميع الفئات', 'عائلات'],
  ['DC_002', 'هل يرتبط وجوده بفصل الشتاء أكثر أم بفصل الصيف؟', 'أكلات، الحياة الأردنية، طبيعة', 'عائلات'],
  ['DC_003', 'لو أردت شراءه أو الحصول عليه، هل يكلف مبلغًا كبيرًا؟', 'أكلات، أدوات، تكنولوجيا', 'جميع الأعمار'],
  ['DC_004', 'هل يمكن وضعه داخل حقيبة صغيرة أم أن حجمه كبير؟', 'أدوات، مدرسة، تكنولوجيا', 'أطفال وعائلات'],
  ['DC_005', 'هل يفضل الناس التعامل معه في الصباح الباكر أم في المساء؟', 'جميع الفئات', 'عائلات'],
  ['DC_006', 'هل يحتاج التعامل معه إلى تدريب ومهارة سابقة أم أنه بسيط للجميع؟', 'رياضة، مهن، تكنولوجيا، أدوات', 'ناشئة وبالغون'],
  ['DC_007', 'هل يصدر عنه صوت مميز يمكن سماعه من بعيد؟', 'حيوانات، مواصلات، أدوات، حياة أردنية', 'أطفال وعائلات'],
  ['DC_008', 'هل يرتبط هذا الشيء بالهدوء والسكينة أم بالحركة والنشاط؟', 'مسجد، رياضة، مواقف، أماكن', 'جميع الأعمار'],
  ['DC_009', 'هل يمكن أن نجده داخل كل بيت أردني تقريبًا؟', 'أكلات، حياة أردنية، أدوات', 'عائلات'],
  ['DC_010', 'لو اختفى هذا الشيء لمدة أسبوع، هل تتعطل حياتنا اليومية؟', 'تكنولوجيا، مواصلات، أدوات، مهن', 'طلاب وبالغون'],
  ['DC_011', 'هل يرتبط بذكريات الطفولة والمدرسة أم بمرحلة الكبار؟', 'مدرسة، شخصيات، أكلات', 'عائلات'],
  ['DC_012', 'هل يشارك فيه مجموعة من الناس معًا أم يخص شخصًا واحدًا؟', 'رياضة، مواقف، مناسبات، مسجد', 'جميع الأعمار'],
  ['DC_013', 'هل يتغير شكله أو حالته مع مرور الوقت؟', 'طبيعة، أكلات، أدوات', 'ناشئة وطلاب'],
  ['DC_014', 'هل يحتاج إلى كهرباء أو بطارية أو وقود ليعمل؟', 'تكنولوجيا، أدوات، مواصلات', 'أطفال وعائلات'],
  ['DC_015', 'هل يعتبر وجوده ضروريًا في المناسبات والأعياد؟', 'رمضان والعيد، أكلات، حياة أردنية', 'عائلات'],
  ['DC_016', 'لو قدمته هدية لصديق، هل سيفرح به أم سيستغرب؟', 'أدوات، تكنولوجيا، أكلات', 'جميع الأعمار'],
  ['DC_017', 'هل نراه في الشوارع والأماكن العامة أكثر أم في الأماكن المغلقة؟', 'أماكن، حياة أردنية، طبيعة', 'عائلات'],
  ['DC_018', 'هل يتطلب وجوده التزامًا بمواعيد محددة؟', 'مدرسة، مسجد، مواصلات، مهن', 'طلاب وبالغون'],
  ['DC_019', 'هل يشتهر به الأردن وبلاد الشام تحديدًا أم أنه عالمي؟', 'حياة أردنية، أكلات، أماكن', 'عائلات'],
  ['DC_020', 'هل يحتاج إلى صبر ووقت طويل أم يتم بسرعة؟', 'أكلات، مهن، مواقف، رياضة', 'جميع الأعمار'],
  ['DC_021', 'هل له رائحة مميزة يعرفها الناس فورًا؟', 'أكلات، طبيعة، حياة أردنية', 'أطفال وعائلات'],
  ['DC_022', 'هل يعتبر شيئًا قديمًا وتراثيًا أم حديثًا وعصريًا؟', 'حياة أردنية، تكنولوجيا، أدوات', 'عائلات'],
  ['DC_023', 'هل يرتبط بالسفر والتنقل من مكان لآخر؟', 'أماكن ومواصلات، مواقف', 'جميع الأعمار'],
  ['DC_024', 'هل هناك قوانين أو آداب خاصة يجب احترامها عند التعامل معه؟', 'مسجد، رياضة، مدرسة، مواصلات', 'ناشئة وبالغون'],
  ['DC_025', 'هل يحبه الأطفال الصغار أكثر أم الكبار؟', 'شخصيات، أكلات، ألعاب', 'عائلات'],
  ['DC_026', 'هل يرتبط بالماء أو السوائل بشكل مباشر؟', 'طبيعة، أكلات، أدوات، عبادات', 'جميع الأعمار'],
  ['DC_027', 'هل يمكن إصلاحه إذا تعطل أم يتم استبداله بغيره؟', 'أدوات، تكنولوجيا، مواصلات', 'طلاب وبالغون'],
  ['DC_028', 'هل يرتبط بالدراسة والتفكير والتركيز؟', 'مدرسة وجامعة، مهن، تكنولوجيا', 'طلاب'],
  ['DC_029', 'هل يظهر في التلفاز والشاشات كثيرًا؟', 'رياضة، شخصيات، تكنولوجيا', 'جميع الأعمار'],
  ['DC_030', 'هل يحتاج إلى ملابس أو تجهيزات خاصة؟', 'رياضة، مهن، مناسبات، سفر', 'عائلات'],
  ['DC_031', 'هل يرتبط بالكرم والضيافة العربية؟', 'أكلات، حياة أردنية، مناسبات', 'عائلات'],
  ['DC_032', 'هل يمكن أن يسبب الإزعاج إذا استُخدم في الوقت الخطأ؟', 'أدوات، تكنولوجيا، مواقف', 'ناشئة وبالغون'],
  ['DC_033', 'هل نستخدم فيه اليدين بشكل أساسي أم يعتمد على النظر والاستماع؟', 'أدوات، تكنولوجيا، رياضة', 'جميع الأعمار'],
  ['DC_034', 'هل يوجد منه ألوان وأحجام كثيرة أم أن شكله ثابت تقريبًا؟', 'أدوات، طبيعة، ملابس', 'أطفال وعائلات'],
  ['DC_035', 'هل يرتبط بيوم الجمعة أو عطلة نهاية الأسبوع؟', 'مسجد، حياة أردنية، مواقف، أكلات', 'عائلات'],
  ['DC_036', 'هل يحتاج إلى مكان واسع ومفتوح؟', 'رياضة، طبيعة، أماكن', 'جميع الأعمار'],
  ['DC_037', 'هل يمكن صناعته أو تحضيره في المنزل؟', 'أكلات، أدوات', 'عائلات'],
  ['DC_038', 'هل يرتبط بالتنافس والفوز والخسارة؟', 'رياضة، تكنولوجيا وألعاب، مدرسة', 'ناشئة وطلاب'],
  ['DC_039', 'هل يتأثر بحالة الطقس والمطر والرياح؟', 'طبيعة، حياة أردنية، مواصلات، رياضة', 'عائلات'],
  ['DC_040', 'هل نحتاجه عند استقبال الضيوف في المنزل؟', 'أكلات، مناسبات، أدوات', 'عائلات'],
  ['DC_041', 'هل يرتبط بالأجر والثواب والعمل الصالح؟', 'مسجد وعبادات، رمضان، مواقف', 'جميع الأعمار'],
  ['DC_042', 'هل يعتبر من الأساسيات أم من الكماليات والترفيه؟', 'جميع الفئات', 'طلاب وبالغون'],
  ['DC_043', 'هل يمكن استعارته من الجيران أو الأصدقاء؟', 'أدوات، مدرسة، تكنولوجيا', 'عائلات'],
  ['DC_044', 'هل يرتبط بالسرعة والعجلة أم بالتمهل؟', 'مواصلات، رياضة، أكلات', 'جميع الأعمار'],
  ['DC_045', 'هل يفضله الناس ساخنًا أم باردًا (إن كان له حرارة)؟', 'أكلات ومشروبات، طبيعة', 'عائلات'],
  ['DC_046', 'هل يوجد في القرى والريف أكثر أم في المدن المزدحمة؟', 'طبيعة، حياة أردنية، أماكن', 'جميع الأعمار'],
  ['DC_047', 'هل يرتبط بالكتابة أو القراءة أو الحساب؟', 'مدرسة وجامعة، مهن، أدوات', 'أطفال وطلاب'],
  ['DC_048', 'هل يحتاج إلى تنظيف وترتيب مستمر؟', 'أدوات، أماكن، حيوانات', 'عائلات'],
  ['DC_049', 'هل يمكن أن يسبب الخوف أو الحذر عند الاقتراب منه؟', 'حيوانات وطبيعة، أدوات، مواصلات', 'جميع الأعمار'],
  ['DC_050', 'هل يرتبط بالصحة والنشاط البدني؟', 'رياضة، أكلات، مهن', 'جميع الأعمار'],
  ['DC_051', 'هل نراه في الطريق إلى المدرسة أو العمل كل صباح؟', 'حياة أردنية، مواصلات، مهن', 'عائلات'],
  ['DC_052', 'هل يتطلب وجود شخص مسؤول أو قائد لتنظيمه؟', 'مدرسة، رياضة، مسجد، مهن', 'طلاب وبالغون'],
  ['DC_053', 'هل يرتبط بشهر رمضان المبارك بشكل خاص؟', 'رمضان والعيد، أكلات، مسجد', 'جميع الأعمار'],
  ['DC_054', 'هل مصنوع من المعدن أو البلاستيك أم أنه شيء طبيعي؟', 'أدوات، تكنولوجيا، طبيعة', 'أطفال وعائلات'],
  ['DC_055', 'هل يجمع العائلة حوله في وقت واحد؟', 'أكلات، مناسبات، مواقف، أدوات', 'عائلات'],
  ['DC_056', 'هل يحتاج إلى تذكرة أو حجز مسبق؟', 'أماكن وسفر، رياضة، مواقف', 'طلاب وبالغون'],
  ['DC_057', 'هل نبحث عنه فور انقطاع الكهرباء؟', 'أدوات، تكنولوجيا، حياة أردنية', 'عائلات'],
  ['DC_058', 'هل يرتبط بالنجاح والتفوق والفرح؟', 'مدرسة، مناسبات، مواقف', 'جميع الأعمار'],
  ['DC_059', 'هل يعتمد على الإنترنت للوصول إليه أو تشغيله؟', 'تكنولوجيا، مدرسة، ألعاب', 'ناشئة وطلاب'],
  ['DC_060', 'هل يرتبط بالمطبخ وإعداد الطعام؟', 'أكلات، أدوات يومية', 'عائلات'],
  ['DC_061', 'هل يعيش أو يدوم لسنوات طويلة أم ينتهي سريعًا؟', 'أدوات، طبيعة، أكلات', 'جميع الأعمار'],
  ['DC_062', 'هل له علاقة بالأرقام أو الوقت أو التاريخ؟', 'مدرسة، أدوات، مناسبات', 'طلاب وبالغون'],
  ['DC_063', 'هل نراه في الأسواق الشعبية ووسط البلد؟', 'حياة أردنية، أكلات، مهن', 'عائلات'],
  ['DC_064', 'هل يتطلب تعاونًا بين شخصين أو أكثر لينجح؟', 'رياضة، مواقف، مهن', 'جميع الأعمار'],
  ['DC_065', 'هل يرتبط بالخيال والقصص غير الواقعية؟', 'شخصيات خيالية، ألعاب', 'أطفال وناشئة'],
  ['DC_066', 'هل نأخذه معنا عند الذهاب في رحلة أو تنزه؟', 'أكلات، أدوات، حياة أردنية', 'عائلات'],
  ['DC_067', 'هل يحتاج إلى مفتاح أو كلمة سر؟', 'أدوات، تكنولوجيا، أماكن', 'طلاب وبالغون'],
  ['DC_068', 'هل يرتبط بالنظافة والترتيب الشخصي؟', 'أدوات، عبادات، مواقف', 'جميع الأعمار'],
  ['DC_069', 'هل يشتهر في محافظة معينة في الأردن أكثر من غيرها؟', 'حياة أردنية، أكلات، أماكن', 'طلاب وبالغون'],
  ['DC_070', 'هل يسبب الازدحام إذا اجتمع الناس حوله؟', 'حياة أردنية، مواصلات، أماكن', 'عائلات'],
  ['DC_071', 'هل له علاقة بالضوء أو الإنارة؟', 'أدوات، طبيعة، رمضان', 'أطفال وعائلات'],
  ['DC_072', 'هل يتغير سعره أو الطلب عليه حسب المواسم؟', 'أكلات، مناسبات، سفر', 'بالغون وعائلات'],
  ['DC_073', 'هل يحتاج إلى شهادة علمية لممارسته أو التعامل معه؟', 'مهن، مدرسة وجامعة', 'طلاب وبالغون'],
  ['DC_074', 'هل يرتبط بالصوت العالي والتشجيع والحماس؟', 'رياضة، مناسبات، مواقف', 'ناشئة وشباب'],
  ['DC_075', 'هل يمكن طيه أو لفه وتخزينه في درج صغير؟', 'أدوات، ملابس، مدرسة', 'عائلات'],
  ['DC_076', 'هل نستخدمه لحماية أنفسنا من البرد أو الحر؟', 'أدوات، حياة أردنية، طبيعة', 'جميع الأعمار'],
  ['DC_077', 'هل يرتبط بالتطوع ومساعدة الآخرين؟', 'مواقف، مسجد، مهن', 'جميع الأعمار'],
  ['DC_078', 'هل يوجد في المساجد أو المراكز الإسلامية؟', 'مسجد وعبادات، رمضان', 'جميع الأعمار'],
  ['DC_079', 'هل يفضله الكبار في السن ويحكون عنه دائمًا؟', 'حياة أردنية، أكلات، مواقف', 'عائلات'],
  ['DC_080', 'هل له أزرار أو شاشة لمس؟', 'تكنولوجيا، أدوات', 'أطفال وناشئة'],
  ['DC_081', 'هل يرتبط بالزراعة أو الأشجار أو الأرض؟', 'طبيعة، أكلات، حياة أردنية', 'جميع الأعمار'],
  ['DC_082', 'هل نحتاج إلى الانتظار في الدور (طابور) بسببه؟', 'حياة أردنية، مدرسة، أماكن', 'عائلات'],
  ['DC_083', 'هل يرتبط بالامتحانات أو التقييم والدرجات؟', 'مدرسة وجامعة، رياضة', 'طلاب'],
  ['DC_084', 'هل يمكن أن ينكسر بسهولة إذا سقط على الأرض؟', 'أدوات، تكنولوجيا، أكلات', 'أطفال وعائلات'],
  ['DC_085', 'هل له علاقة بالصوت الجميل والتلاوة أو الإنشاد؟', 'مسجد، مناسبات، مواقف', 'جميع الأعمار'],
  ['DC_086', 'هل يعتبر وسيلة للتواصل بين الناس البعيدين؟', 'تكنولوجيا، مواقف، سفر', 'ناشئة وبالغون'],
  ['DC_087', 'هل نراه في السماء أو في الأماكن المرتفعة؟', 'طبيعة، مواصلات، أماكن', 'أطفال وعائلات'],
  ['DC_088', 'هل يرتبط بالحلويات والسكر أم بالموالح؟', 'أكلات ومشروبات، مناسبات', 'جميع الأعمار'],
  ['DC_089', 'هل يحتاج إلى التزام بالهدوء وعدم الكلام؟', 'مسجد، مدرسة، أماكن', 'جميع الأعمار'],
  ['DC_090', 'هل يتطلب لياقة بدنية وجريًا وحركة سريعة؟', 'رياضة، مهن، مواقف', 'ناشئة وشباب'],
  ['DC_091', 'هل يرتبط بالبيع والشراء والتجارة؟', 'مهن، حياة أردنية، أماكن', 'جميع الأعمار'],
  ['DC_092', 'هل نحتفظ به للذكرى لسنوات طويلة؟', 'مناسبات، أدوات، مدرسة', 'عائلات'],
  ['DC_093', 'هل يحتاج إلى ماء وصابون لتنظيفه بعد كل استخدام؟', 'أدوات، أكلات', 'عائلات'],
  ['DC_094', 'هل يرتبط بالاستيقاظ المبكر قبل شروق الشمس؟', 'مسجد، رمضان، مدرسة، مهن', 'جميع الأعمار'],
  ['DC_095', 'هل يعرفه كل من زار العاصمة عمّان؟', 'حياة أردنية، أماكن', 'عائلات'],
  ['DC_096', 'هل يعتمد على الذكاء والتخطيط وحل الألغاز؟', 'تكنولوجيا وألعاب، مدرسة، رياضة', 'ناشئة وشباب'],
  ['DC_097', 'هل يرتبط بالمستشفيات أو العلاج والصحة؟', 'مهن، أماكن، أدوات', 'جميع الأعمار'],
  ['DC_098', 'هل يتغير لونه عند نضجه أو طبخه؟', 'أكلات، طبيعة', 'عائلات'],
  ['DC_099', 'هل نستخدمه لمعرفة الاتجاهات أو الأماكن؟', 'تكنولوجيا، سفر، طبيعة', 'طلاب وبالغون'],
  ['DC_100', 'لو طلبنا من طفل عمره 8 سنوات رسمه، هل سيرسمه بسهولة؟', 'جميع الفئات', 'جميع الأعمار'],
];

export function buildSeedDiscussionCards(): DiscussionCardEntry[] {
  return RAW_DISCUSSION_CARDS.map(([id, prompt_ar, catLabel, ageLabel]) => ({
    id,
    prompt_ar,
    categories: mapCardCategories(catLabel),
    age_bands: mapCardAgeBands(ageLabel),
    status: 'approved',
  }));
}

export function buildSeedConfusingPairsSkeleton(): ConfusingPairEntry[] {
  return RAW_CONFUSING_PAIRS.map((p) => ({
    id: p.id,
    word_a_id: p.word_a_id,
    word_b_id: p.word_b_id,
    word_a_text: p.word_a_text,
    word_b_text: p.word_b_text,
    category: p.category,
    age_bands: FAMILIES_UP,
    difficulty: 2,
    similarity_level: p.similarity_level,
    reason_ar: p.reason_ar,
    status: 'approved',
  }));
}
