import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from './App';
import { DEFAULT_PROFILE } from './lib/storage';
import { generatePlan } from './lib/planner';
import { buildShoppingList } from './lib/shopping';
import { ingredientName, ingredientSubtitle, recipeName } from './i18n/content';
import { regionOf } from './regions/registry';
import { getRecipe } from './data/recipes';
import type { Profile } from './types';
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
    // Matches the control's label in whichever language is currently active.
    // Switching country no longer switches language, so this stays Swedish
    // unless something else in the test drove it to English first.
    await user.click(
      screen.getAllByRole('button', { name: /var du handlar|where you shop/i })[0],
    );
    await user.click(screen.getByRole('option', { name }));
  };

  it('is reachable from the header without visiting Setup', () => {
    render(<App />);
    // The app opens on Week when a plan exists, which is exactly why this
    // control cannot live inside the Setup tab.
    expect(screen.getAllByRole('button', { name: /var du handlar/i })[0]).toBeTruthy();
  });

  it('builds a week on Croatian shelves, priced in euro', async () => {
    const user = userEvent.setup();
    render(<App />);

    await switchTo(user, /kroatien/i);
    await user.click(screen.getAllByRole('button', { name: /Build my week/ })[0]);
    await goToTab(user, 'Shopping');

    // The interface is English, but the shop and the currency are still
    // Croatia's: English department names, Croatian chain, euro not kronor.
    expect(screen.getByText(/Fruit & Veg/)).toBeTruthy();
    expect(screen.getAllByRole('heading', { name: /Konzum/ })[0]).toBeTruthy();
    expect(screen.getAllByText(/€/).length).toBeGreaterThan(0);
    // Department labels no longer distinguish the regions — both render in
    // English now — so the chain is what proves this is Croatia, not Sweden.
    expect(screen.queryByRole('heading', { name: /ICA/ })).toBeNull();
  });

  it('gives each country its own week, so switching back loses nothing', async () => {
    const user = userEvent.setup();
    render(<App />);

    const swedishWeek = localStorage.getItem('gainplan.plan.se.v1');

    await switchTo(user, /kroatien/i);
    await user.click(screen.getAllByRole('button', { name: /Build my week/ })[0]);

    expect(localStorage.getItem('gainplan.plan.hr.v1')).not.toBeNull();
    expect(localStorage.getItem('gainplan.plan.se.v1')).toBe(swedishWeek);

    // The interface is English at this point (Croatia has no Swedish, so the
    // earlier switch fell back to English), so the country itself reads
    // "Sweden" here rather than "Švedska" or "Sverige" — and picking it does
    // not change the language back, because switching country is not a
    // request to switch language. It stays English.
    await switchTo(user, /^Sweden$/i);
    expect(screen.getAllByRole('button', { name: /^Week$/ })[0]).toBeTruthy();
  });
});

