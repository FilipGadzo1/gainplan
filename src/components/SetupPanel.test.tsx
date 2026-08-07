import { useState } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Profile } from '../types';
import { DEFAULT_PROFILE, type WeightEntry } from '../lib/storage';
import { baseKcal, macrosForKcal } from '../lib/nutrition';
import i18n from '../i18n';
import SetupPanel from './SetupPanel';

beforeEach(async () => {
  // Pinned rather than defaulted: these assert Swedish chrome, and the app's
  // default language is English. What is under test here is the Swedish
  // bundle, not what a first-time visitor lands in — that has its own test in
  // i18n.test.tsx.
  await i18n.changeLanguage('sv');
});
afterEach(cleanup);

function Harness({ initial = DEFAULT_PROFILE }: { initial?: Profile }) {
  const [profile, setProfile] = useState<Profile>(initial);
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  return (
    <>
      <SetupPanel
        profile={profile}
        onChange={setProfile}
        weights={weights}
        onWeightsChange={setWeights}
      />
      <output data-testid="goal">{profile.goal}</output>
      <output data-testid="weight">{profile.weightKg}</output>
    </>
  );
}

/** Text of the always-visible target bar. Numbers sit next to their units, so
 *  substring checks are more robust here than exact-node matching. */
const heroText = () =>
  screen.getByRole('region', { name: /sammanfattning av dagligt mål/i }).textContent ?? '';
const openTab = (user: ReturnType<typeof userEvent.setup>, name: RegExp) =>
  user.click(screen.getByRole('tab', { name }));

describe('Setup structure', () => {
  it('splits the form into three sections so each one fits a 1080p viewport', () => {
    render(<Harness />);
    const tabs = screen.getAllByRole('tab').map((t) => t.textContent);
    expect(tabs).toEqual(['Kropp', 'Mål', 'Mat & kök']);
  });

  it('gives every section two cards, since one card leaves the row half empty', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const cardsInView = () => screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);

    expect(cardsInView()).toEqual(['Mått', 'Invägning']);
    await openTab(user, /^mål$/i);
    expect(cardsInView()).toEqual(['Målsättning', 'Makrofördelning']);
    await openTab(user, /mat & kök/i);
    expect(cardsInView()).toEqual(['Mat', 'Så lagar du']);
  });

  it('opens on Body, with the measurements that drive everything else', () => {
    render(<Harness />);
    expect(screen.getByRole('tab', { name: 'Kropp' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByText('Mått')).toBeTruthy();
  });

  it('keeps the weigh-in log beside the weight it updates', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    // Both live in Body — logging a weigh-in is what keeps the number honest.
    expect(screen.getByText('Invägning')).toBeTruthy();

    await user.type(screen.getByPlaceholderText('kg'), '84.5');
    await user.click(screen.getByRole('button', { name: /logga i dag/i }));

    expect(screen.getByTestId('weight').textContent).toBe('84.5');
  });

  it('groups household with how you cook rather than with meal settings', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    expect(screen.queryByText('Lagar mat åt')).toBeNull();
    await openTab(user, /mat & kök/i);

    // Both sit in the kitchen card now; neither filled a card alone.
    expect(screen.getByText('Lagar mat åt')).toBeTruthy();
    expect(screen.getByText(/max tillagningstid/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /lägg till någon/i })).toBeTruthy();
  });

  it('groups meal count with the exclusions, since both answer what you eat', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await openTab(user, /mat & kök/i);
    const food = screen.getByText('Mat').closest('section');
    expect(food).toBeTruthy();
    expect(food!.textContent).toContain('Måltider per dag');
    expect(food!.textContent).toContain('Det du inte äter');
    expect(food!.textContent).not.toMatch(/max tillagningstid/i);
  });
});

describe('Setup target readout', () => {
  it('shows the calculated target and macros', () => {
    render(<Harness />);
    const macros = macrosForKcal(DEFAULT_PROFILE, baseKcal(DEFAULT_PROFILE));

    expect(heroText()).toContain(String(baseKcal(DEFAULT_PROFILE)));
    expect(heroText()).toContain(`${macros.protein}g`);
    expect(heroText()).toContain(`${macros.carbs}g`);
    expect(heroText()).toContain(`${macros.fat}g`);
  });

  it('stays visible from every section', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    for (const tab of [/^mål$/i, /mat & kök/i, /kropp/i]) {
      await openTab(user, tab);
      expect(heroText()).toContain(String(baseKcal(DEFAULT_PROFILE)));
    }
  });

  it('updates immediately when the goal changes, from another section', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const before = baseKcal(DEFAULT_PROFILE);
    expect(heroText()).toContain(String(before));

    await openTab(user, /^mål$/i);
    await user.click(screen.getByRole('button', { name: /^Deff/ }));

    const after = baseKcal({ ...DEFAULT_PROFILE, goal: 'cut', proteinPerKg: 2.2 });
    expect(after).toBeLessThan(before);

    expect(screen.getByTestId('goal').textContent).toBe('cut');
    expect(heroText()).toContain(String(after));
    expect(heroText()).not.toContain(String(before));
  });

  it('reports the offset from maintenance rather than making you work it out', () => {
    render(<Harness />);
    expect(heroText()).toMatch(/Underhåll \d+/);
    expect(heroText()).toMatch(/\+\d+ kcal/);
  });
});
