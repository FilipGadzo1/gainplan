import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../i18n';
import { DEFAULT_PROFILE } from '../lib/storage';
import LanguageSwitcher from './LanguageSwitcher';
import RegionSwitcher from './RegionSwitcher';

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
  user.click(screen.getByRole('button', { name: /var du handlar/i }));

describe('RegionSwitcher', () => {
  it('shows the current country', () => {
    render(<RegionSwitcher profile={DEFAULT_PROFILE} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: /var du handlar/i }).textContent).toContain('Sverige');
  });

  it('lists every country, marking the active one', async () => {
    const user = userEvent.setup();
    render(<RegionSwitcher profile={DEFAULT_PROFILE} onChange={() => {}} />);
    await open(user);

    expect(screen.getAllByRole('option')).toHaveLength(3);
    expect(screen.getByRole('option', { name: 'Sverige' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('option', { name: 'Kroatien' }).getAttribute('aria-selected')).toBe('false');
  });

  it('lists the UAE alongside the other two', async () => {
    const user = userEvent.setup();
    render(<RegionSwitcher profile={DEFAULT_PROFILE} onChange={() => {}} />);
    await open(user);
    expect(screen.getAllByRole('option')).toHaveLength(3);
    expect(screen.getByRole('option', { name: /Förenade Arabemiraten|United Arab Emirates/ })).toBeTruthy();
  });

  it('says what it changes when opened', async () => {
    const user = userEvent.setup();
    render(<RegionSwitcher profile={DEFAULT_PROFILE} onChange={() => {}} />);
    await open(user);
    expect(screen.getByText('Var du handlar')).toBeTruthy();
  });

  it('switches region and clears the chain', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RegionSwitcher profile={{ ...DEFAULT_PROFILE, chain: 'ica' }} onChange={onChange} />);
    await open(user);
    await user.click(screen.getByRole('option', { name: 'Kroatien' }));

    // The chain goes with the region: chain ids are scoped to one country, and
    // ICA means nothing in Croatia.
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ region: 'hr', chain: null }));
  });

  it('returns you to English when the new country cannot offer what you were reading', async () => {
    const user = userEvent.setup();
    render(<RegionSwitcher profile={DEFAULT_PROFILE} onChange={() => {}} />);
    await open(user);
    await user.click(screen.getByRole('option', { name: 'Kroatien' }));

    // Croatia has no Swedish interface, so Swedish cannot survive the move.
    // English can, and is where every region falls back to.
    expect(i18n.resolvedLanguage).toBe('en');
  });

  it('leaves a language the new country does still offer alone', async () => {
    const user = userEvent.setup();
    await i18n.changeLanguage('en');
    render(
      <RegionSwitcher profile={{ ...DEFAULT_PROFILE, region: 'hr' }} onChange={() => {}} />,
    );
    await user.click(screen.getByRole('button', { name: /var du handlar|where you shop/i }));
    await user.click(screen.getByRole('option', { name: /Sverige|Sweden/ }));

    // Sweden offers Swedish, but the reader did not ask for Swedish. Changing
    // country is not a request to change language.
    expect(i18n.resolvedLanguage).toBe('en');
  });

  it('leaves the language alone when the country does not change', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RegionSwitcher profile={DEFAULT_PROFILE} onChange={onChange} />);
    await open(user);
    await user.click(screen.getByRole('option', { name: 'Sverige' }));

    // Re-picking the country you are already in must not undo a manual switch
    // to English.
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('closes on Escape without switching', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RegionSwitcher profile={DEFAULT_PROFILE} onChange={onChange} />);
    await open(user);
    expect(screen.getByRole('listbox')).toBeTruthy();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('listbox')).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });
});

/**
 * The two controls sit side by side in the header, and the complaint that
 * prompted this was not being able to tell which one did what. Flags belong to
 * the country control and nowhere else; the language control is letterforms.
 * Anything that puts a flag back into the language switcher breaks the only
 * cue distinguishing them at a glance.
 */
describe('the two header controls read as different things', () => {
  it('gives flags to the country and letters to the language', () => {
    const { container } = render(
      <>
        <RegionSwitcher profile={DEFAULT_PROFILE} onChange={() => {}} />
        <LanguageSwitcher />
      </>,
    );

    const region = screen.getByRole('button', { name: /var du handlar/i });
    const language = screen.getByRole('button', { name: /språk/i });

    expect(region.querySelector('svg'), 'country keeps its flag').toBeTruthy();
    expect(language.querySelector('svg'), 'language must not use a flag').toBeNull();
    expect(language.textContent).toContain('sv');
    expect(container.textContent).not.toMatch(/🇸🇪|🇬🇧|🇭🇷/);
  });

  it('names the country and the language differently', () => {
    render(
      <>
        <RegionSwitcher profile={DEFAULT_PROFILE} onChange={() => {}} />
        <LanguageSwitcher />
      </>,
    );

    // "Sverige" is a place, "Svenska" is a language. Same root, different word,
    // and the difference is the point.
    expect(screen.getByRole('button', { name: /var du handlar/i }).textContent).toContain('Sverige');
    expect(screen.getByRole('button', { name: /språk/i }).textContent).toContain('Svenska');
  });
});
