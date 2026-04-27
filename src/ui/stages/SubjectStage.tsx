/**
 * Этап 1. Профиль субъекта.
 *
 * Слева — форма ввода характеристик обвиняемого (пол, дата рождения, спец.
 * признаки). Справа — живая панель «Что можно назначить»: для каждого вида
 * наказания из УК ст. 44 показывается, разрешён он или заблокирован, и если
 * заблокирован — причина и id правила (F-049-4, F-053.1-7 и т. д.).
 *
 * Чистая часть логики (`computeBlockedPunishments`) живёт в
 * `legal/filters/subject-filters.ts` и переиспользуется движком и тестами.
 */

import { useMemo } from 'react';
import { useCaseStore } from '@state/case-store';
import {
  DisabilityGroup,
  Gender,
  PUNISHMENT_LABELS,
  PunishmentKind,
} from '@domain/enums';
import {
  ageAt,
  computeBlockedPunishments,
  isJuvenileRegime,
} from '@legal/filters/subject-filters';
import { RULES } from '@legal/rules/catalogue';

import { Card } from '../components/Card';
import { Field } from '../components/Field';
import {
  Checkbox,
  DateInput,
  RadioGroup,
  TextInput,
} from '../components/inputs';
import styles from './SubjectStage.module.css';

// Порядок видов наказаний — как в УК ст. 44 (от мягкого к строгому).
const PUNISHMENT_ORDER: PunishmentKind[] = [
  PunishmentKind.Fine,
  PunishmentKind.DeprivationOfRight,
  PunishmentKind.DeprivationOfTitle,
  PunishmentKind.MandatoryWork,
  PunishmentKind.CorrectionalWork,
  PunishmentKind.MilitaryRestriction,
  PunishmentKind.RestrictionOfFreedom,
  PunishmentKind.ForcedWork,
  PunishmentKind.Arrest,
  PunishmentKind.DisciplinaryUnit,
  PunishmentKind.Imprisonment,
  PunishmentKind.LifeImprisonment,
  PunishmentKind.DeathPenalty,
];

const GENDER_OPTIONS: { value: Gender; label: string; description?: string }[] = [
  { value: Gender.Male, label: 'Мужской' },
  { value: Gender.Female, label: 'Женский' },
];

const DISABILITY_OPTIONS: {
  value: DisabilityGroup;
  label: string;
  description?: string;
}[] = [
  { value: DisabilityGroup.None, label: 'Нет' },
  { value: DisabilityGroup.I, label: 'I группа', description: 'Самые тяжёлые ограничения' },
  { value: DisabilityGroup.II, label: 'II группа' },
  { value: DisabilityGroup.III, label: 'III группа' },
];

