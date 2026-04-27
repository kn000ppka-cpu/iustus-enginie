import { describe, expect, it } from 'vitest';

import {
  AGGRAVATING,
  MITIGATING,
  hasArt62_1Trigger,
  getMitigating,
  getAggravating,
} from '../circumstances';

describe('circumstances справочники', () => {
  it('id уникальны в смягчающих', () => {
    const ids = new Set(MITIGATING.map((m) => m.id));
    expect(ids.size).toBe(MITIGATING.length);
  });

  it('id уникальны в отягчающих', () => {
    const ids = new Set(AGGRAVATING.map((a) => a.id));
    expect(ids.size).toBe(AGGRAVATING.length);
  });

  it('и и к помечены triggersArt62_1', () => {
    expect(getMitigating('i')?.triggersArt62_1).toBe(true);
    expect(getMitigating('k')?.triggersArt62_1).toBe(true);
  });

  it('остальные смягчающие не триггерят ст. 62 ч. 1', () => {
    for (const m of MITIGATING) {
      if (m.id !== 'i' && m.id !== 'k') {
        expect(m.triggersArt62_1, m.id).not.toBe(true);
      }
    }
  });

  it('hasArt62_1Trigger: и + любые → true', () => {
    expect(hasArt62_1Trigger(['a', 'i'])).toBe(true);
    expect(hasArt62_1Trigger(['k'])).toBe(true);
    expect(hasArt62_1Trigger(['a', 'b'])).toBe(false);
    expect(hasArt62_1Trigger([])).toBe(false);
  });

  it('getAggravating находит существующие', () => {
    expect(getAggravating('ag_a')?.norm).toMatch(/63 ч\. 1/);
    expect(getAggravating('not_exists')).toBeUndefined();
  });
});
