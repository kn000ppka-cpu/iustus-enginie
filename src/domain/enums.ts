/**
 * Перечисления доменной модели Iustus Engine.
 *
 * Все значения задаются строковыми литералами для удобства сериализации,
 * экспорта в JSON, отладки и прямого использования в текстах резолютивной части.
 */

// ────────────────────────────────────────────────────────────────────────────
// Категории преступлений (УК ст. 15)
// ────────────────────────────────────────────────────────────────────────────

export const CrimeCategory = {
  Small: 'small', // небольшой тяжести
  Medium: 'medium', // средней тяжести
  Heavy: 'heavy', // тяжкое
  EspeciallyHeavy: 'especially_heavy', // особо тяжкое
} as const;
export type CrimeCategory = (typeof CrimeCategory)[keyof typeof CrimeCategory];

export const CRIME_CATEGORY_LABELS: Record<CrimeCategory, string> = {
  small: 'Небольшой тяжести',
  medium: 'Средней тяжести',
  heavy: 'Тяжкое',
  especially_heavy: 'Особо тяжкое',
};

// ────────────────────────────────────────────────────────────────────────────
// Виды наказаний (УК ст. 44)
// ────────────────────────────────────────────────────────────────────────────

export const PunishmentKind = {
  Fine: 'fine', // Штраф (ст. 46)
  DeprivationOfRight: 'deprivation_of_right', // Лишение права занимать должности / заниматься деятельностью (ст. 47)
  DeprivationOfTitle: 'deprivation_of_title', // Лишение спец., воинского, почётного звания, классного чина и наград (ст. 48)
  MandatoryWork: 'mandatory_work', // Обязательные работы (ст. 49)
  CorrectionalWork: 'correctional_work', // Исправительные работы (ст. 50)
  MilitaryRestriction: 'military_restriction', // Ограничение по военной службе (ст. 51)
  RestrictionOfFreedom: 'restriction_of_freedom', // Ограничение свободы (ст. 53)
  ForcedWork: 'forced_work', // Принудительные работы (ст. 53.1)
  Arrest: 'arrest', // Арест (ст. 54)
  DisciplinaryUnit: 'disciplinary_unit', // Содержание в дисциплинарной воинской части (ст. 55)
  Imprisonment: 'imprisonment', // Лишение свободы на определённый срок (ст. 56)
  LifeImprisonment: 'life_imprisonment', // Пожизненное лишение свободы (ст. 57)
  DeathPenalty: 'death_penalty', // Смертная казнь (ст. 59) — мораторий
} as const;
export type PunishmentKind = (typeof PunishmentKind)[keyof typeof PunishmentKind];

export const PUNISHMENT_LABELS: Record<PunishmentKind, string> = {
  fine: 'Штраф',
  deprivation_of_right: 'Лишение права занимать должности / заниматься деятельностью',
  deprivation_of_title: 'Лишение специального, воинского, почётного звания, классного чина и наград',
  mandatory_work: 'Обязательные работы',
  correctional_work: 'Исправительные работы',
  military_restriction: 'Ограничение по военной службе',
  restriction_of_freedom: 'Ограничение свободы',
  forced_work: 'Принудительные работы',
  arrest: 'Арест',
  disciplinary_unit: 'Содержание в дисциплинарной воинской части',
  imprisonment: 'Лишение свободы на определённый срок',
  life_imprisonment: 'Пожизненное лишение свободы',
  death_penalty: 'Смертная казнь',
};

/** Единица измерения наказания. Все сроки в днях, штраф — в рублях, обяз. работы — в часах. */
export const PUNISHMENT_UNIT: Record<PunishmentKind, 'days' | 'hours' | 'rub'> = {
  fine: 'rub',
  deprivation_of_right: 'days',
  deprivation_of_title: 'days',
  mandatory_work: 'hours',
  correctional_work: 'days',
  military_restriction: 'days',
  restriction_of_freedom: 'days',
  forced_work: 'days',
  arrest: 'days',
  disciplinary_unit: 'days',
  imprisonment: 'days',
  life_imprisonment: 'days',
  death_penalty: 'days',
};

// ────────────────────────────────────────────────────────────────────────────
// Стадия преступления (УК ст. 29, 30, 66)
// ────────────────────────────────────────────────────────────────────────────

export const Stage = {
  Completed: 'completed', // оконченное
  Preparation: 'preparation', // приготовление (ст. 30 ч. 1) — только для тяжких/особо тяжких
  Attempt: 'attempt', // покушение (ст. 30 ч. 3)
} as const;
export type Stage = (typeof Stage)[keyof typeof Stage];

