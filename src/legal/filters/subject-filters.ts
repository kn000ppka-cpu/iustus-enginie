/**
 * Фильтры законности по профилю субъекта (Этап 1).
 *
 * Каждое правило F-* из `legal-catalogue.md` реализовано отдельной функцией,
 * которая возвращает либо null (запрета нет), либо BlockReason — пояснение,
 * почему данный вид наказания не может быть назначен этому лицу.
 *
 * Эта логика затем используется:
 *   1. UI Stage 1 — для подсветки заблокированных видов наказания.
 *   2. Движком — для усечения списка альтернатив в санкции.
 *   3. Юнит-тестами — для верификации каждого F-правила в отдельности.
 *
 * Источники:
 *   УК ст. 49 ч. 4, ст. 50 ч. 5, ст. 53 ч. 6, ст. 53.1 ч. 7, ст. 54 ч. 2,
 *   ст. 57 ч. 2, ст. 59 ч. 2; ПКС № 3-П/1999, ОКС № 1344-О-Р/2009; ППВС № 1/2011.
 */

import type { Subject } from '@domain/types';
import { DisabilityGroup, Gender, PunishmentKind } from '@domain/enums';
import type { RuleId } from '@legal/rules/catalogue';

// ────────────────────────────────────────────────────────────────────────────
// Возрастные хелперы
// ────────────────────────────────────────────────────────────────────────────

/** Полное число лет на дату `at`. Округление вниз, как в ст. 86 УК и ППВС № 1/2011. */
export function ageAt(birthDateIso: string, atIso: string): number {
  const birth = new Date(birthDateIso);
  const at = new Date(atIso);
  if (Number.isNaN(birth.getTime()) || Number.isNaN(at.getTime())) return NaN;
  let age = at.getFullYear() - birth.getFullYear();
  const m = at.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && at.getDate() < birth.getDate())) age--;
  return age;
}

// ────────────────────────────────────────────────────────────────────────────
// Тип результата
// ────────────────────────────────────────────────────────────────────────────

export interface BlockReason {
  ruleId: RuleId;
  /** Краткая причина для UI: «беременная», «военнослужащий», «инвалид I группы». */
  reason: string;
}

/** Карта: вид наказания → причина блокировки (если есть). */
export type BlockMap = Partial<Record<PunishmentKind, BlockReason>>;

// ────────────────────────────────────────────────────────────────────────────
// Правила (каждое — самостоятельная функция, чтобы тестировать изолированно)
// ────────────────────────────────────────────────────────────────────────────

/**
 * F-049-4. Запрет обязательных работ.
 * УК ст. 49 ч. 4: инвалиды I группы; беременные; женщины с ребёнком до 3 лет;
 * военнослужащие.
 */
function checkMandatoryWork(s: Subject): BlockReason | null {
  if (s.disability === DisabilityGroup.I)
    return { ruleId: 'F-049-4', reason: 'инвалид I группы' };
  if (s.isPregnant) return { ruleId: 'F-049-4', reason: 'беременная' };
  if (s.gender === Gender.Female && s.hasChildUnder3)
    return { ruleId: 'F-049-4', reason: 'женщина с ребёнком до 3 лет' };
  if (s.isMilitary) return { ruleId: 'F-049-4', reason: 'военнослужащий' };
  return null;
}

/**
 * F-050-5. Запрет исправительных работ.
 * УК ст. 50 ч. 5: те же категории, что F-049-4 (инвалиды I группы — отдельно
 * указаны прямо в норме).
 */
function checkCorrectionalWork(s: Subject): BlockReason | null {
  if (s.disability === DisabilityGroup.I)
    return { ruleId: 'F-050-5', reason: 'инвалид I группы' };
  if (s.isPregnant) return { ruleId: 'F-050-5', reason: 'беременная' };
  if (s.gender === Gender.Female && s.hasChildUnder3)
    return { ruleId: 'F-050-5', reason: 'женщина с ребёнком до 3 лет' };
  if (s.isMilitary) return { ruleId: 'F-050-5', reason: 'военнослужащий' };
  return null;
}

/**
 * F-053-6. Запрет ограничения свободы военнослужащим.
 */
function checkRestrictionOfFreedom(s: Subject): BlockReason | null {
  if (s.isMilitary) return { ruleId: 'F-053-6', reason: 'военнослужащий' };
  return null;
}

/**
 * F-053.1-7. Запрет принудительных работ.
 * УК ст. 53.1 ч. 7: несовершеннолетние; женщины 55+ или беременные или с
 * ребёнком до 3; мужчины 60+; инвалиды I/II группы; военнослужащие.
 *
 * Возраст оценивается на дату вынесения приговора `trialDateIso`. Если она не
 * передана — берётся «сегодня».
 */
function checkForcedWork(s: Subject, trialDateIso: string): BlockReason | null {
  const age = ageAt(s.birthDate, trialDateIso);
  if (age < 18) return { ruleId: 'F-053.1-7', reason: 'несовершеннолетний' };
  if (s.gender === Gender.Female) {
    if (age >= 55) return { ruleId: 'F-053.1-7', reason: 'женщина 55+' };
    if (s.isPregnant) return { ruleId: 'F-053.1-7', reason: 'беременная' };
    if (s.hasChildUnder3)
      return { ruleId: 'F-053.1-7', reason: 'женщина с ребёнком до 3 лет' };
  }
  if (s.gender === Gender.Male && age >= 60)
    return { ruleId: 'F-053.1-7', reason: 'мужчина 60+' };
  if (s.disability === DisabilityGroup.I || s.disability === DisabilityGroup.II)
    return { ruleId: 'F-053.1-7', reason: `инвалид ${s.disability} группы` };
  if (s.isMilitary) return { ruleId: 'F-053.1-7', reason: 'военнослужащий' };
  return null;
}

