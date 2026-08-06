import { useCallback, useEffect, useMemo, useState } from 'react';
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
  loadWeights,
  resetAll,
  saveChecked,
  savePlan,
  saveProfile,
  saveShowHousehold,
  saveWeights,
  type WeightEntry,
} from './lib/storage';
import SetupPanel from './components/SetupPanel';
import WeekView from './components/WeekView';
import ShoppingView from './components/ShoppingView';
import PrepView from './components/PrepView';
import RecipeModal from './components/RecipeModal';
import LanguageSwitcher from './components/LanguageSwitcher';
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
  const [weights, setWeights] = useState<WeightEntry[]>(() => loadWeights());
  const [showHousehold, setShowHousehold] = useState(() => loadShowHousehold());
  const [tab, setTab] = useState<Tab>(() => (loadPlan(initialProfile.region) ? 'week' : 'setup'));
  const [modal, setModal] = useState<{ recipeId: string; scale: number } | null>(null);

  useEffect(() => {
    if (hasOnboarded) saveProfile(profile);
  }, [profile, hasOnboarded]);
  useEffect(() => savePlan(region, plan), [region, plan]);
  useEffect(() => saveChecked(region, checked), [region, checked]);
  useEffect(() => saveWeights(weights), [weights]);
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
          the bottom of the page. Mobile keeps ordinary page scrolling. */}
      <div className="min-h-dvh pb-20 lg:flex lg:h-dvh lg:min-h-0 lg:flex-col lg:overflow-hidden lg:pb-0">
        <header className="sticky top-0 z-30 border-b border-[var(--color-line)] bg-[var(--color-ink)]/95 backdrop-blur lg:static lg:shrink-0">
          <div className="mx-auto flex max-w-[1800px] flex-wrap items-center gap-3 px-4 py-2.5">
            <div className="flex items-baseline gap-2">
              <h1 className="text-lg font-extrabold tracking-tight">
                Gain<span className="text-[var(--color-accent)]">Plan</span>
              </h1>
              <span className="hidden text-[11px] text-[var(--color-muted)] sm:inline">
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

            <div className="ml-auto flex items-center gap-2 md:ml-0">
              <LanguageSwitcher />
              <button type="button" className="no-print btn btn-primary" onClick={regenerate}>
                {plan ? t('actions.regenerateWeek') : t('actions.buildWeek')}
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
                <SetupPanel
                  profile={profile}
                  onChange={setProfile}
                  weights={weights}
                  onWeightsChange={setWeights}
                />
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
                    setWeights([]);
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

        <nav className="no-print fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-[var(--color-line)] bg-[var(--color-surface)] md:hidden">
          {TABS.map((tab_) => (
            <button
              key={tab_.id}
              type="button"
              onClick={() => setTab(tab_.id)}
              disabled={tab_.id !== 'setup' && !plan}
              aria-current={tab === tab_.id}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold disabled:opacity-30 ${
                tab === tab_.id ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'
              }`}
            >
              <span className="text-base leading-none">{tab_.icon}</span>
              {t(tab_.labelKey)}
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
