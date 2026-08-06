import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import type { Profile, WeekPlan } from '../types';
import { DEFAULT_PROFILE } from '../lib/storage';
import { generatePlan, prepPlan } from '../lib/planner';
import { getIngredient } from '../data/ingredients';
import { getRecipe } from '../data/recipes';
import { macrosForKcal } from '../lib/nutrition';
import PrepView from './PrepView';

/** Swedish is the default language, so that is what these assertions read. */
const DAGAR = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag'];

afterEach(cleanup);

const ANNA = { id: 'w', name: 'Anna', portionFactor: 0.65 };
const profile = (over: Partial<Profile> = {}): Profile => ({ ...DEFAULT_PROFILE, ...over });
const plan = () => generatePlan(profile(), { seed: 2026 });

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
    const p = plan();
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
    expect(screen.getByText(getRecipe(first.recipeId).stepsSv[0])).toBeTruthy();
  });

  it('switches the detail panel when another session is picked', async () => {
    const user = userEvent.setup();
    const p = plan();
    const tasks = prepPlan(p);
    if (tasks.length < 2) throw new Error('fixture needs at least two sessions');
    render(<PrepView plan={p} profile={profile()} onOpenRecipe={() => {}} />);

    const second = getRecipe(tasks[1].recipeId);
    await user.click(screen.getByRole('button', { name: new RegExp(second.name, 'i') }));

    expect(screen.getByText(second.stepsSv[0])).toBeTruthy();
  });

  it('has no checkboxes in the schedule', () => {
    render(<PrepView plan={plan()} profile={profile()} onOpenRecipe={() => {}} />);
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
  });

  it('marks which session is being shown', async () => {
    const user = userEvent.setup();
    const p = plan();
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

    const amount = (grams: number) =>
      heaviest.ing.unitWeight && grams / heaviest.ing.unitWeight >= 0.8
        ? `${Math.round(grams / heaviest.ing.unitWeight)} st`
        : grams >= 1000
          ? `${(grams / 1000).toFixed(1).replace('.0', '')} kg`
          : `${Math.round(grams)} g`;

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

  it('warns to eat fish batches sooner', () => {
    const p = plan();
    const fishTask = prepPlan(p).find((t) =>
      getRecipe(t.recipeId).ingredients.some((ri) => getIngredient(ri.id).tags.includes('fish')),
    );
    if (!fishTask) return; // No fish batch in this fixture; nothing to assert.

    render(<PrepView plan={p} profile={profile()} onOpenRecipe={() => {}} />);
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

  it('offers the ICA page only for recipes that have one', () => {
    const p = plan();
    render(<PrepView plan={p} profile={profile()} onOpenRecipe={() => {}} />);

    // The selected task is the first one; it links out only if we matched it.
    const shown = getRecipe(prepPlan(p)[0].recipeId);
    const icaLink = screen.queryByRole('link', { name: /ICA ↗/ });

    if (shown.sourceUrl) expect(icaLink?.getAttribute('href')).toBe(shown.sourceUrl);
    else expect(icaLink).toBeNull();
  });
});