describe('the UAE walk-through', () => {
  /** Opens the header's region menu and picks a country by its visible name. */
  const switchTo = async (user: ReturnType<typeof userEvent.setup>, name: RegExp) => {
    await user.click(
      screen.getAllByRole('button', { name: /var du handlar|where you shop/i })[0],
    );
    await user.click(screen.getByRole('option', { name }));
  };

  const AE_PROFILE: Profile = { ...DEFAULT_PROFILE, region: 'ae', chain: null };

  /**
   * Seeds a deterministic UAE week straight into storage, so App opens
   * already on that week. "Build my week" in the UI reaches for `Date.now()`
   * rather than a seed, which would make assertions about which recipes and
   * ingredients ended up on the plan flaky from one run to the next.
   */
  const seedUaeWeek = async (seed: number) => {
    const plan = generatePlan(AE_PROFILE, { seed });
    localStorage.setItem('gainplan.profile.v1', JSON.stringify(AE_PROFILE));
    localStorage.setItem('gainplan.plan.ae.v1', JSON.stringify(plan));
    // Mirrors what RegionSwitcher does on a real switch to the UAE: it has no
    // Swedish, so the interface falls back to English.
    await i18n.changeLanguage('en');
    return plan;
  };

  /** Selects the Monday tile, so which day is on screen does not depend on
   * the date the suite happens to run on. `plan.days[0]` is always Monday. */
  const selectMonday = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByText('Mon').closest('button')!);
  };

  it('collapses the language control to English alone, without breaking it', async () => {
    const user = userEvent.setup();
    render(<App />);

    // UAE has no interface language of its own — its own language *is*
    // English — so the switch from Swedish falls back to English rather than
    // leaving Swedish selected somewhere the UAE cannot serve it.
    await switchTo(user, /arabemiraten|united arab emirates/i);

    await user.click(screen.getAllByRole('button', { name: /språk|language/i })[0]);
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0].textContent).toMatch(/english/i);
  });

  it('fills the week with Gulf dishes, none of them Swedish or Croatian', async () => {
    const user = userEvent.setup();
    const plan = await seedUaeWeek(4242);
    render(<App />);

    await goToTab(user, 'Week');
    await selectMonday(user);

    const titles = plan.days[0].meals.map((m) => recipeName(getRecipe(m.recipeId), 'en'));
    expect(titles.length).toBeGreaterThan(0);
    for (const title of titles) expect(screen.getAllByText(title).length).toBeGreaterThan(0);

    // The same slot's Swedish and Croatian pool-mates, by title, to prove the
    // week is drawn from the UAE pool and not merely missing a filter.
    expect(screen.queryByText('Shakshuka med fetaost')).toBeNull();
    expect(screen.queryByText('Shakshuka s fetom')).toBeNull();
  });

  it('renders recipe titles with no empty subtitle element beneath them', async () => {
    const user = userEvent.setup();
    await seedUaeWeek(4242);
    render(<App />);

    await goToTab(user, 'Week');
    await selectMonday(user);

    // Every UAE recipe has name === en, so recipeSubtitle returns '' and the
    // caller must drop the <span> entirely — not render it empty. Checking
    // for the *element* (rather than for the absence of a string) is the
    // point: a blank italic span with margin would pass a naive text check
    // while still occupying a line under the title.
    const titleButtons = screen
      .getAllByRole('button')
      .filter((b) => b.querySelector('span.font-bold'));
    expect(titleButtons.length).toBeGreaterThan(0);
    for (const button of titleButtons) {
      expect(button.querySelector('.italic')).toBeNull();
    }
  });

  it('shows English department headers, an undoubled ingredient name, and no stray separator', async () => {
    const user = userEvent.setup();
    const plan = await seedUaeWeek(4242);
    render(<App />);

    await goToTab(user, 'Shopping');

    expect(screen.getByText('Fruit & Veg')).toBeTruthy();

    // Whichever ingredient the seeded week happens to need first: every UAE
    // row has name === en, so the subtitle line — and its ' · ' separator —
    // must be gone rather than merely empty.
    const list = buildShoppingList(plan, regionOf('ae'), 1);
    const item = list.groups.flatMap((g) => g.items)[0];
    const name = ingredientName(item.ingredient, 'en');
    expect(ingredientSubtitle(item.ingredient, 'en')).toBe('');

    const row = screen.getByText(name).closest('li')!;
    expect(within(row).getAllByText(name)).toHaveLength(1);
    expect(row.querySelector('.italic')).toBeNull();
    expect(row.textContent).not.toContain('·');
  });

  it('totals the list in AED', async () => {
    const user = userEvent.setup();
    await seedUaeWeek(4242);
    render(<App />);

    await goToTab(user, 'Shopping');

    expect(screen.getAllByText(/AED/).length).toBeGreaterThan(0);
  });

  it('links an ingredient out to Union Coop by its search URL shape', async () => {
    const user = userEvent.setup();
    const plan = await seedUaeWeek(4242);
    render(<App />);

    await goToTab(user, 'Shopping');

    const list = buildShoppingList(plan, regionOf('ae'), 1);
    const item = list.groups.flatMap((g) => g.items)[0];
    const name = ingredientName(item.ingredient, 'en');
    // The link's accessible name carries a trailing arrow glyph, so match the
    // name followed by nothing but that glyph — a plain prefix would also
    // catch another ingredient that happens to start the same way.
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const link = screen.getByRole('link', { name: new RegExp(`^${escaped}\\s*↗$`) });
    expect(link.getAttribute('href')).toBe(
      `https://www.unioncoop.ae/catalogsearch/result/?q=${encodeURIComponent(item.ingredient.storeQuery ?? item.ingredient.name)}`,
    );
  });
});

describe('Croatia and Sweden do not regress alongside the UAE', () => {
  it('still shows Croatian ingredient names as a subtitle, under English headers', async () => {
    const user = userEvent.setup();

    // Seeded directly (rather than through "Build my week", which reaches
    // for Date.now()) so the ingredient this test inspects is the same on
    // every run.
    const profile: Profile = { ...DEFAULT_PROFILE, region: 'hr', chain: null };
    const plan = generatePlan(profile, { seed: 4242 });
    localStorage.setItem('gainplan.profile.v1', JSON.stringify(profile));
    localStorage.setItem('gainplan.plan.hr.v1', JSON.stringify(plan));
    await i18n.changeLanguage('en');

    render(<App />);
    await goToTab(user, 'Shopping');

    expect(screen.getByText('Fruit & Veg')).toBeTruthy();

    // Whichever ingredient the seeded week happens to need first. Unlike the
    // UAE, Croatia's own name differs from English, so the subtitle line —
    // and its separator — must survive: this is the assertion that the
    // collapse in ingredientSubtitle keys on name === en, not on the region.
    const list = buildShoppingList(plan, regionOf('hr'), 1);
    const item = list.groups.flatMap((g) => g.items)[0];
    const name = ingredientName(item.ingredient, 'en');
    const subtitle = ingredientSubtitle(item.ingredient, 'en');
    expect(subtitle).not.toBe('');

    const row = screen.getByText(name).closest('li')!;
    expect(within(row).getByText(subtitle)).toBeTruthy();
    expect(row.querySelector('.italic')?.textContent).toBe(subtitle);
  });

  it('still offers Swedish and English in Sweden', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getAllByRole('button', { name: /språk/i })[0]);
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(2);
    expect(options.some((o) => /svenska/i.test(o.textContent ?? ''))).toBe(true);
    expect(options.some((o) => /english/i.test(o.textContent ?? ''))).toBe(true);
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

    // The name is a name; it does not get translated, but the wording round it
    // does. Driven through the language control itself, not a region switch —
    // Croatia no longer carries a language of its own to proxy through.
    expect(screen.getByText('Byggd av')).toBeTruthy();

    await user.click(screen.getAllByRole('button', { name: /språk/i })[0]);
    await user.click(screen.getByRole('option', { name: 'English' }));

    expect(screen.getByText('Filip Gadžo')).toBeTruthy();
    expect(screen.getByText('Built by')).toBeTruthy();
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
