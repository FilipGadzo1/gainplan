import { useTranslation } from 'react-i18next';

const LINKS = [
  { href: 'https://github.com/FilipGadzo1/gainplan', label: 'GitHub' },
  { href: 'https://www.linkedin.com/in/filip-gadzo/', label: 'LinkedIn' },
];

/**
 * Sits at the bottom of the page rather than pinned to the shell, so it stays
 * out of the way of the week on a laptop screen and you meet it by scrolling.
 * Hidden from print: nobody wants a byline on the shopping list they take to
 * the shop.
 */
export default function Footer() {
  const { t } = useTranslation('common');

  return (
    <footer className="no-print mx-auto w-full max-w-[1800px] px-4 pt-2 pb-6 text-[11px] text-[var(--color-muted)]">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[var(--color-line)] pt-4">
        <span>
          {t('footer.builtBy')} <span className="font-semibold text-[var(--color-text)]">Filip Gadžo</span>
        </span>

        <nav className="flex items-center gap-4" aria-label={t('footer.links')}>
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--color-text)] hover:underline"
            >
              {link.label}
              <span aria-hidden className="ml-1 text-[0.85em]">
                ↗
              </span>
            </a>
          ))}
        </nav>

        <span className="ml-auto">{t('footer.note')}</span>
      </div>
    </footer>
  );
}
