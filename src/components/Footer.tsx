import { useTranslation } from 'react-i18next';

/** 24x24 marks, drawn from each brand's own single-path logo. */
const ICONS = {
  github:
    'M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.5v-1.76c-3.2.7-3.88-1.54-3.88-1.54-.52-1.34-1.28-1.7-1.28-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.62 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.4-5.26 5.69.42.36.79 1.06.79 2.14v3.17c0 .26.21.61.8.5A11.5 11.5 0 0 0 23.5 12A11.5 11.5 0 0 0 12 .5Z',
  linkedin:
    'M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z',
} as const;

const LINKS = [
  { href: 'https://github.com/FilipGadzo1/gainplan', label: 'GitHub', icon: ICONS.github },
  { href: 'https://www.linkedin.com/in/filip-gadzo/', label: 'LinkedIn', icon: ICONS.linkedin },
];

/**
 * A bar in the shell, not a block at the end of the page. On desktop it is the
 * last row of the viewport-height column, which is what keeps the byline in
 * view without the page growing past the screen; on a phone it follows the
 * content in ordinary flow, above the fixed tab bar.
 *
 * Hidden from print: nobody wants a byline on the shopping list they take to
 * the shop.
 */
export default function Footer() {
  const { t } = useTranslation('common');

  return (
    <footer className="no-print border-t border-[var(--color-line)] bg-[var(--color-surface)]/60 lg:shrink-0">
      <div className="mx-auto flex w-full max-w-[1800px] flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-2 text-[11px] text-[var(--color-muted)]">
        <span className="whitespace-nowrap">
          {t('footer.builtBy')}{' '}
          <span className="font-semibold text-[var(--color-text)]">Filip Gadžo</span>
        </span>

        <nav className="flex items-center gap-1" aria-label={t('footer.links')}>
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-md px-1.5 py-1 font-semibold transition-colors hover:bg-[var(--color-raised)] hover:text-[var(--color-text)]"
            >
              <svg viewBox="0 0 24 24" aria-hidden className="h-3.5 w-3.5 fill-current">
                <path d={link.icon} />
              </svg>
              {link.label}
            </a>
          ))}
        </nav>

        {/* The privacy note is the one piece a phone has no room for beside the
            rest, and it repeats what the setup screen already says. */}
        <span className="ml-auto hidden items-center gap-2 sm:flex">
          <span aria-hidden className="h-1 w-1 rounded-full bg-[var(--color-protein)]" />
          {t('footer.note')}
        </span>
      </div>
    </footer>
  );
}
