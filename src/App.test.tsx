import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from './App';
import { DEFAULT_PROFILE } from './lib/storage';
import { generatePlan } from './lib/planner';
import i18n from './i18n';

afterEach(cleanup);

beforeEach(async () => {
  localStorage.clear();
  // Pinned rather than defaulted: these assert Swedish chrome, and the app's
  // default language is English. What is under test here is the Swedish
  // bundle, not what a first-time visitor lands in — that has its own test in
  // i18n.test.tsx.
  await i18n.changeLanguage('sv');
  localStorage.setItem('gainplan.profile.v1', JSON.stringify(DEFAULT_PROFILE));
  localStorage.setItem(
    'gainplan.plan.v1',
    JSON.stringify(generatePlan(DEFAULT_PROFILE, { seed: 2026 })),
  );
});

/** The nav is rendered twice (desktop header + mobile bar); either will do. */
const goToTab = async (user: ReturnType<typeof userEvent.setup>, name: string) => {
  await user.click(screen.getAllByRole('button', { name })[0]);
};

describe('tab navigation', () => {
  it('stays on Prep when a prep session is selected', async () => {
    const user = userEvent.setup();
    render(<App />);

    await goToTab(user, 'Förberedelse');
    const schedule = screen.getByRole('list', { name: /förberedelseschema/i });
    const rows = within(schedule).getAllByRole('button');

    await user.click(rows[rows.length - 1]);

    // Guards the reported symptom: interacting with the schedule must not
    // bounce the user to the Week tab.
    expect(screen.queryByText(/förberedelseschema/i)).toBeTruthy();
    expect(screen.queryByText(/balansera om portioner/i)).toBeNull();
  });

  it('stays on Shopping when a shopping item is ticked', async () => {
    const user = userEvent.setup();
    render(<App />);

    await goToTab(user, 'Inköp');
    const box = screen.getAllByRole('checkbox')[0];
    await user.click(box);

    expect((box as HTMLInputElement).checked).toBe(true);
    // The chain is named twice on this tab — as the heading and inside the
    // price disclaimer — so match the heading rather than any occurrence.
    expect(screen.getByRole('heading', { name: /ICA Kvantum Uppsala/ })).toBeTruthy();
  });

  it('stays on Setup while editing settings', async () => {
    const user = userEvent.setup();
    render(<App />);

    await goToTab(user, 'Inställningar');
    await user.click(screen.getByRole('tab', { name: /mat & kök/i }));

    expect(screen.getByRole('tab', { name: /mat & kök/i }).getAttribute('aria-selected')).toBe(
      'true',
    );
  });
});

describe('switching country', () => {
  /** Opens the header's region menu and picks a country by its visible name. */
  const switchTo = async (user: ReturnType<typeof userEvent.setup>, name: RegExp) => {
    await user.click(screen.getAllByRole('button', { name: /var du handlar|gdje kupuješ/i })[0]);
    await user.click(screen.getByRole('option', { name }));
  };

  it('is reachable from the header without visiting Setup', () => {
    render(<App />);
    // The app opens on Week when a plan exists, which is exactly why this
    // control cannot live inside the Setup tab.
    expect(screen.getAllByRole('button', { name: /var du handlar/i })[0]).toBeTruthy();
  });

  it('takes the whole interface to Croatian', async () => {
    const user = userEvent.setup();
    render(<App />);

    await switchTo(user, /kroatien/i);

    // Chrome, tabs and the region control itself all follow the region.
    expect(screen.getAllByRole('button', { name: /Tjedan/ })[0]).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /gdje kupuješ/i })[0]).toBeTruthy();
  });

  it('builds a Croatian week priced in euro', async () => {
    const user = userEvent.setup();
    render(<App />);

    await switchTo(user, /kroatien/i);
    await user.click(screen.getAllByRole('button', { name: /Složi mi tjedan/ })[0]);
    await goToTab(user, 'Kupnja');

    // Croatian departments, Croatian chain, euro rather than kronor.
    expect(screen.getByText(/Voće i povrće/)).toBeTruthy();
    expect(screen.getAllByRole('heading', { name: /Konzum/ })[0]).toBeTruthy();
    expect(screen.getAllByText(/€/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Frukt & Grönt/)).toBeNull();
  });

  it('gives each country its own week, so switching back loses nothing', async () => {
    const user = userEvent.setup();
    render(<App />);

    const swedishWeek = localStorage.getItem('gainplan.plan.se.v1');

    await switchTo(user, /kroatien/i);
    await user.click(screen.getAllByRole('button', { name: /Složi mi tjedan/ })[0]);

    expect(localStorage.getItem('gainplan.plan.hr.v1')).not.toBeNull();
    expect(localStorage.getItem('gainplan.plan.se.v1')).toBe(swedishWeek);

    await switchTo(user, /Švedska/i);
    expect(screen.getAllByRole('button', { name: /^Vecka$/ })[0]).toBeTruthy();
  });
});

describe('footer', () => {
  it('credits the author and links out, in every language', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByText('Filip Gadžo')).toBeTruthy();
    expect(screen.getByRole('link', { name: /GitHub/ }).getAttribute('href')).toBe(
      'https://github.com/FilipGadzo1/gainplan',
    );
    expect(screen.getByRole('link', { name: /LinkedIn/ }).getAttribute('href')).toBe(
      'https://www.linkedin.com/in/filip-gadzo/',
    );

    // The name is a name; it does not get translated, but the wording round it does.
    await user.click(screen.getAllByRole('button', { name: /var du handlar/i })[0]);
    await user.click(screen.getByRole('option', { name: /kroatien/i }));
    expect(screen.getByText('Filip Gadžo')).toBeTruthy();
    expect(screen.getByText(/Izradio/)).toBeTruthy();
  });

  it('opens both links safely in a new tab', () => {
    render(<App />);
    for (const name of [/GitHub/, /LinkedIn/]) {
      const link = screen.getByRole('link', { name });
      expect(link.getAttribute('target')).toBe('_blank');
      // Without noopener the opened page can reach back through window.opener.
      expect(link.getAttribute('rel')).toContain('noopener');
    }
  });
});
