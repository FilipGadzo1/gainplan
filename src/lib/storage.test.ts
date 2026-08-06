import { beforeEach, describe, expect, it } from 'vitest';
import type { WeekPlan } from '../types';
import {
  DEFAULT_PROFILE,
  loadChecked,
  loadPlan,
  loadProfile,
  resetAll,
  saveChecked,
  savePlan,
  saveProfile,
} from './storage';
import { generatePlan } from './planner';

const plan = (seed: number) => generatePlan(DEFAULT_PROFILE, { seed });

beforeEach(() => localStorage.clear());

describe('profile region', () => {
  it('defaults a profile written before regions existed to Sweden', () => {
    const { region: _dropped, ...preRegion } = DEFAULT_PROFILE;
    localStorage.setItem('gainplan.profile.v1', JSON.stringify(preRegion));

    expect(loadProfile()?.region).toBe('se');
  });

  it('refuses a region this build does not have', () => {
    localStorage.setItem(
      'gainplan.profile.v1',
      JSON.stringify({ ...DEFAULT_PROFILE, region: 'atlantis' }),
    );

    // The rest of the profile has to survive it — body stats are expensive to
    // re-enter and have nothing to do with where you shop.
    const loaded = loadProfile();
    expect(loaded?.region).toBe('se');
    expect(loaded?.weightKg).toBe(DEFAULT_PROFILE.weightKg);
  });

  it('keeps a region it does have', () => {
    saveProfile({ ...DEFAULT_PROFILE, region: 'se', weightKg: 91 });
    expect(loadProfile()).toMatchObject({ region: 'se', weightKg: 91 });
  });
});

describe('per-region namespacing', () => {
  it('stores the plan under a key naming its region', () => {
    savePlan('se', plan(1));
    expect(localStorage.getItem('gainplan.plan.se.v1')).not.toBeNull();
    expect(localStorage.getItem('gainplan.plan.v1')).toBeNull();
  });

  it('keeps checked items apart from the plan', () => {
    saveChecked('se', new Set(['banan', 'agg']));
    expect(loadChecked('se')).toEqual(new Set(['banan', 'agg']));
  });

  it('clears every region on reset', () => {
    savePlan('se', plan(2));
    saveChecked('se', new Set(['banan']));
    saveProfile(DEFAULT_PROFILE);

    resetAll();

    expect(loadPlan('se')).toBeNull();
    expect(loadChecked('se').size).toBe(0);
    expect(loadProfile()).toBeNull();
  });
});

describe('migrating a pre-region store', () => {
  it('moves an unnamespaced plan into Sweden and drops the old key', () => {
    const original = plan(3);
    localStorage.setItem('gainplan.plan.v1', JSON.stringify(original));

    expect(loadPlan('se')?.createdAt).toBe(original.createdAt);
    expect(localStorage.getItem('gainplan.plan.v1')).toBeNull();
  });

  it('moves unnamespaced checked items too', () => {
    localStorage.setItem('gainplan.checked.v1', JSON.stringify(['banan']));

    expect(loadChecked('se')).toEqual(new Set(['banan']));
    expect(localStorage.getItem('gainplan.checked.v1')).toBeNull();
  });

  it('does not overwrite a namespaced plan that already exists', () => {
    const current = plan(4);
    savePlan('se', current);
    localStorage.setItem('gainplan.plan.v1', JSON.stringify(plan(5)));

    expect(loadPlan('se')?.createdAt).toBe(current.createdAt);
    expect(localStorage.getItem('gainplan.plan.v1')).toBeNull();
  });
});

describe('rejecting a plan the region cannot cook', () => {
  it('discards a plan naming a recipe the region does not have', () => {
    const good = plan(6);
    const bad: WeekPlan = {
      ...good,
      days: good.days.map((d, i) =>
        i === 3 ? { ...d, meals: [{ ...d.meals[0], recipeId: 'sarma' }] } : d,
      ),
    };
    savePlan('se', bad);

    // All of it, not just the offending day: a week missing a day would look
    // like a planner bug rather than a storage one.
    expect(loadPlan('se')).toBeNull();
  });

  it('keeps a plan whose recipes all belong to the region', () => {
    const good = plan(7);
    savePlan('se', good);
    expect(loadPlan('se')?.createdAt).toBe(good.createdAt);
  });

  it('discards a plan with no days rather than handing the views a husk', () => {
    localStorage.setItem('gainplan.plan.se.v1', JSON.stringify({ createdAt: 1 }));
    expect(loadPlan('se')).toBeNull();
  });

  it('discards a day with no meals', () => {
    const good = plan(8);
    savePlan('se', { ...good, days: good.days.map((d, i) => (i === 2 ? { ...d, meals: null } : d)) } as never);
    expect(loadPlan('se')).toBeNull();
  });
});
