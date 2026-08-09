import { useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_PROFILE } from '../lib/storage';
import { RegionProvider } from '../regions/context';
import { regionOf } from '../regions/registry';
import { recipeName } from '../i18n/content';
import { theme } from '../theme';
import i18n from '../i18n';
import RecipeModal from './RecipeModal';

beforeEach(async () => {
  await i18n.changeLanguage('en');
});
afterEach(cleanup);

const RECIPE_ID = regionOf('se').recipes[0].id;

/**
 * A page with something to open the recipe from, and something else focusable
 * behind it. Both matter: the first is where focus has to return on close, and
 * the second is what focus must never reach while the dialog is open.
 */
function Harness({ householdFactor = 1 }: { householdFactor?: number }) {
  const [open, setOpen] = useState(false);
  return (
    <ThemeProvider theme={theme}>
      <RegionProvider regionId={DEFAULT_PROFILE.region}>
        <button type="button" onClick={() => setOpen(true)}>
          Open recipe
        </button>
        <button type="button">Behind the dialog</button>
        {open && (
          <RecipeModal
            recipeId={RECIPE_ID}
            scale={1}
            householdFactor={householdFactor}
            householdLabel="Household"
            defaultShowHousehold={false}
            blocked={false}
            onBlock={() => {}}
            onClose={() => setOpen(false)}
          />
        )}
      </RegionProvider>
    </ThemeProvider>
  );
}

const open = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: 'Open recipe' }));
  return screen.findByRole('dialog');
};

describe('RecipeModal focus handling', () => {
  it('names itself by its title rather than relying on a label prop', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const dialog = await open(user);

    // The interface is English here, so the heading is the English title —
    // `recipe.name` is the Swedish one, which is the subtitle in this language.
    const title = recipeName(regionOf('se').recipes[0], 'en');
    const heading = within(dialog).getByRole('heading', { level: 2 });

    expect(heading.textContent).toBe(title);
    // Labelled *by the heading*, not by a duplicated aria-label string.
    expect(dialog.getAttribute('aria-labelledby')).toBe(heading.id);
  });

  it('moves focus into the dialog when it opens', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const dialog = await open(user);

    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
  });

  it('hides the rest of the page from assistive tech while open', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await open(user);

    // Not merely painted over: the page behind is `aria-hidden`, so a screen
    // reader cannot reach it either. The hand-rolled overlay left the whole
    // app in the accessibility tree behind a translucent div.
    expect(screen.queryByRole('button', { name: 'Behind the dialog' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Open recipe' })).toBeNull();
  });

  it('keeps Tab inside the dialog instead of walking into the page behind it', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    // Captured before opening: once the dialog is up these are aria-hidden and
    // no longer reachable by role.
    const behind = screen.getByRole('button', { name: 'Behind the dialog' });
    const opener = screen.getByRole('button', { name: 'Open recipe' });

    const dialog = await open(user);
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));

    // Enough tabs to walk past every focusable the dialog holds and wrap round.
    // The old overlay put no trap in the way at all, so this walked straight
    // out into the page after a handful of presses.
    for (let i = 0; i < 40; i++) {
      await user.tab();
      expect(document.activeElement).not.toBe(behind);
      expect(document.activeElement).not.toBe(opener);
      expect(document.activeElement).not.toBe(document.body);
    }
  });

  it('returns focus to whatever opened it', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const opener = screen.getByRole('button', { name: 'Open recipe' });
    await open(user);

    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(opener));
  });
});

describe('RecipeModal dismissal', () => {
  it('still closes on Escape', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await open(user);

    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('still closes on the close button', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const dialog = await open(user);

    await user.click(within(dialog).getByRole('button', { name: /close/i }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('locks body scroll while open and releases it on close', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await open(user);

    // Behaviour the hand-rolled overlay already had; asserted so the move to
    // Dialog cannot quietly drop it.
    await waitFor(() => expect(document.body.style.overflow).toBe('hidden'));

    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(document.body.style.overflow).not.toBe('hidden');
  });
});