// ────────────────────────────────────────────────────────────────────────────
// Роль соучастника (УК ст. 33, 67)
// ────────────────────────────────────────────────────────────────────────────

export const ComplicityRole = {
  Solo: 'solo', // единолично
  Executor: 'executor', // исполнитель
  Organizer: 'organizer', // организатор
  Instigator: 'instigator', // подстрекатель
  Accomplice: 'accomplice', // пособник
} as const;
export type ComplicityRole = (typeof ComplicityRole)[keyof typeof ComplicityRole];

// ────────────────────────────────────────────────────────────────────────────
// Рецидив (УК ст. 18)
// ────────────────────────────────────────────────────────────────────────────

export const RecidivismKind = {
  None: 'none',
  Simple: 'simple', // простой
  Dangerous: 'dangerous', // опасный
  EspeciallyDangerous: 'especially_dangerous', // особо опасный
} as const;
export type RecidivismKind = (typeof RecidivismKind)[keyof typeof RecidivismKind];

// ────────────────────────────────────────────────────────────────────────────
// Вид исправительного учреждения (УК ст. 58)
// ────────────────────────────────────────────────────────────────────────────

export const FacilityKind = {
  Settlement: 'settlement', // колония-поселение
  GeneralRegime: 'general_regime', // общий режим
  StrictRegime: 'strict_regime', // строгий режим
  SpecialRegime: 'special_regime', // особый режим
  EducationalColony: 'educational_colony', // воспитательная колония
  Prison: 'prison', // тюрьма
} as const;
export type FacilityKind = (typeof FacilityKind)[keyof typeof FacilityKind];

export const FACILITY_LABELS: Record<FacilityKind, string> = {
  settlement: 'Колония-поселение',
  general_regime: 'Исправительная колония общего режима',
  strict_regime: 'Исправительная колония строгого режима',
  special_regime: 'Исправительная колония особого режима',
  educational_colony: 'Воспитательная колония',
  prison: 'Тюрьма',
};

// ────────────────────────────────────────────────────────────────────────────
// Пол (для F-фильтров и расчёта пенсионного возраста)
// ────────────────────────────────────────────────────────────────────────────

export const Gender = {
  Male: 'male',
  Female: 'female',
} as const;
export type Gender = (typeof Gender)[keyof typeof Gender];

// ────────────────────────────────────────────────────────────────────────────
// Группа инвалидности
// ────────────────────────────────────────────────────────────────────────────

export const DisabilityGroup = {
  None: 'none',
  I: 'I',
  II: 'II',
  III: 'III',
} as const;
export type DisabilityGroup = (typeof DisabilityGroup)[keyof typeof DisabilityGroup];

// ────────────────────────────────────────────────────────────────────────────
// Статус прошлого приговора (для Timeline)
// ────────────────────────────────────────────────────────────────────────────

export const ConvictionStatus = {
  Served: 'served', // отбыто
  PartiallyServed: 'partially_served', // отбыто частично
  Conditional: 'conditional', // условное (УО)
  ConditionalRevoked: 'conditional_revoked', // УО отменено (ст. 74)
  Parole: 'parole', // на УДО (ст. 79)
  ParoleRevoked: 'parole_revoked', // УДО отменено
  Replaced: 'replaced', // заменено более мягким (ст. 80)
  Pardoned: 'pardoned', // помиловано
  Amnesty: 'amnesty', // освобождён по амнистии
  Expunged: 'expunged', // судимость погашена/снята (ст. 86)
} as const;
export type ConvictionStatus = (typeof ConvictionStatus)[keyof typeof ConvictionStatus];

// ────────────────────────────────────────────────────────────────────────────
// Этапы user flow
// ────────────────────────────────────────────────────────────────────────────

export const StageId = {
  Subject: 'subject', // Этап 1
  Timeline: 'timeline', // Этап 2
  Context: 'context', // Этап 3
  Engine: 'engine', // Этап 4
  Polish: 'polish', // Этап 5
  Output: 'output', // Этап 6
} as const;
export type StageId = (typeof StageId)[keyof typeof StageId];

export const STAGE_ORDER: StageId[] = [
  'subject',
  'timeline',
  'context',
  'engine',
  'polish',
  'output',
];

export const STAGE_LABELS: Record<StageId, string> = {
  subject: 'Профиль субъекта',
  timeline: 'Хронология',
  context: 'Обстоятельства',
  engine: 'Расчёт',
  polish: 'Зачёт и режим',
  output: 'Результат',
};