export function SubjectStage() {
  const subject = useCaseStore((s) => s.caseFile.subject);
  const trialDate = useCaseStore((s) => s.caseFile.context.trialDate);
  const updateSubject = useCaseStore((s) => s.updateSubject);

  const referenceDate = trialDate ?? new Date().toISOString().slice(0, 10);
  const age = subject.birthDate ? ageAt(subject.birthDate, referenceDate) : NaN;
  const isJuvenile = subject.birthDate
    ? isJuvenileRegime(subject, referenceDate)
    : false;

  const blocked = useMemo(
    () => computeBlockedPunishments(subject, referenceDate),
    [subject, referenceDate],
  );

  const isFemale = subject.gender === Gender.Female;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Card
        title="Профиль обвиняемого (Этап 1)"
        description="Данные субъекта определяют, какие виды наказания вообще могут быть назначены. Поля F-049-4 / F-053-6 / F-053.1-7 / F-054-2 / F-057-2 — автоматические."
      >
        <div className={styles.grid}>
          <Field label="ФИО (или инициалы)" hint="Можно оставить пустым для анонимизации">
            <TextInput
              value={subject.fullName ?? ''}
              onChange={(e) => updateSubject({ fullName: e.target.value || undefined })}
              placeholder="напр. Иванов И. И."
            />
          </Field>

          <Field label="Гражданство" hint="Опционально, для шаблона приговора">
            <TextInput
              value={subject.citizenship ?? ''}
              onChange={(e) => updateSubject({ citizenship: e.target.value || undefined })}
              placeholder="напр. Российская Федерация"
            />
          </Field>

          <Field label="Пол">
            <RadioGroup<Gender>
              value={subject.gender}
              options={GENDER_OPTIONS}
              onChange={(g) => {
                // Снимаем «беременная / ребёнок» при смене на мужской — иначе
                // в фильтрах появятся противоречивые условия.
                if (g === Gender.Male) {
                  updateSubject({
                    gender: g,
                    isPregnant: false,
                  });
                } else {
                  updateSubject({ gender: g });
                }
              }}
            />
          </Field>

          <Field label="Дата рождения" hint="Используется в ст. 53.1, 54, 57, 88 УК">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <DateInput
                value={subject.birthDate}
                onChange={(e) => updateSubject({ birthDate: e.target.value })}
              />
              {Number.isFinite(age) && (
                <span
                  className={`${styles.ageBadge} ${
                    isJuvenile ? styles.ageBadgeJuvenile : ''
                  }`}
                >
                  {age} {pluralYears(age)}
                  {isJuvenile && ' · режим ст. 88'}
                </span>
              )}
            </div>
          </Field>

          <div className={`${styles.fullRow} ${styles.section}`}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>Особые признаки</span>
              <span className={styles.sectionHint}>
                Влияют на запреты ст. 49 ч. 4, 50 ч. 5, 53.1 ч. 7, 54 ч. 2 УК
              </span>
            </div>
            <div className={styles.toggleStack}>
              <Checkbox
                checked={isFemale && subject.isPregnant}
                onChange={(v) => updateSubject({ isPregnant: v })}
                label={
                  isFemale ? (
                    'Беременная'
                  ) : (
                    <span style={{ color: 'var(--text-tertiary)' }}>
                      Беременная (только для женского пола)
                    </span>
                  )
                }
              />
              <Checkbox
                checked={subject.hasChildUnder3}
                onChange={(v) => updateSubject({ hasChildUnder3: v })}
                label="Имеет ребёнка до 3 лет"
              />
              <Checkbox
                checked={subject.hasChildUnder14}
                onChange={(v) => updateSubject({ hasChildUnder14: v })}
                label="Имеет ребёнка до 14 лет"
              />
              <Checkbox
                checked={subject.isMilitary}
                onChange={(v) => updateSubject({ isMilitary: v })}
                label="Военнослужащий (по призыву или контракту)"
              />
              <Checkbox
                checked={subject.hasStateAwards}
                onChange={(v) => updateSubject({ hasStateAwards: v })}
                label="Имеет государственные награды / специальные звания (для ст. 48 УК)"
              />
            </div>
          </div>

          <div className={`${styles.fullRow} ${styles.section}`}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>Группа инвалидности</span>
              <span className={styles.sectionHint}>УК ст. 49 ч. 4, ст. 50 ч. 5, ст. 53.1 ч. 7</span>
            </div>
            <RadioGroup<DisabilityGroup>
              value={subject.disability}
              options={DISABILITY_OPTIONS}
              onChange={(d) => updateSubject({ disability: d })}
            />
          </div>
        </div>
      </Card>

      {isJuvenile && (
        <div className={styles.juvenileBanner}>
          <span className={styles.juvenileBannerTitle}>
            Включён режим несовершеннолетних (ст. 87, 88 УК)
          </span>
          <span className={styles.juvenileBannerNote}>
            Лимиты ЛС 6/10 лет; минимумы санкции / 2 (ст. 88 ч. 6.1); запрет ряда наказаний.
            Финальная проверка по дате эпизода — на Этапе 2. Источник: ППВС № 1/2011.
          </span>
        </div>
      )}

      <Card
        title="Что можно назначить"
        description="Виды наказания УК ст. 44 — с учётом текущего профиля. Заблокированные виды движок не предложит."
        tone="info"
      >
        <div className={styles.filterTable}>
          {PUNISHMENT_ORDER.map((kind) => {
            const block = blocked[kind];
            const isBlocked = Boolean(block);
            return (
              <div
                key={kind}
                className={`${styles.filterRow} ${
                  isBlocked ? styles.filterRowBlocked : ''
                }`}
              >
                <span
                  className={`${styles.filterStatus} ${
                    isBlocked ? styles.filterStatusBlocked : styles.filterStatusOk
                  }`}
                >
                  {isBlocked ? '×' : '✓'}
                </span>
                <span
                  className={`${styles.filterTitle} ${
                    isBlocked ? styles.filterTitleBlocked : ''
                  }`}
                >
                  {PUNISHMENT_LABELS[kind]}
                  {block && (
                    <span className={styles.filterRuleId} title={RULES[block.ruleId].norm}>
                      {block.ruleId}
                    </span>
                  )}
                </span>
                {block && <span className={styles.filterReason}>{block.reason}</span>}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Утилиты
// ────────────────────────────────────────────────────────────────────────────

function pluralYears(n: number): string {
  const abs = Math.abs(n);
  const last = abs % 10;
  const last2 = abs % 100;
  if (last2 >= 11 && last2 <= 14) return 'лет';
  if (last === 1) return 'год';
  if (last >= 2 && last <= 4) return 'года';
  return 'лет';
}
