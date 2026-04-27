/**
 * Этап 3. Обстоятельства дела.
 *
 * Сверху — глобальный блок: дата приговора, особый порядок (УПК гл. 40),
 * досудебное соглашение (УПК гл. 40.1), суд присяжных. Эти флаги влияют
 * на коэффициенты ст. 62 ч. 2/5 и ст. 65 для всех эпизодов сразу.
 *
 * Ниже — по одной панели на каждый эпизод: смягчающие/отягчающие
 * (ст. 61 / ст. 63), флаги особых правил (ст. 62 ч. 1, 64, 65) и кнопка
 * ст. 15 ч. 6.
 */

import { useCaseStore } from '@state/case-store';

import { Card } from '../components/Card';
import { EpisodeContext } from './context/EpisodeContext';
import styles from './context/context.module.css';

export function ContextStage() {
  const context = useCaseStore((s) => s.caseFile.context);
  const episodes = useCaseStore((s) => s.caseFile.episodes);
  const updateContext = useCaseStore((s) => s.updateContext);

  return (
    <div className={styles.stack}>
      <Card
        title="Глобальный контекст (Этап 3)"
        description="Применяется ко ВСЕМ эпизодам: дата приговора, особый порядок (гл. 40 УПК), досудебное соглашение (гл. 40.1 УПК), суд присяжных (ст. 65 УК)."
      >
        <div className={styles.globalGrid}>
          <div>
            <label
              style={{
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: 'var(--text-tertiary)',
                fontWeight: 500,
                display: 'block',
                marginBottom: 4,
              }}
            >
              Дата вынесения приговора
            </label>
            <input
              type="date"
              value={context.trialDate ?? ''}
              onChange={(e) =>
                updateContext({ trialDate: e.target.value || undefined })
              }
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 13,
              }}
            />
            <p
              style={{
                fontSize: 11,
                color: 'var(--text-tertiary)',
                marginTop: 4,
                lineHeight: 1.4,
              }}
            >
              Используется как точка отсчёта для возрастных F-фильтров и для расчёта погашения судимости.
            </p>
          </div>

          <GlobalToggle
            label="Особый порядок (УПК гл. 40)"
            sub="Активирует E-062-5: max × 2/3 для всех эпизодов. Источник: ППВС № 60/2006 п. 13."
            checked={context.specialProcedure}
            onToggle={(v) => updateContext({ specialProcedure: v })}
          />

          <GlobalToggle
            label="Досудебное соглашение о сотрудничестве (УПК гл. 40.1)"
            sub="Активирует E-062-2: max × 1/2 (при наличии «и»/«к» и без отягчающих). Источник: ППВС № 16/2012."
            checked={context.preTrialAgreement}
            onToggle={(v) => updateContext({ preTrialAgreement: v })}
          />

          <GlobalToggle
            label="Дело рассматривал суд присяжных"
            sub="Открывает возможность ст. 65 УК для каждого эпизода (можно отметить ниже на конкретный эпизод). Источник: ППВС № 58/2015 п. 42."
            checked={context.juryTrial}
            onToggle={(v) => updateContext({ juryTrial: v })}
          />
        </div>
      </Card>

      <Card
        title="Контекст по эпизодам"
        description="Смягчающие, отягчающие, особые правила и кнопка «Применить ст. 15 ч. 6» — отдельно для каждого эпизода."
      >
        {episodes.length === 0 ? (
          <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
            Эпизодов нет. Добавьте их на Этапе 2 «Хронология».
          </p>
        ) : (
          <div className={styles.stack}>
            {episodes.map((e, i) => (
              <EpisodeContext
                key={e.id}
                episode={e}
                index={i}
                juryTrial={context.juryTrial}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────

interface GlobalToggleProps {
  label: string;
  sub: string;
  checked: boolean;
  onToggle: (next: boolean) => void;
}

function GlobalToggle({ label, sub, checked, onToggle }: GlobalToggleProps) {
  return (
    <label
      className={`${styles.globalToggle} ${checked ? styles.globalToggleActive : ''}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onToggle(e.target.checked)}
        style={{ marginTop: 2 }}
      />
      <span style={{ fontSize: 13, color: 'var(--text)' }}>
        <strong>{label}</strong>
        <span
          style={{
            display: 'block',
            marginTop: 2,
            fontSize: 11,
            color: 'var(--text-tertiary)',
            lineHeight: 1.4,
          }}
        >
          {sub}
        </span>
      </span>
    </label>
  );
}
