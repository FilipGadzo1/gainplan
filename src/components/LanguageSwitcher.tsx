import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { languagesFor, type Language } from '../i18n';
import { useRegion } from '../regions/context';
import { useLanguage } from '../i18n/hooks';

/**
 * The language's own two-letter code, set in letterforms rather than a flag.
 *
 * The region switcher next to this one uses flags, and it is entitled to: a
 * region is a place. A language is not — English is not the United Kingdom —
 * so a flag here would be both wrong and, sitting inches from a control that
 * also shows flags, unreadable.
 *
 * Letters against flags is the whole distinction between the two controls.
 */
function Code({ lang, active = false }: { lang: Language; active?: boolean }) {
  return (
    <span
      aria-hidden
      className={`rounded-[3px] border px-1 py-px text-[9px] leading-none font-bold tracking-[0.08em] uppercase ${
        active
          ? 'border-[var(--color-accent)]/40 text-[var(--color-accent)]'
          : 'border-[var(--color-line)] text-[var(--color-muted)]'
      }`}
    >
      {lang}
    </span>
  );
}

/** Spelled out rather than built as `language.${lang}` so the keys stay typed. */
const LABEL_KEY = { sv: 'language.sv', en: 'language.en' } as const;

export default function LanguageSwitcher() {
  const { t } = useTranslation('common');
  const { language, setLanguage } = useLanguage();
  const { region } = useRegion();
  const languages = languagesFor(region.language);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const menuId = useId();

  // Opening moves focus onto the active option, so the menu is usable from the
  // keyboard without tabbing through it.
  useEffect(() => {
    if (open) optionRefs.current[languages.indexOf(language)]?.focus();
  }, [open, language, languages]);

  // Close on Escape or on a click that lands outside the control.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  const choose = (lang: Language) => {
    setLanguage(lang);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="no-print relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={t('language.label')}
        className="flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-raised)] px-2 py-1.5 text-xs font-semibold text-[var(--color-muted)] transition-colors pointer-coarse:min-h-11 pointer-coarse:px-3 hover:border-[var(--color-muted)] hover:text-[var(--color-text)]"
      >
        <Code lang={language} />
        <span className="hidden sm:inline">{t(LABEL_KEY[language])}</span>
        <span aria-hidden className="text-[0.6rem] leading-none">
          ▾
        </span>
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-1 min-w-[11rem] overflow-hidden rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] shadow-lg">
          <p className="border-b border-[var(--color-line)] px-3 py-1.5 text-[10px] font-bold tracking-[0.08em] text-[var(--color-muted)] uppercase">
            {t('language.label')}
          </p>
          <ul
            id={menuId}
            role="listbox"
            aria-label={t('language.label')}
            onKeyDown={(e) => {
              const last = languages.length - 1;
              const current = optionRefs.current.indexOf(document.activeElement as HTMLButtonElement);
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                optionRefs.current[current >= last ? 0 : current + 1]?.focus();
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                optionRefs.current[current <= 0 ? last : current - 1]?.focus();
              } else if (e.key === 'Home') {
                e.preventDefault();
                optionRefs.current[0]?.focus();
              } else if (e.key === 'End') {
                e.preventDefault();
                optionRefs.current[last]?.focus();
              }
            }}
            className="py-1"
          >
            {languages.map((lang, i) => {
              const active = lang === language;
              return (
                <li key={lang}>
                  <button
                    type="button"
                    role="option"
                    ref={(el) => {
                      optionRefs.current[i] = el;
                    }}
                    aria-selected={active}
                    onClick={() => choose(lang)}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold transition-colors pointer-coarse:min-h-11 ${
                      active
                        ? 'bg-[var(--color-accent)]/12 text-[var(--color-accent)]'
                        : 'text-[var(--color-muted)] hover:bg-[var(--color-raised)] hover:text-[var(--color-text)]'
                    }`}
                  >
                    <Code lang={lang} active={active} />
                    {t(LABEL_KEY[lang])}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
