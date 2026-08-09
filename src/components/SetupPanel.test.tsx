import { useState } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Profile } from '../types';
import { DEFAULT_PROFILE } from '../lib/storage';
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
  return (
    <>
      <SetupPanel profile={profile} onChange={setProfile} />
      <output data-testid="goal">{profile.goal}</output>
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

  it('puts the right cards behind each tab', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const cardsInView = () => screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);

    // Body is a single card since the weigh-in log went, which is the one
    // section that no longer fills its row. Pending a rebalance across tabs.
    expect(cardsInView()).toEqual(['Mått']);
    await openTab(user, /^mål$/i);
    expect(cardsInView()).toEqual(['Målsättning', 'Makrofördelning']);
    await openTab(user, /mat & kök/i);
    expect(cardsInView()).toEqual(['Mat', 'Så lagar du']);
  });

  it('honours the tab role it declares: arrow keys move between tabs', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    // The hand-rolled row announced role="tab" and then ignored every arrow
    // key, so a screen-reader user was told to expect navigation that did not
    // exist. Tabs implements the roving tabindex the role promises.
    await user.click(screen.getByRole('tab', { name: 'Kropp' }));
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: /^mål$/i }));

    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: /mat & kök/i }));

    // Wraps back round to the first.
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Kropp' }));
  });

  it('gives the tabs a panel to control, labelled by the open tab', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const panel = screen.getByRole('tabpanel');
    // Every tab points at a panel that exists — previously aria-controls was
    // absent and there was no tabpanel anywhere in the app.
    for (const tab of screen.getAllByRole('tab')) {
      expect(tab.getAttribute('aria-controls')).toBe(panel.id);
    }
    expect(panel.getAttribute('aria-labelledby')).toBe(
      screen.getByRole('tab', { name: 'Kropp' }).id,
    );

    await openTab(user, /mat & kök/i);
    expect(screen.getByRole('tabpanel').getAttribute('aria-labelledby')).toBe(
      screen.getByRole('tab', { name: /mat & kök/i }).id,
    );
  });

  it('names each training-day tile by its day, not by its initial', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await openTab(user, /^mål$/i);

    // The tile reads "M". The full day name used to arrive through the `title`
    // attribute's accessible-name fallback; with the tooltip now a description,
    // the name has to be explicit or this button announces as "M".
    expect(screen.getByRole('button', { name: 'Måndag' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Söndag' })).toBeTruthy();
  });

  it('opens on Body, with the measurements that drive everything else', () => {
    render(<Harness />);
    expect(screen.getByRole('tab', { name: 'Kropp' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByText('Mått')).toBeTruthy();
  });

  it('no longer carries the weigh-in log', () => {
    render(<Harness />);

    // Weight is now only ever typed into the measurements field; there is no
    // second place that writes it, and no trend readout to keep in step.
    expect(screen.queryByText('Invägning')).toBeNull();
    expect(screen.queryByPlaceholderText('kg')).toBeNull();
    expect(screen.queryByRole('button', { name: /logga i dag/i })).toBeNull();
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