/**
 * F-054-2. Запрет ареста.
 * УК ст. 54 ч. 2: лица до 16 лет на момент вынесения; беременные; женщины с
 * ребёнком до 14.
 */
function checkArrest(s: Subject, trialDateIso: string): BlockReason | null {
  const age = ageAt(s.birthDate, trialDateIso);
  if (age < 16) return { ruleId: 'F-054-2', reason: 'до 16 лет на момент вынесения' };
  if (s.isPregnant) return { ruleId: 'F-054-2', reason: 'беременная' };
  if (s.gender === Gender.Female && s.hasChildUnder14)
    return { ruleId: 'F-054-2', reason: 'женщина с ребёнком до 14 лет' };
  return null;
}

/**
 * F-057-2. Запрет ПЛС.
 * УК ст. 57 ч. 2: женщины; лица до 18 на момент совершения; мужчины 65+ на
 * момент вынесения.
 *
 * NB: «до 18 на момент совершения» проверяется на этапе эпизода, а не профиля.
 * На уровне субъекта мы блокируем только по полу и возрасту на trialDate.
 */
function checkLifeImprisonment(s: Subject, trialDateIso: string): BlockReason | null {
  if (s.gender === Gender.Female) return { ruleId: 'F-057-2', reason: 'женщина' };
  const age = ageAt(s.birthDate, trialDateIso);
  if (s.gender === Gender.Male && age >= 65)
    return { ruleId: 'F-057-2', reason: 'мужчина 65+' };
  return null;
}

/**
 * F-059-2. Запрет смертной казни.
 * Та же категория, что F-057-2, плюс действующий мораторий по правовым позициям
 * КС РФ (ПКС № 3-П/1999, ОКС № 1344-О-Р/2009).
 */
function checkDeathPenalty(s: Subject, trialDateIso: string): BlockReason | null {
  // Сначала — мораторий: смертная казнь сейчас не применяется ни к кому.
  // Это самый сильный запрет, и он озвучивается отдельной причиной.
  const moratorium: BlockReason = {
    ruleId: 'F-059-2',
    reason: 'мораторий (ПКС № 3-П/1999, ОКС № 1344-О-Р/2009)',
  };
  // Если по профилю и так запрещено — выдадим более конкретную причину.
  const lifeBlock = checkLifeImprisonment(s, trialDateIso);
  if (lifeBlock) return { ruleId: 'F-059-2', reason: lifeBlock.reason };
  return moratorium;
}

/**
 * F-088-MODE. Несовершеннолетний на момент совершения — режим ст. 88 УК.
 * На уровне субъекта мы здесь не блокируем виды наказаний (это делают другие
 * F-правила), но передаём флаг через `isJuvenileRegime()`.
 *
 * Этот флаг учитывается:
 *   • E-088-* (лимиты ЛС, минимумы санкции / 2);
 *   • F-053.1-7 (несовершеннолетним принуд. работы запрещены — уже выше);
 *   • F-054-2 (до 16 → арест запрещён — уже выше).
 *
 * Возраст здесь — на момент совершения, а не на момент вынесения. Поскольку у
 * нас на Этапе 1 ещё нет конкретного эпизода, для UI используем возраст на
 * дату вынесения приговора как ориентир. Реальную проверку по дате эпизода
 * делает движок.
 */
export function isJuvenileRegime(s: Subject, trialDateIso: string): boolean {
  return ageAt(s.birthDate, trialDateIso) < 18;
}

// ────────────────────────────────────────────────────────────────────────────
// Сводная функция
// ────────────────────────────────────────────────────────────────────────────

/**
 * Возвращает карту «вид наказания → причина блокировки» для всех видов из
 * УК ст. 44, к которым применимы F-фильтры субъекта.
 *
 * Виды, для которых F-фильтры не применяются (штраф, лишение права, лишение
 * звания, лишение свободы), в карту не попадают.
 */
export function computeBlockedPunishments(
  subject: Subject,
  trialDateIso: string,
): BlockMap {
  const block: BlockMap = {};
  const set = (k: PunishmentKind, r: BlockReason | null) => {
    if (r) block[k] = r;
  };

  set(PunishmentKind.MandatoryWork, checkMandatoryWork(subject));
  set(PunishmentKind.CorrectionalWork, checkCorrectionalWork(subject));
  set(PunishmentKind.RestrictionOfFreedom, checkRestrictionOfFreedom(subject));
  set(PunishmentKind.ForcedWork, checkForcedWork(subject, trialDateIso));
  set(PunishmentKind.Arrest, checkArrest(subject, trialDateIso));
  set(PunishmentKind.LifeImprisonment, checkLifeImprisonment(subject, trialDateIso));
  set(PunishmentKind.DeathPenalty, checkDeathPenalty(subject, trialDateIso));

  // Военные виды — назначаются только военнослужащим.
  if (!subject.isMilitary) {
    block[PunishmentKind.MilitaryRestriction] = {
      ruleId: 'F-053-6', // используем тот же id (норма «военнослужащим — ограничение по службе» из ст. 51)
      reason: 'не военнослужащий',
    };
    block[PunishmentKind.DisciplinaryUnit] = {
      ruleId: 'F-053-6',
      reason: 'не военнослужащий',
    };
  }

  return block;
}
