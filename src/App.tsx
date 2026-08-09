import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Profile, WeekPlan } from './types';
import { generatePlan, rebalanceDay, setMealScale, swapMeal, toggleLock, weekMacros } from './lib/planner';
import { eligibleRecipes } from './lib/planner';
import { baseKcal, householdFactor } from './lib/nutrition';
import { useHouseholdLabel, useLanguage, useNumberFormat } from './i18n/hooks';
import {
  DEFAULT_PROFILE,
  loadChecked,
  loadPlan,
  loadProfile,
  loadShowHousehold,
  resetAll,
  saveChecked,
  savePlan,
  saveProfile,
  saveShowHousehold,
} from './lib/storage';
import SetupPanel from './components/SetupPanel';
import WeekView from './components/WeekView';
import ShoppingView from './components/ShoppingView';
import PrepView from './components/PrepView';
import RecipeModal from './components/RecipeModal';
import LanguageSwitcher from './components/LanguageSwitcher';
import RegionSwitcher from './components/RegionSwitcher';
import Footer from './components/Footer';
import { RegionProvider } from './regions/context';

type Tab = 'setup' | 'week' | 'shopping' | 'prep';

const TABS: { id: Tab; labelKey: `nav.${Tab}`; icon: string }[] = [
  { id: 'setup', labelKey: 'nav.setup', icon: '⚙' },
  { id: 'week', labelKey: 'nav.week', icon: '▦' },
  { id: 'shopping', labelKey: 'nav.shopping', icon: '🛒' },
  { id: 'prep', labelKey: 'nav.prep', icon: '🍳' },
];

