import { useState } from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Profile } from '../types';
import { DEFAULT_PROFILE } from '../lib/storage';
import { generatePlan, mealMacros } from '../lib/planner';
import { getIngredient } from '../data/ingredients';
import { getRecipe } from '../data/recipes';
import i18n from '../i18n';
import WeekView from './WeekView';

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

function Harness({ p, initial = false }: { p: Profile; initial?: boolean }) {
  const [showHousehold, setShowHousehold] = useState(initial);
  const plan = generatePlan(p, { seed: 2026 });
  return (
    <WeekView
      plan={plan}
      profile={p}
      showHousehold={showHousehold}
      onShowHouseholdChange={setShowHousehold}
      onSwap={() => {}}
      onToggleLock={() => {}}
      onScale={() => {}}
      onOpenRecipe={() => {}}
      onRebalance={() => {}}
    />
  );
}

/** The grams shown for a meal's heaviest ingredient, worked out independently. */
function heaviestAmount(p: Profile, dayIndex: number, mealIndex: number, factor: number) {
  const meal = generatePlan(p, { seed: 2026 }).days[dayIndex].meals[mealIndex];
  const recipe = getRecipe(meal.recipeId);
  const top = recipe.ingredients
    .map((ri) => ({
      ing: getIngredient(ri.id),
      grams: (ri.fixed ? ri.g : ri.g * meal.scale) * factor,
    }))
    .sort((a, b) => b.grams - a.grams)[0];

  if (top.ing.unitWeight && top.grams / top.ing.unitWeight >= 0.8) {
    return `${Math.round(top.grams / top.ing.unitWeight)} st`;
  }
  return top.grams >= 1000
    ? `${(top.grams / 1000).toFixed(1).replace('.0', '')} kg`
    : `${Math.round(top.grams)} g`;
}

/**
 * The seven tiles of the day picker.
 *
 * Scoped to the labelled group rather than matched on their text: a tile reads
 * "Mån", and a meal card titled "Torskcurry med spenat" answers to /Tors/ just
 * as well. Counting buttons by weekday abbreviation made this suite hostage to
 * the recipe list.
 */
const dayTiles = () =>
  within(screen.getByRole('group', { name: /veckans dagar/i })).getAllByRole('button');

const dayTile = (name: RegExp) =>
  within(screen.getByRole('group', { name: /veckans dagar/i })).getByRole('button', { name });

describe('WeekView day selection', () => {
  it('shows one day at a time, with every meal of that day', () => {
    const p = profile();
    const plan = generatePlan(p, { seed: 2026 });
    render(<Harness p={p} />);

    // Seven day tiles, but only one day's meals rendered.
    expect(dayTiles()).toHaveLength(7);

    const shown = plan.days.filter((d) =>
      d.meals.every((m) => screen.queryAllByText(getRecipe(m.recipeId).name).length > 0),
    );
    expect(shown).toHaveLength(1);
    expect(shown[0].meals).toHaveLength(p.mealsPerDay);
  });

  it('switches the detail panel when another day is picked', async () => {
    const user = userEvent.setup();
    const p = profile();
    const plan = generatePlan(p, { seed: 2026 });
    render(<Harness p={p} />);

    await user.click(dayTile(/^Ons/));

    for (const meal of plan.days[2].meals) {
      expect(screen.getAllByText(getRecipe(meal.recipeId).name).length).toBeGreaterThan(0);
    }
  });

  it('marks the selected day', async () => {
    const user = userEvent.setup();
    render(<Harness p={profile()} />);

    const friday = dayTile(/^Fre/);
    await user.click(friday);

    expect(friday.getAttribute('aria-current')).toBe('true');
  });

  it('lists full ingredient amounts without needing the recipe popup', () => {
    const p = profile();
    render(<Harness p={p} />);
    expect(screen.getAllByText('Ingredienser').length).toBe(p.mealsPerDay);
  });
});

describe('WeekView household switch', () => {
  it('is not offered when you only cook for yourself', () => {
    render(<Harness p={profile()} />);
    expect(screen.queryByRole('button', { name: /din tallrik/i })).toBeNull();
  });

  it('is offered, and off by default, once someone else is added', () => {
    render(<Harness p={profile({ household: [ANNA] })} />);

    const yours = screen.getByRole('tab', { name: /din tallrik/i });
    expect(yours.getAttribute('aria-selected')).toBe('true');
    expect(screen.queryByText(/hela pannan/i)).toBeNull();
  });

  it('scales every listed amount by the household factor', async () => {
    const user = userEvent.setup();
    const p = profile({ household: [ANNA] });
    render(<Harness p={p} />);

    const today = (new Date().getDay() + 6) % 7;
    const solo = heaviestAmount(p, today, 0, 1);
    const shared = heaviestAmount(p, today, 0, 1.65);
    expect(solo).not.toBe(shared);

    expect(screen.getAllByText(solo).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('tab', { name: /Anna/ }));

    expect(screen.getAllByText(shared).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/hela pannan/i).length).toBe(p.mealsPerDay);
  });

  it('leaves your macros alone when showing household amounts', async () => {
    const user = userEvent.setup();
    const p = profile({ household: [ANNA] });
    const plan = generatePlan(p, { seed: 2026 });
    const today = (new Date().getDay() + 6) % 7;
    const yourKcal = String(Math.round(mealMacros(plan.days[today].meals[0]).kcal));

    render(<Harness p={p} />);
    expect(screen.getAllByText(yourKcal).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('tab', { name: /Anna/ }));

    // Still your plate's calories, not the pan's.
    expect(screen.getAllByText(yourKcal).length).toBeGreaterThan(0);
  });

  it('switches back to your own plate', async () => {
    const user = userEvent.setup();
    render(<Harness p={profile({ household: [ANNA] })} initial />);

    expect(screen.getAllByText(/hela pannan/i).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('tab', { name: /din tallrik/i }));

    expect(screen.queryByText(/hela pannan/i)).toBeNull();
  });

  it('links each ingredient to the ICA store search', () => {
    render(<Harness p={profile()} />);

    const links = screen
      .getAllByRole('link')
      .filter((a) => a.getAttribute('href')?.includes('handlaprivatkund.ica.se'));

    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link.getAttribute('href')).toContain('/search?q=');
      expect(link.getAttribute('rel')).toContain('noopener');
      expect(link.getAttribute('target')).toBe('_blank');
    }
  });
});
