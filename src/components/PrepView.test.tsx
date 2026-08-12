import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Profile, WeekPlan } from '../types';
import { DEFAULT_PROFILE } from '../lib/storage';
import { generatePlan, prepPlan } from '../lib/planner';
import { getIngredient } from '../data/ingredients';
import { getRecipe } from '../data/recipes';
import { macrosForKcal } from '../lib/nutrition';
import i18n from '../i18n';
import PrepView from './PrepView';

/** These assertions read Swedish, so the language is pinned in beforeEach below. */
const DAGAR = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag'];

beforeEach(async () => {
  // Pinned rather than defaulted: these assert Swedish chrome, and the app's
  // default language is English. What is under test here is the Swedish
  // bundle, not what a first-time visitor lands in — that has its own test in
  // i18n.test.tsx.
  await i18n.changeLanguage('sv');
});
afterEach(cleanup);

const ANNA = { id: 'w', name: 'Anna', portionFactor: 0.65 };
const profile = (over: Partial<Profile> = {}): Profile => ({ ...DEFAULT_PROFILE, ...over });
/**
 * A week with at least two cook sessions in it, which is what a view that
 * renders a list of them has to be tested against.
 *
 * Found by searching seeds rather than hardcoding one. Two hardcoded seeds have
 * already gone stale here — 2026 and then 2027 — because how often a week
 * repeats a batch-friendly dinner depends on the whole recipe pool, and the
 * pool grows. About 59% of weeks qualify, so the search settles immediately;
 * what it buys is that growing the pool again cannot turn a passing test into
 * a confusing failure about a missing plural.
 *
 * Still deterministic: the same seed is found every run, so a fixture is stable
 * within a run and across them.
 */
const SESSION_SEED = (() => {
  for (let seed = 1; seed < 200; seed++) {
    if (prepPlan(generatePlan(profile(), { seed })).length >= 2) return seed;
  }
  throw new Error('no seed in 200 produces a week with two cook sessions');
})();

const plan = () => generatePlan(profile(), { seed: SESSION_SEED });

function manySessions(): WeekPlan {
  return plan();
}

/** A week where the same non-batchable meal repeats, so nothing can be prepped. */
function unbatchablePlan(): WeekPlan {
  const target = macrosForKcal(profile(), 2000);
  return {
    createdAt: 0,
    days: Array.from({ length: 7 }, (_, index) => ({
      index,
      training: false,
      target,
      // proteinshake is explicitly not batchFriendly.
      meals: [{ slot: 'snack' as const, recipeId: 'proteinshake', scale: 1 }],
    })),
  };
}

