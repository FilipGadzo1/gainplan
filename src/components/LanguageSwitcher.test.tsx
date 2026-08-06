import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import i18n, { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY } from '../i18n';
import LanguageSwitcher from './LanguageSwitcher';

beforeEach(async () => {
  localStorage.clear();
  await i18n.changeLanguage(DEFAULT_LANGUAGE);
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
    expect(options.map((o) => o.textContent)).toEqual(['Svenska', 'English']);
    expect(options[0].getAttribute('aria-selected')).toBe('true');
    expect(options[1].getAttribute('aria-selected')).toBe('false');
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

  it('renders flags as SVG, which Windows browsers cannot do with emoji', () => {
    const { container } = render(<LanguageSwitcher />);
    expect(container.querySelector('svg')).toBeTruthy();
    expect(container.textContent).not.toMatch(/🇸🇪|🇬🇧/);
  });
});
