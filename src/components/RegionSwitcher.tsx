import { useTranslation } from 'react-i18next';
import type { Profile, RegionId } from '../types';
import { REGION_IDS } from '../types';
import { useLanguage } from '../i18n/hooks';
import { languagesFor } from '../i18n';
import { regionOf } from '../regions/registry';
import HeaderSelect from './HeaderSelect';

/**
 * Country flags, inline SVG for the same reason the language flags are: Chrome
 * and Edge on Windows render regional-indicator emoji as the letter pair rather
 * than a flag.
 */
function FlagSe({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 10" className={className} aria-hidden focusable="false">
      <rect width="16" height="10" fill="#005293" />
      <rect x="5" width="2" height="10" fill="#fecb00" />
      <rect y="4" width="16" height="2" fill="#fecb00" />
    </svg>
  );
}

function FlagHr({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 10" className={className} aria-hidden focusable="false">
      <rect width="16" height="3.34" fill="#ff0000" />
      <rect y="3.33" width="16" height="3.34" fill="#fff" />
      <rect y="6.66" width="16" height="3.34" fill="#171796" />
      <path
        d="M6.4 3.1h3.2v2.3a1.6 1.6 0 0 1-1.6 1.6 1.6 1.6 0 0 1-1.6-1.6z"
        fill="#fff"
        stroke="#d90000"
        strokeWidth=".4"
      />
    </svg>
  );
}

function FlagAe({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 10" className={className} aria-hidden focusable="false">
      <rect width="16" height="10" fill="#00732f" />
      <rect y="3.34" width="16" height="3.33" fill="#fff" />
      <rect y="6.67" width="16" height="3.33" fill="#000" />
      <rect width="4" height="10" fill="#ff0000" />
    </svg>
  );
}

const FLAGS: Record<RegionId, (props: { className?: string }) => React.ReactElement> = {
  se: FlagSe,
  hr: FlagHr,
  ae: FlagAe,
};

/** Spelled out rather than built as `region.${id}` so the keys stay typed. */
const LABEL_KEY = { se: 'region.se', hr: 'region.hr', ae: 'region.ae' } as const;

/**
 * Where you shop, in the header rather than buried in Setup.
 *
 * It started life inside Setup on the reasoning that picking a country is a
 * once-a-year decision. That was wrong in practice: the app opens on the Week
 * tab whenever a plan exists, so the control was invisible unless you already
 * knew to go looking for it. Switching country is also the single most visible
 * thing the app can do, which makes hiding it the wrong trade.
 *
 * The chain picker stays in Setup. That one really is a setting, and it only
 * means anything once you have chosen a country.
 */
export default function RegionSwitcher({
  profile,
  onChange,
}: {
  profile: Profile;
  onChange: (p: Profile) => void;
}) {
  const { t } = useTranslation('setup');
  const { language, setLanguage } = useLanguage();

  const choose = (id: RegionId) => {
    if (id === profile.region) return;
    // The chain is cleared rather than carried over: chain ids are scoped to a
    // region, and Konzum means nothing in Sweden.
    onChange({ ...profile, region: id, chain: null });

    // Changing country is not a request to change language. Keep what the
    // reader is reading wherever the new region can serve it, and fall back to
    // English where it cannot — English is offered by every region, so this is
    // the only move that can ever happen, and only to someone who had
    // deliberately chosen Swedish.
    const next = regionOf(id);
    if (!languagesFor(next.language).includes(language)) setLanguage('en');
  };

  const Current = FLAGS[profile.region];

  return (
    <HeaderSelect<RegionId>
      label={t('region.title')}
      value={profile.region}
      onSelect={choose}
      options={REGION_IDS.map((id) => {
        const Flag = FLAGS[id];
        return {
          value: id,
          label: t(LABEL_KEY[id]),
          icon: <Flag className="h-3 w-5 shrink-0 rounded-[2px]" />,
        };
      })}
      trigger={
        <>
          <Current className="h-3 w-5 shrink-0 rounded-[2px]" />
          <span className="hidden sm:inline">{t(LABEL_KEY[profile.region])}</span>
        </>
      }
    />
  );
}
