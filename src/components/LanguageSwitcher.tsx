import { useTranslation } from 'react-i18next';
import { languagesFor, type Language } from '../i18n';
import { useRegion } from '../regions/context';
import { useLanguage } from '../i18n/hooks';
import HeaderSelect from './HeaderSelect';

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

  return (
    <HeaderSelect<Language>
      label={t('language.label')}
      value={language}
      menuWidth="11rem"
      onSelect={setLanguage}
      options={languages.map((lang) => ({
        value: lang,
        label: t(LABEL_KEY[lang]),
        icon: <Code lang={lang} active={lang === language} />,
      }))}
      trigger={
        <>
          <Code lang={language} />
          <span className="hidden sm:inline">{t(LABEL_KEY[language])}</span>
        </>
      }
    />
  );
}