export default function App() {
  // Read once: loadProfile() decides which region's plan and checked items to
  // open, so calling it separately for each piece of state could disagree with
  // itself if storage changed in between.
  const [stored] = useState(() => loadProfile());
  const initialProfile = stored ?? DEFAULT_PROFILE;

  const { t } = useTranslation('common');
  const { t: tSetup } = useTranslation('setup');
  const { language } = useLanguage();
  const nf = useNumberFormat();
  const householdLabel = useHouseholdLabel();

  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [hasOnboarded, setHasOnboarded] = useState(() => stored !== null);
  const region = profile.region;
  const [plan, setPlan] = useState<WeekPlan | null>(() => loadPlan(initialProfile.region));
  const [checked, setChecked] = useState<Set<string>>(() => loadChecked(initialProfile.region));
  const [showHousehold, setShowHousehold] = useState(() => loadShowHousehold());
  const [tab, setTab] = useState<Tab>(() => (loadPlan(initialProfile.region) ? 'week' : 'setup'));
  const [modal, setModal] = useState<{ recipeId: string; scale: number } | null>(null);

  // Which region the plan and checked items currently in state belong to.
  //
  // Changing region has to swap both for that region's own, and the save
  // effects below must not fire in between — they key on `region`, so the
  // render right after a switch would otherwise write the *previous* region's
  // week into the new region's storage and destroy both.
  const loadedRegion = useRef(initialProfile.region);

  useEffect(() => {
    if (loadedRegion.current === region) return;
    loadedRegion.current = region;
    const next = loadPlan(region);
    setPlan(next);
    setChecked(loadChecked(region));
    // A region with no week yet has nothing for the other tabs to show.
    setTab(next ? 'week' : 'setup');
  }, [region]);

  const inSync = loadedRegion.current === region;

  useEffect(() => {
    if (hasOnboarded) saveProfile(profile);
  }, [profile, hasOnboarded]);
  useEffect(() => {
    if (inSync) savePlan(region, plan);
  }, [inSync, region, plan]);
  useEffect(() => {
    if (inSync) saveChecked(region, checked);
  }, [inSync, region, checked]);
  useEffect(() => saveShowHousehold(showHousehold), [showHousehold]);

  // Keep the document itself in the chosen language, for screen readers,
  // hyphenation and the browser's own translation prompt.
  useEffect(() => {
    document.documentElement.lang = language;
    document.title = t('app.documentTitle');
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', t('app.description'));
  }, [language, t]);

  const poolSize = useMemo(() => eligibleRecipes(profile).length, [profile]);

  const regenerate = useCallback(() => {
    setPlan(generatePlan(profile, { previous: plan ?? undefined }));
    setChecked(new Set());
    setHasOnboarded(true);
    setTab('week');
  }, [profile, plan]);

  const summary = plan ? weekMacros(plan) : null;
  const factor = householdFactor(profile);

  const openRecipe = (recipeId: string, scale: number) => setModal({ recipeId, scale });

  const blockRecipe = (recipeId: string) => {
    const blocked = profile.dislikedRecipes.includes(recipeId);
    setProfile({
      ...profile,
      dislikedRecipes: blocked
        ? profile.dislikedRecipes.filter((r) => r !== recipeId)
        : [...profile.dislikedRecipes, recipeId],
    });
  };

  return (
    <RegionProvider regionId={region} chainId={profile.chain ?? undefined}>
      {/* On desktop the shell owns the viewport and each tab manages its own
          overflow, so the week can lay itself out to fit instead of running off
          the bottom of the page. Mobile keeps ordinary page scrolling.

          The bottom padding clears the fixed tab bar, so it is sized off the
          same two numbers the bar is: its own height plus whatever the device
          reserves for the home indicator. It stops at `md`, where the bar is
          replaced by the tabs in the header — carrying it further left five
          empty rems under every page on a tablet. */}
      <div className="min-h-dvh pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0 lg:flex lg:h-dvh lg:min-h-0 lg:flex-col lg:overflow-hidden">
        {/* Sticky only from `md`, which is exactly where this bar becomes the
            navigation. Below that the tabs live in the fixed bar at the bottom
            of the screen, so pinning this one bought nothing and cost about a
            sixth of a phone screen — header, then summary strip, before any of
            the week was visible. It scrolls away with the page now. */}
        <header className="z-30 border-b border-[var(--color-line)] bg-[var(--color-ink)]/95 backdrop-blur md:sticky md:top-0 lg:static lg:shrink-0">
          <div className="mx-auto flex max-w-[1800px] flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5">
            <div className="flex min-w-0 items-baseline gap-2">
              <h1 className="text-lg font-extrabold tracking-tight">
                Gain<span className="text-[var(--color-accent)]">Plan</span>
              </h1>
              <span className="hidden truncate text-[11px] text-[var(--color-muted)] sm:inline">
                {t('app.tagline')}
              </span>
            </div>

            <nav className="no-print ml-auto hidden gap-1 md:flex">
              {TABS.map((tab_) => (
                <button
                  key={tab_.id}
                  type="button"
                  onClick={() => setTab(tab_.id)}
                  aria-current={tab === tab_.id}
                  disabled={tab_.id !== 'setup' && !plan}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors disabled:opacity-30 ${
                    tab === tab_.id
                      ? 'bg-[var(--color-raised)] text-[var(--color-accent)]'
                      : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                  }`}
                >
                  {t(tab_.labelKey)}
                </button>
              ))}
            </nav>

            <div className="ml-auto flex items-center gap-3 md:ml-0">
              {/* Country and language sit tight against each other, with the
                  rule separating them from the action — they are the two
                  controls that shape the interface itself. Three evenly spaced
                  controls read as three unrelated things, which is what made
                  this corner look cluttered. */}
              <div className="flex items-center gap-1.5">
                <RegionSwitcher profile={profile} onChange={setProfile} />
                <LanguageSwitcher />
              </div>
              <span aria-hidden className="h-6 w-px shrink-0 bg-[var(--color-line)]" />
              {/*
                "Ponovno složi tjedan" is 20 characters and on its own wider
                than the phone has left after the brand and the two selectors,
                which is what pushed this whole group onto a second row. The
                short form keeps the verb — the same word the long label leads
                with — rather than becoming an unlabelled icon.
              */}
              <button
                type="button"
                // The name a screen reader announces stays the full sentence at
                // every width; only the ink shortens.
                aria-label={plan ? t('actions.regenerateWeek') : t('actions.buildWeek')}
                className="no-print btn btn-primary whitespace-nowrap max-sm:px-2.5"
                onClick={regenerate}
              >
                <span className="sm:hidden">
                  {plan ? t('actions.regenerateWeekShort') : t('actions.buildWeekShort')}
                </span>
                <span className="hidden sm:inline">
                  {plan ? t('actions.regenerateWeek') : t('actions.buildWeek')}
                </span>
              </button>
            </div>
          </div>

          {plan && summary && (
            <div className="mx-auto flex max-w-[1800px] flex-wrap items-center gap-x-5 gap-y-1 border-t border-[var(--color-line)] px-4 py-1.5 text-[11px] text-[var(--color-muted)]">
              <span>
                {t('summary.average')}{' '}
                <span className="tnum font-bold text-[var(--color-text)]">
                  {Math.round(summary.kcal / 7)}
                </span>{' '}
                {t('summary.kcalPerDay')}{' '}
                <span className="tnum">{t('summary.target', { kcal: baseKcal(profile) })}</span>
              </span>
              <span>
                {t('macros.protein')}{' '}
                <span className="tnum font-bold" style={{ color: 'var(--color-protein)' }}>
                  {Math.round(summary.protein / 7)} {t('units.gram')}
                </span>{' '}
                <span className="tnum">
                  {t('summary.proteinPerKg', {
                    value: nf(summary.protein / 7 / profile.weightKg, 1),
                  })}
                </span>
              </span>
              <span className="tnum">{t('summary.poolSize', { count: poolSize })}</span>
              {factor > 1 && (
                <span>
                  {t('summary.cooking')}{' '}
                  <span className="tnum font-bold text-[var(--color-accent)]">
                    {t('summary.cookingFactor', { factor: nf(factor, 2) })}
                  </span>{' '}
                  {t('summary.cookingFor', { label: householdLabel(profile).toLowerCase() })}
                </span>
              )}
            </div>
          )}
        </header>

        <main className="mx-auto w-full max-w-[1800px] p-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
          {tab === 'setup' && (
            <div className="flex flex-col gap-3 lg:h-full lg:min-h-0">
              {!plan && (
                <div className="card shrink-0 p-4 sm:p-5">
                  <h2 className="text-base font-bold">{tSetup('intro.title')}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--color-muted)]">
                    {tSetup('intro.body')}
                  </p>
                </div>
              )}
              <div className="lg:min-h-0 lg:flex-1">
                <SetupPanel profile={profile} onChange={setProfile} />
              </div>
              {poolSize < 12 && (
                <p className="shrink-0 rounded-lg border border-[var(--color-fat)]/40 bg-[var(--color-fat)]/10 p-3 text-xs">
                  {tSetup('poolWarning', { count: poolSize })}
                </p>
              )}
              {/* Pinned to the bottom of the shell so it is never scrolled off. */}
              <div className="flex shrink-0 flex-wrap gap-2">
                <button type="button" className="btn btn-primary" onClick={regenerate}>
                  {plan ? tSetup('rebuildWeek') : t('actions.buildWeek')}
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    if (!confirm(tSetup('resetConfirm'))) return;
                    resetAll();
                    setProfile(DEFAULT_PROFILE);
                    setPlan(null);
                    setChecked(new Set());
                    setHasOnboarded(false);
                  }}
                >
                  {tSetup('resetAll')}
                </button>
              </div>
            </div>
          )}

          {tab === 'week' && plan && (
            <WeekView
              plan={plan}
              profile={profile}
              showHousehold={showHousehold}
              onShowHouseholdChange={setShowHousehold}
              onSwap={(d, m) => setPlan(swapMeal(plan, profile, d, m))}
              onToggleLock={(d, m) => setPlan(toggleLock(plan, d, m))}
              onScale={(d, m, s) => setPlan(setMealScale(plan, d, m, s))}
              onOpenRecipe={openRecipe}
              onRebalance={() => {
                let next = plan;
                for (let d = 0; d < 7; d++) next = rebalanceDay(next, profile, d);
                setPlan(next);
              }}
            />
          )}

          {tab === 'shopping' && plan && (
            <ShoppingView
              plan={plan}
              profile={profile}
              checked={checked}
              onCheckedChange={setChecked}
            />
          )}

          {tab === 'prep' && plan && (
            <PrepView plan={plan} profile={profile} onOpenRecipe={openRecipe} />
          )}
        </main>

        {/* Outside <main>, which on desktop is the only thing that scrolls: in
            there the footer added its own height to a column already sized to
            the viewport, so every tab ended a screen and a half tall. As a
            sibling it is a row of that column instead, and nothing scrolls. */}
        <Footer />

        {/* Fixed to the viewport, which is what puts it under the home
            indicator on an iPhone: the bar drew fine, and the labels sat
            behind the system's own handle. The bottom inset pushes the row up
            off it, and is 0 on hardware without one. */}
        <nav className="no-print fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-[var(--color-line)] bg-[var(--color-surface)] pb-[env(safe-area-inset-bottom)] md:hidden">
          {TABS.map((tab_) => (
            <button
              key={tab_.id}
              type="button"
              onClick={() => setTab(tab_.id)}
              disabled={tab_.id !== 'setup' && !plan}
              aria-current={tab === tab_.id}
              className={`flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[11px] font-semibold disabled:opacity-30 ${
                tab === tab_.id ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'
              }`}
            >
              <span className="text-base leading-none">{tab_.icon}</span>
              {/* "Inställningar" and "Förberedelse" are a quarter wider than a
                  320px phone gives a column, and wrapping them made the bar
                  two rows tall on that one screen. */}
              <span className="w-full truncate text-center">{t(tab_.labelKey)}</span>
            </button>
          ))}
        </nav>

        {modal && (
          <RecipeModal
            recipeId={modal.recipeId}
            scale={modal.scale}
            householdFactor={factor}
            householdLabel={householdLabel(profile)}
            defaultShowHousehold={showHousehold}
            blocked={profile.dislikedRecipes.includes(modal.recipeId)}
            onBlock={blockRecipe}
            onClose={() => setModal(null)}
          />
        )}
      </div>
    </RegionProvider>
  );
}