describe('PrepView', () => {
  it('explains itself when there is nothing to batch', () => {
    render(<PrepView plan={unbatchablePlan()} profile={profile()} onOpenRecipe={() => {}} />);

    expect(screen.getByText(/inget att satsvislaga den här veckan/i)).toBeTruthy();
    expect(screen.queryByText(/förberedelseschema/i)).toBeNull();
  });

  it('lists every cook session, grouped under the day it is cooked', () => {
    const p = plan();
    const tasks = prepPlan(p);
    render(<PrepView plan={p} profile={profile()} onOpenRecipe={() => {}} />);

    const schedule = screen.getByRole('list', { name: /förberedelseschema/i });
    for (const task of tasks) {
      expect(within(schedule).getAllByText(getRecipe(task.recipeId).name).length).toBeGreaterThan(0);
    }
    for (const dayIndex of new Set(tasks.map((t) => t.dayIndex))) {
      expect(screen.getAllByText(`Laga på ${DAGAR[dayIndex]}`).length).toBeGreaterThan(0);
    }
  });

  it('summarises the whole prep load', () => {
    const p = manySessions();
    const tasks = prepPlan(p);
    render(<PrepView plan={p} profile={profile()} onOpenRecipe={() => {}} />);

    const mealsCovered = tasks.reduce((s, t) => s + t.servings, 0);

    // Each stat sits next to its label, so check the pair rather than a bare number.
    const statFor = (label: string) =>
      screen.getByText(label).parentElement?.querySelector('.tnum')?.textContent;

    expect(statFor('tillagningstillfällen')).toBe(String(tasks.length));
    expect(statFor('måltider täckta')).toBe(String(mealsCovered));
  });

  it('points at the longest job to start with', () => {
    const p = plan();
    const longest = prepPlan(p).reduce((a, b) => (b.minutes > a.minutes ? b : a));
    render(<PrepView plan={p} profile={profile()} onOpenRecipe={() => {}} />);

    expect(screen.getByText(/börja med/i).textContent).toContain(
      getRecipe(longest.recipeId).name,
    );
  });

  it('shows the first session in detail by default', () => {
    const p = plan();
    const first = prepPlan(p)[0];
    render(<PrepView plan={p} profile={profile()} onOpenRecipe={() => {}} />);

    expect(screen.getByText('Laga så här mycket')).toBeTruthy();
    expect(screen.getByText('Tillvägagångssätt')).toBeTruthy();
    // Its method steps are on screen, not just the title.
    expect(screen.getByText(getRecipe(first.recipeId).stepsLocal[0])).toBeTruthy();
  });

  it('switches the detail panel when another session is picked', async () => {
    const user = userEvent.setup();
    const p = manySessions();
    const tasks = prepPlan(p);
    render(<PrepView plan={p} profile={profile()} onOpenRecipe={() => {}} />);

    const second = getRecipe(tasks[1].recipeId);
    await user.click(screen.getByRole('button', { name: new RegExp(second.name, 'i') }));

    expect(screen.getByText(second.stepsLocal[0])).toBeTruthy();
  });

  it('has no checkboxes in the schedule', () => {
    render(<PrepView plan={plan()} profile={profile()} onOpenRecipe={() => {}} />);
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
  });

  it('marks which session is being shown', async () => {
    const user = userEvent.setup();
    const p = manySessions();
    const tasks = prepPlan(p);
    render(<PrepView plan={p} profile={profile()} onOpenRecipe={() => {}} />);

    const second = getRecipe(tasks[1].recipeId);
    const row = screen.getByRole('button', { name: new RegExp(second.name, 'i') });
    await user.click(row);

    expect(row.getAttribute('aria-current')).toBe('true');
  });

  it('scales the cook quantities by the household', () => {
    const p = plan();
    const task = prepPlan(p)[0];
    const recipe = getRecipe(task.recipeId);
    const heaviest = recipe.ingredients
      .map((ri) => ({
        ing: getIngredient(ri.id),
        solo: ri.fixed ? ri.g * task.servings : ri.g * task.totalScale,
      }))
      .sort((a, b) => b.solo - a.solo)[0];

    // Mirrors `useQuantityFormat`, including its number formatting: these
    // assertions run pinned to Swedish, where a kilo reads "1,1 kg" and not
    // "1.1 kg". Writing the decimal with a point made this pass only for as
    // long as no quantity here reached a kilo, which is not a property of the
    // formatting under test but of whichever recipe the planner happened to
    // batch first.
    const sv = (value: number, decimals = 0) =>
      new Intl.NumberFormat('sv', { maximumFractionDigits: decimals }).format(value);

    const amount = (grams: number) =>
      heaviest.ing.unitWeight && grams / heaviest.ing.unitWeight >= 0.8
        ? `${Math.round(grams / heaviest.ing.unitWeight)} st`
        : grams >= 1000
          ? `${sv(grams / 1000, 1).replace(/[.,]0$/, '')} kg`
          : `${sv(Math.round(grams))} g`;

    const { unmount } = render(
      <PrepView plan={p} profile={profile()} onOpenRecipe={() => {}} />,
    );
    expect(screen.getAllByText(amount(heaviest.solo)).length).toBeGreaterThan(0);
    unmount();

    render(
      <PrepView plan={p} profile={profile({ household: [ANNA] })} onOpenRecipe={() => {}} />,
    );
    expect(screen.getAllByText(amount(heaviest.solo * 1.65)).length).toBeGreaterThan(0);
  });

  it('always gives storage guidance for the selected session', () => {
    render(<PrepView plan={plan()} profile={profile()} onOpenRecipe={() => {}} />);
    expect(screen.getByText(/håller 3–4 dagar|ät inom 2 dagar/i)).toBeTruthy();
  });

  it('warns to eat fish batches sooner', async () => {
    // The guidance is shown for the *selected* session, so the fish one has to
    // be selected before it can be asserted. Rendering and looking was enough
    // only while the fish batch happened to sort first, which is a property of
    // whichever recipes the planner picked rather than of the warning.
    const user = userEvent.setup();
    const p = plan();
    const fishTask = prepPlan(p).find((t) =>
      getRecipe(t.recipeId).ingredients.some((ri) => getIngredient(ri.id).tags.includes('fish')),
    );
    if (!fishTask) return; // No fish batch in this fixture; nothing to assert.

    render(<PrepView plan={p} profile={profile()} onOpenRecipe={() => {}} />);
    await user.click(
      screen.getByRole('button', { name: new RegExp(getRecipe(fishTask.recipeId).name, 'i') }),
    );
    expect(screen.getByText(/ät inom 2 dagar/i)).toBeTruthy();
  });

  it('links the cook quantities to the ICA store search', () => {
    render(<PrepView plan={plan()} profile={profile()} onOpenRecipe={() => {}} />);

    const quantities = screen.getByRole('list', { name: /tillagningsmängder/i });
    const links = within(quantities).getAllByRole('link');

    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link.getAttribute('href')).toContain('handlaprivatkund.ica.se');
      expect(link.getAttribute('href')).toContain('/search?q=');
    }
  });

  it('offers the source page only for recipes that have one', () => {
    const p = plan();
    render(<PrepView plan={p} profile={profile()} onOpenRecipe={() => {}} />);

    // The selected task is the first one; it links out only if we matched it.
    const shown = getRecipe(prepPlan(p)[0].recipeId);
    // The label is the source's own host, so a recipe sourced anywhere but
    // ica.se names that host rather than claiming to be ICA.
    const sourceLink = screen.queryByRole('link', { name: /ica\.se ↗/ });

    if (shown.sourceUrl) expect(sourceLink?.getAttribute('href')).toBe(shown.sourceUrl);
    else expect(sourceLink).toBeNull();
  });
});
