import { describe, expect, it } from 'vitest';
import { DEPT_IDS } from '../../types';
import { AE_INGREDIENTS } from './ingredients';

describe('the UAE catalogue', () => {
  it('carries enough of a shop to plan a week from', () => {
    expect(AE_INGREDIENTS.length).toBeGreaterThanOrEqual(80);
  });

  it('prefixes every id, so it cannot collide with another region', () => {
    for (const ing of AE_INGREDIENTS) expect(ing.id.startsWith('ae-'), ing.id).toBe(true);
  });

  it('gives no two rows the same id', () => {
    const ids = AE_INGREDIENTS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('stocks every department', () => {
    const stocked = new Set(AE_INGREDIENTS.map((i) => i.dept));
    for (const dept of DEPT_IDS) expect(stocked.has(dept), dept).toBe(true);
  });

  it('names each row once, because the region speaks English', () => {
    // This is what makes the subtitle collapse fire. A row where the two differ
    // would render a subtitle in a region that has no second language.
    for (const ing of AE_INGREDIENTS) {
      expect(ing.name, ing.id).toBe(ing.en);
      expect(ing.packName, ing.id).toBe(ing.packNameEn);
    }
  });

  it('gives every row a plausible price and pack', () => {
    for (const ing of AE_INGREDIENTS) {
      expect(ing.pricePerKg, ing.id).toBeGreaterThan(0);
      expect(ing.packSize, ing.id).toBeGreaterThan(0);
      expect(ing.name.trim(), ing.id).not.toBe('');
      expect(ing.packName.trim(), ing.id).not.toBe('');
    }
  });

  it('does not claim a food is made of nothing', () => {
    // A row with zero calories and zero macros is a typo, not a food.
    for (const ing of AE_INGREDIENTS) {
      const total = ing.protein + ing.carbs + ing.fat;
      expect(total, `${ing.id} has no macros at all`).toBeGreaterThan(0);
      expect(ing.kcal, ing.id).toBeGreaterThan(0);
    }
  });

  it('tags the things a restricted eater has to avoid', () => {
    const byId = new Map(AE_INGREDIENTS.map((i) => [i.id, i]));
    const mustHave: [string, string][] = [
      ['ae-chicken-breast', 'meat'],
      ['ae-salmon-fillet', 'fish'],
      ['ae-eggs', 'egg'],
    ];
    for (const [id, tag] of mustHave) {
      const ing = byId.get(id);
      expect(ing, `catalogue is missing ${id}`).toBeTruthy();
      expect(ing!.tags, id).toContain(tag);
    }
  });

  it('tags pork as pork, so the diet filter can drop it', () => {
    const pork = AE_INGREDIENTS.filter((i) => i.tags.includes('pork'));
    expect(pork.length, 'catalogue should carry pork rows').toBeGreaterThan(0);
    // Pork is meat before it is pork. A vegetarian filter keys off `meat`, and
    // a row tagged only `pork` would slip through it.
    for (const ing of pork) expect(ing.tags, ing.id).toContain('meat');
  });
});
