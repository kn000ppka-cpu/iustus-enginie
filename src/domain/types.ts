/**
 * Доменная модель Iustus Engine.
 *
 * Главный документ — `CaseFile`. Он содержит:
 *   1. `subject`     — профиль обвиняемого (Этап 1).
 *   2. `episodes`    — эпизоды (вменённые преступления) (Этап 2).
 *   3. `convictions` — прошлые приговоры (Этап 2).
 *   4. `context`     — глобальный контекст (Этап 3): особый порядок, досуд. соглашение, присяжные.
 *   5. `polish`      — зачёт СИЗО, домашний арест и т. д. (Этап 5).
 *
 * Движок (`engine`) принимает `CaseFile` и возвращает `CalculationResult`
 * с диапазоном итогового наказания и логом «Путь машины» (массив `RuleApplication`).
 */

import type {
  ComplicityRole,
  ConvictionStatus,
  CrimeCategory,
  DisabilityGroup,
  FacilityKind,
  Gender,
  PunishmentKind,
  RecidivismKind,
  Stage,
} from './enums';

// ────────────────────────────────────────────────────────────────────────────
// Базовые примитивы
// ────────────────────────────────────────────────────────────────────────────

/** ISO-дата вида YYYY-MM-DD. Все даты в кейсе хранятся в этом формате. */
export type IsoDate = string;

/** Срок наказания в днях. */
export type Days = number;

/**
 * Универсальное представление срока — год/месяц/день, без округления.
 * Используется для отображения и экспорта. Конвертация: год = 12 мес. = 360 дней,
 * месяц = 30 дней (для эквивалентов ст. 71/72 УК).
 */
export interface Duration {
  years: number;
  months: number;
  days: number;
}

/** Уникальный идентификатор записи в кейсе. */
export type EntityId = string;

// ────────────────────────────────────────────────────────────────────────────
// Статья УК и санкция
// ────────────────────────────────────────────────────────────────────────────

/**
 * Один альтернативный вид наказания в санкции одной части статьи.
 * Например, ч. 1 ст. 158 УК предусматривает несколько альтернатив: штраф ИЛИ
 * обязательные работы ИЛИ исправительные работы ИЛИ ограничение свободы ИЛИ
 * принудительные работы ИЛИ арест ИЛИ лишение свободы.
 */
export interface SanctionOption {
  kind: PunishmentKind;
  /** Минимум. В днях / часах / рублях согласно `PUNISHMENT_UNIT[kind]`. */
  min: number;
  /** Максимум. */
  max: number;
  /** Помечает дополнительное наказание (обязательное или возможное). */
  isAdditional?: boolean;
  isAdditionalMandatory?: boolean;
}

/** Часть статьи Особенной части УК с её санкцией. */
export interface ArticlePart {
  /** Номер части: '1', '2', '3', '3.1' и т. д. */
  part: string;
  /** Полное описание состава (для UI и шаблона приговора). */
  disposition: string;
  /** Категория преступления (ст. 15) — выводится из санкции. */
  category: CrimeCategory;
  /** Все альтернативные виды основного и дополнительные наказания. */
  sanctions: SanctionOption[];
  /**
   * Маркер «террористический / экстремистский состав» для целей
   * E-064-EXCL, P-072-EXCL, M-070-25, O-079-G и т. д.
   */
  isTerrorism?: boolean;
  /** Маркер «преступление против половой неприкосновенности до 14 лет» — P-073-DENY, O-079-G. */
  isSexualAgainstMinor?: boolean;
}

/** Статья Особенной части УК. */
export interface UkArticle {
  /** Номер статьи: '105', '158', '228.1' и т. д. */
  number: string;
  /** Краткое наименование (для поиска и UI). */
  title: string;
  /** Главу/раздел можно добавить позже — для группировки в каталоге. */
  chapter?: string;
  parts: ArticlePart[];
  /** Источник: 'core' (встроена в seed) или 'user' (добавлена пользователем). */
  source: 'core' | 'user';
}

// ────────────────────────────────────────────────────────────────────────────
// Профиль субъекта (Этап 1)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Профиль обвиняемого — определяет, какие виды наказания вообще могут быть
 * назначены (фильтры F-* из `legal-catalogue.md`).
 */
export interface Subject {
  /** ФИО — необязательно, можно вводить только инициалы для анонимизации. */
  fullName?: string;
  gender: Gender;
  birthDate: IsoDate;
  citizenship?: string;

  // Спец. характеристики (Этап 1)
  isPregnant: boolean;
  hasChildUnder3: boolean;
  hasChildUnder14: boolean;
  disability: DisabilityGroup;
  isMilitary: boolean;
  hasStateAwards: boolean;
}

// ────────────────────────────────────────────────────────────────────────────
// Эпизод (Этап 2)
// ────────────────────────────────────────────────────────────────────────────

/** Применимость отдельных смягчающих/отягчающих и особых правил для эпизода. */
export interface EpisodeFlags {
  // Смягчающие (УК ст. 61)
  mitigatingIds: string[]; // 'a', 'b', ..., 'i', 'k'
  // Отягчающие (УК ст. 63)
  aggravatingIds: string[]; // 'ag_a', ...

  // Особые правила, привязанные к эпизоду
  art62_1: boolean; // явка с повинной/возмещение без отягчающих → ≤ 2/3
  art64: boolean; // исключительные обстоятельства (ниже низшего)
  art65: boolean; // снисхождение присяжных
  art15_6_applied: boolean; // применено изменение категории (UI-кнопка)
}

