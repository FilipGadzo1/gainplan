import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from './App';
import { DEFAULT_PROFILE } from './lib/storage';
import { generatePlan } from './lib/planner';

afterEach(cleanup);

beforeEach(() => {
  localStorage.clear();
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
