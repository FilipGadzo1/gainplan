/**
 * Every test here forces a language rather than relying on the default. The
 * default is English and the assertions are Swedish, and coupling the two
 * would mean a change of default silently rewrites what these tests claim.
 */

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import i18n, { LANGUAGE_STORAGE_KEY } from '../i18n';
import { RegionProvider } from '../regions/context';
import LanguageSwitcher from './LanguageSwitcher';

beforeEach(async () => {
  localStorage.clear();
  // Pinned rather than defaulted: these assert Swedish chrome, and the app's
  // default language is English. What is under test here is the Swedish
  // bundle, not what a first-time visitor lands in — that has its own test in
  // i18n.test.tsx.
  await i18n.changeLanguage('sv');
});
afterEach(cleanup);

const open = async (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole('button', { name: /språk|language/i }));

describe('LanguageSwitcher', () => {
  it('shows the current language, Swedish by default', () => {
    render(<LanguageSwitcher />);
    expect(screen.getByRole('button', { name: /språk/i }).textContent).toContain('Svenska');
  });

  it('lists both languages, marking the active one', async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);
    await open(user);

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(2);
    // Named by the language itself. The sv/en code beside it is decoration for
    // the eye and is aria-hidden, so it stays out of the accessible name.
    expect(screen.getByRole('option', { name: 'Svenska' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('option', { name: 'English' }).getAttribute('aria-selected')).toBe('false');
  });

  it('switches the language and closes the menu', async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);
    await open(user);

    await user.click(screen.getByRole('option', { name: 'English' }));

    expect(i18n.resolvedLanguage).toBe('en');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('remembers the choice in localStorage', async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);
    await open(user);
    await user.click(screen.getByRole('option', { name: 'English' }));

    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en');
  });

  it('moves between options with the arrow keys', async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);
    await open(user);

    const [svenska, english] = screen.getAllByRole('option');
    // Opening focuses the active option.
    expect(document.activeElement).toBe(svenska);

    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(english);

    // And wraps around at the end.
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(svenska);
  });

  it('closes on Escape without changing the language', async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);
    await open(user);
    expect(screen.getByRole('listbox')).toBeTruthy();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('listbox')).toBeNull();
    expect(i18n.resolvedLanguage).toBe('sv');
  });

  it('marks languages with letters, never a flag', () => {
    // The region switcher sits inches away and does use flags, which it is
    // entitled to: a region is a place. A language is not — English is not the
    // United Kingdom — and two flag controls side by side read as one repeated
    // control. Letters against flags is what tells them apart.
    const { container } = render(<LanguageSwitcher />);

    expect(container.querySelector('svg')).toBeNull();
    expect(container.textContent).not.toMatch(/🇸🇪|🇬🇧|🇭🇷/);
    expect(container.textContent).toContain('sv');
  });

  it('says what it changes when opened', async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);
    await open(user);
    expect(screen.getByText('Språk')).toBeTruthy();
  });

  it('offers English alone in a region that has no language of its own', async () => {
    const user = userEvent.setup();
    await i18n.changeLanguage('en');
    render(
      <RegionProvider regionId="hr">
        <LanguageSwitcher />
      </RegionProvider>,
    );
    await user.click(screen.getByRole('button', { name: /language/i }));

    // Croatia's data is still Croatian; its interface is not. `languagesFor`
    // collapses to a single option, and the control has to survive that.
    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(screen.getByRole('option', { name: 'English' }).getAttribute('aria-selected')).toBe('true');
  });
});