/** Эпизод — конкретное вменённое преступление. */
export interface Episode {
  id: EntityId;
  /** Дата совершения (для рецидива и совокупности). */
  commitDate: IsoDate;
  /** Ссылка на статью + часть. */
  articleNumber: string; // напр. '105'
  articlePart: string; // напр. '1'
  stage: Stage;
  role: ComplicityRole;
  flags: EpisodeFlags;
  /** Категория: либо как у статьи, либо изменённая по ст. 15 ч. 6. */
  effectiveCategory?: CrimeCategory;
}

// ────────────────────────────────────────────────────────────────────────────
// Прошлый приговор (Этап 2)
// ────────────────────────────────────────────────────────────────────────────

export interface PreviousSentencePart {
  kind: PunishmentKind;
  /** Срок в естественных единицах. */
  duration: Duration; // для штрафа — игнорируется, используется `amount`
  /** Сумма штрафа в рублях. */
  amount?: number;
}

export interface Conviction {
  id: EntityId;
  /**
   * Дата вступления приговора в законную силу.
   * Согласно решению пользователя (глобальный принцип № 2): именно эта дата
   * используется во всех детекторах Timeline (T-069-5, T-070, T-086).
   */
  effectiveDate: IsoDate;
  court?: string;
  /** Перечень составов с краткими ссылками для шаблона приговора. */
  composition: { article: string; part: string }[];
  /** Назначенное наказание (итоговое по приговору). */
  sentence: PreviousSentencePart;
  status: ConvictionStatus;

  /** Дата начала отбытия (СИЗО до приговора + колония). */
  servingStartDate?: IsoDate;
  /** Реально отбытый срок (без периода УДО). */
  actuallyServed?: Duration;
  /** Неотбытая часть (для ст. 70). */
  unservedPart?: Duration;

  /** Категория тяжести составов (для ст. 18). */
  worstCategory?: CrimeCategory;
}

// ────────────────────────────────────────────────────────────────────────────
// Глобальный контекст (Этап 3)
// ────────────────────────────────────────────────────────────────────────────

export interface CaseContext {
  /** Досудебное соглашение о сотрудничестве (УПК гл. 40.1). */
  preTrialAgreement: boolean;
  /** Особый порядок (УПК гл. 40). */
  specialProcedure: boolean;
  /** Дело рассматривал суд присяжных. */
  juryTrial: boolean;
  /** Дата вынесения текущего приговора (фактическая или планируемая). */
  trialDate?: IsoDate;
}

// ────────────────────────────────────────────────────────────────────────────
// Зачёты и финальная доводка (Этап 5)
// ────────────────────────────────────────────────────────────────────────────

export const DetentionRegime = {
  Custody: 'custody', // содержание под стражей в СИЗО
  HouseArrest: 'house_arrest', // домашний арест
  Detained: 'detained', // задержание
} as const;
export type DetentionRegime = (typeof DetentionRegime)[keyof typeof DetentionRegime];

export interface DetentionPeriod {
  id: EntityId;
  regime: DetentionRegime;
  from: IsoDate;
  to: IsoDate;
  /** Фактический коэффициент зачёта (выбирается пользователем после рекомендации движка). */
  coefficient?: '1:1' | '1:1.5' | '1:2' | '2:1';
}

export interface PolishConfig {
  detentionPeriods: DetentionPeriod[];
  /** Применять ли условное осуждение (ст. 73), если возможно. */
  applyConditional: boolean;
}

// ────────────────────────────────────────────────────────────────────────────
// Корневой документ кейса
// ────────────────────────────────────────────────────────────────────────────

export interface CaseFile {
  id: EntityId;
  createdAt: IsoDate;
  updatedAt: IsoDate;
  title?: string;

  subject: Subject;
  episodes: Episode[];
  convictions: Conviction[];
  context: CaseContext;
  polish: PolishConfig;
}

// ────────────────────────────────────────────────────────────────────────────
// Результаты расчёта движка
// ────────────────────────────────────────────────────────────────────────────

/** Применение одного правила в логе расчёта (для «Пути машины»). */
export interface RuleApplication {
  ruleId: string; // напр. 'E-066-3'
  norm: string; // напр. 'УК ст. 66 ч. 3'
  source?: string; // напр. 'ППВС № 58/2015 п. 14'
  description: string; // человекочитаемое описание шага
  before?: { min: number; max: number };
  after?: { min: number; max: number };
}

/** Результат расчёта по одному эпизоду (внутренний). */
export interface EpisodeResult {
  episodeId: EntityId;
  punishmentKind: PunishmentKind;
  range: { min: Days; max: Days };
  log: RuleApplication[];
}

/** Итоговый результат по всему кейсу. */
export interface CalculationResult {
  // По одному эпизоду — для отображения в UI
  episodes: EpisodeResult[];

  // Совокупность (если есть)
  aggregate?: {
    kind: 'art69_2' | 'art69_3' | 'art69_5' | 'art70';
    range: { min: Days; max: Days };
    log: RuleApplication[];
  };

  // Зачёт и финал (Этап 5)
  finalRange: { min: Days; max: Days };
  facility?: FacilityKind;
  parole?: { earliestDate: IsoDate; daysServedRequired: Days };
  replacement?: { earliestDate: IsoDate; daysServedRequired: Days };

  // Виды наказания, заблокированные фильтрами субъекта (Этап 1)
  blockedPunishments: PunishmentKind[];
  // Текущий вид рецидива (T-018)
  recidivism: RecidivismKind;
  // Полный лог
  log: RuleApplication[];

  warnings: string[];
}
