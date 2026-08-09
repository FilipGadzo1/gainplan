import { useState } from 'react';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Slider from '@mui/material/Slider';
import TextField from '@mui/material/TextField';
import { useTranslation } from 'react-i18next';
import type { ActivityLevel, DietTag, Goal, HouseholdMember, Profile, Sex } from '../types';
import {
  ACTIVITY_LEVELS,
  GOALS,
  GOAL_IDS,
  bmr,
  baseKcal,
  householdFactor,
  kcalForDay,
  macrosForKcal,
  tdee,
} from '../lib/nutrition';
import { useDayNames, useNumberFormat } from '../i18n/hooks';
import { regionOf } from '../regions/registry';
import {
  Button,
  Field,
  Hint,
  NumberField,
  SectionTabs,
  SegmentedControl,
  TabPanel,
  Toggle,
} from './ui';
import ChainMark from './ChainMark';

type DietKey =
  | 'diet.vegetarian'
  | 'diet.noPork'
  | 'diet.noFish'
  | 'diet.noDairy'
  | 'diet.lowLactose'
  | 'diet.noEgg'
  | 'diet.glutenFree'
  | 'diet.noNuts'
  | 'diet.noSoy';

/** Tag groups the user can switch off, paired with their label key. */
const DIET_OPTIONS: { tags: DietTag[]; key: DietKey }[] = [
  { tags: ['meat', 'fish'], key: 'diet.vegetarian' },
  { tags: ['pork'], key: 'diet.noPork' },
  { tags: ['fish'], key: 'diet.noFish' },
  { tags: ['dairy', 'lactose'], key: 'diet.noDairy' },
  { tags: ['lactose'], key: 'diet.lowLactose' },
  { tags: ['egg'], key: 'diet.noEgg' },
  { tags: ['gluten'], key: 'diet.glutenFree' },
  { tags: ['nuts'], key: 'diet.noNuts' },
  { tags: ['soy'], key: 'diet.noSoy' },
];

const ACTIVITY_KEYS = {
  sedentary: { label: 'activity.sedentary.label', hint: 'activity.sedentary.hint' },
  light: { label: 'activity.light.label', hint: 'activity.light.hint' },
  moderate: { label: 'activity.moderate.label', hint: 'activity.moderate.hint' },
  high: { label: 'activity.high.label', hint: 'activity.high.hint' },
  athlete: { label: 'activity.athlete.label', hint: 'activity.athlete.hint' },
} as const satisfies Record<ActivityLevel, { label: string; hint: string }>;

const GOAL_KEYS = {
  cut: { label: 'goal.cut.label', hint: 'goal.cut.hint' },
  maintain: { label: 'goal.maintain.label', hint: 'goal.maintain.hint' },
  'lean-bulk': { label: 'goal.lean-bulk.label', hint: 'goal.lean-bulk.hint' },
  bulk: { label: 'goal.bulk.label', hint: 'goal.bulk.hint' },
} as const satisfies Record<Goal, { label: string; hint: string }>;

type Section = 'body' | 'targets' | 'food';

/** Namespaces the tab and panel ids, since a page could hold more than one set. */
const TAB_GROUP = 'setup';

/**
 * Setup is five cards behind three tabs:
 *
 *   Body    — the measurements the calculation runs on.
 *   Targets — the goal and which days get the bump, next to the macro split.
 *   Food    — what you eat and what you won't, next to how and for whom you cook.
 *
 * Tabs exist because the whole form is roughly 1550px of stacked content and a
 * 1080p window has about 900px to give. Laid out in one page it either scrolls
 * or gets squeezed; only at 1440p does three-column flow fit it. Splitting into
 * thirds is what actually makes a section fit, rather than trading scroll
 * against density.
 *
 * The target readout sits above the tabs, visible from every section, so you can
 * always see what a change did without navigating back.
 *
 * Body is a single card since the weigh-in log was removed, which leaves that
 * section half empty — the layout wants rebalancing across the three tabs.
 */
export default function SetupPanel({
  profile,
  onChange,
}: {
  profile: Profile;
  onChange: (p: Profile) => void;
}) {
  const { t } = useTranslation('setup');
  const days = useDayNames();
  const nf = useNumberFormat();
  const [section, setSection] = useState<Section>('body');

  const set = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    onChange({ ...profile, [key]: value });

  return (
    <div className="flex flex-col gap-3 lg:h-full lg:min-h-0">
      <TargetHero profile={profile} />
      <ChainPicker profile={profile} onChange={onChange} />

      <SectionTabs
        group={TAB_GROUP}
        className="shrink-0 self-start"
        value={section}
        onChange={setSection}
        options={[
          { value: 'body', label: t('tabs.body') },
          { value: 'targets', label: t('tabs.targets') },
          { value: 'food', label: t('tabs.food') },
        ]}
      />

      <TabPanel group={TAB_GROUP} value={section} className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
        {section === 'body' && (
          // One column, unlike the other two sections: Body holds a single card
          // since the weigh-in log was removed, and in a two-column flow it sat
          // in the left half with a screen-wide hole beside it. Full width lets
          // its own fields spread instead.
          <div className="columns-1 gap-4">
        <Card title={t('measurements.title')} hint={t('measurements.hint')}>
          <Field label={t('measurements.sex')} hint={t('measurements.sexHint')}>
            <SegmentedControl<Sex>
              value={profile.sex}
              onChange={(v) => set('sex', v)}
              // Two short words; at full card width they were 350px each.
              columns="grid-cols-2 max-w-xs"
              options={[
                { value: 'male', label: t('measurements.male') },
                { value: 'female', label: t('measurements.female') },
              ]}
            />
          </Field>

          <div className="grid grid-cols-3 gap-4 sm:max-w-xl">
            <Field label={t('measurements.age')}>
              <NumberField
                value={profile.age}
                min={14}
                max={90}
                onChange={(v) => set('age', v ?? profile.age)}
              />
            </Field>
            <Field label={t('measurements.height')}>
              <NumberField
                value={profile.heightCm}
                min={130}
                max={230}
                onChange={(v) => set('heightCm', v ?? profile.heightCm)}
              />
            </Field>
            <Field label={t('measurements.weight')}>
              <NumberField
                value={profile.weightKg}
                min={35}
                max={200}
                step={0.5}
                onChange={(v) => set('weightKg', v ?? profile.weightKg)}
              />
            </Field>
          </div>

          <Field label={t('activity.label')} hint={t('activity.hint')}>
            <SegmentedControl<ActivityLevel>
              value={profile.activity}
              onChange={(v) => set('activity', v)}
              // Five across at full width, so the row reads as one scale from
              // desk job to two-a-days rather than as a 2x3 block with a gap.
              columns="grid-cols-1 sm:grid-cols-3 lg:grid-cols-5"
              options={ACTIVITY_LEVELS.map((k) => ({
                value: k,
                label: t(ACTIVITY_KEYS[k].label),
                hint: t(ACTIVITY_KEYS[k].hint),
              }))}
            />
          </Field>
        </Card>
          </div>
        )}

        {section === 'targets' && (
          <div className="columns-1 gap-4 md:columns-2">
        <Card title={t('goal.title')} hint={t('goal.hint')}>
          <SegmentedControl<Goal>
                value={profile.goal}
                onChange={(v) => onChange({ ...profile, goal: v, proteinPerKg: GOALS[v].protein })}
                columns="grid-cols-1 sm:grid-cols-2"
                options={GOAL_IDS.map((k) => ({
                  value: k,
                  label: t(GOAL_KEYS[k].label),
                  hint: t(GOAL_KEYS[k].hint),
                }))}
              />

              <Field label={t('trainingDays.label')} hint={t('trainingDays.hint')}>
                <div className="grid grid-cols-7 gap-1">
                  {days.long.map((name, i) => {
                    const active = profile.trainingDays.includes(i);
                    return (
                      <Hint key={name} title={name}>
                        <button
                          type="button"
                          onClick={() =>
                            set(
                              'trainingDays',
                              active
                                ? profile.trainingDays.filter((d) => d !== i)
                                : [...profile.trainingDays, i].sort(),
                            )
                          }
                          aria-pressed={active}
                          // The tile reads "M". `title` used to double as the
                          // accessible name through the name-computation
                          // fallback; the tooltip is a *description* now, so
                          // the name has to be stated outright or a screen
                          // reader would announce this button as "M".
                          aria-label={name}
                          // Height only. Seven columns already fill a 360px
                          // phone, so a minimum width here would overflow the row.
                          className={`flex items-center justify-center rounded-lg border py-2 text-[11px] font-bold transition-colors pointer-coarse:min-h-11 ${
                            active
                              ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/12 text-[var(--color-accent)]'
                              : 'border-[var(--color-line)] bg-[var(--color-raised)] text-[var(--color-muted)]'
                          }`}
                        >
                          {days.min[i]}
                        </button>
                      </Hint>
                    );
                  })}
                </div>
              </Field>

          <Toggle
            label={t('cycling.label')}
            hint={cyclingHint(profile, t)}
            checked={profile.calorieCycling}
            onChange={(v) => set('calorieCycling', v)}
          />
        </Card>

        <Card title={t('macroSplit.title')} hint={t('macroSplit.hint')}>
              <Field
                label={t('macroSplit.proteinLabel', { value: nf(profile.proteinPerKg, 1) })}
                hint={t('macroSplit.proteinHint')}
              >
                <Slider
                  min={1.2}
                  max={3}
                  step={0.1}
                  value={profile.proteinPerKg}
                  onChange={(_, v) => set('proteinPerKg', v as number)}
                />
              </Field>

              <Field
                label={t('macroSplit.fatLabel', { pct: Math.round(profile.fatPct * 100) })}
                hint={t('macroSplit.fatHint')}
              >
                <Slider
                  min={0.15}
                  max={0.45}
                  step={0.01}
                  value={profile.fatPct}
                  onChange={(_, v) => set('fatPct', v as number)}
                />
              </Field>

              <Field label={t('macroSplit.manualLabel')} hint={t('macroSplit.manualHint')}>
                <NumberField
                  value={profile.manualKcal}
                  min={800}
                  max={8000}
                  step={50}
                  placeholder={`${baseKcal(profile)}`}
                  allowEmpty
                  onChange={(v) => set('manualKcal', v)}
                />
              </Field>
        </Card>
          </div>
        )}

        {section === 'food' && (
          <div className="columns-1 gap-4 md:columns-2">
        {/* Meals-per-day and the exclusions were a card each; neither filled
            one, and both answer the same question. */}
        <Card title={t('food.title')} hint={t('food.hint')}>
          <Field label={t('meals.perDay')} hint={t('meals.hint')}>
            <SegmentedControl<3 | 4 | 5>
              value={profile.mealsPerDay}
              onChange={(v) => set('mealsPerDay', v)}
              columns="grid-cols-3"
              options={[
                { value: 3, label: '3', hint: t('meals.hint3') },
                { value: 4, label: '4', hint: t('meals.hint4') },
                { value: 5, label: '5', hint: t('meals.hint5') },
              ]}
            />
          </Field>

          <Field label={t('diet.title')} hint={t('diet.hint')}>
              <div className="flex flex-wrap gap-1.5">
                {DIET_OPTIONS.map((o) => {
                  const active = o.tags.every((tag) => profile.exclude.includes(tag));
                  return (
                    <Chip
                      key={o.key}
                      label={t(o.key)}
                      // Filter chips: selected is filled, unselected is a quiet
                      // outline. That contrast is the whole affordance, and it
                      // was missing when both states carried the same border.
                      variant={active ? 'filled' : 'outlined'}
                      aria-pressed={active}
                      onClick={() =>
                        set(
                          'exclude',
                          active
                            ? profile.exclude.filter((tag) => !o.tags.includes(tag))
                            : [...new Set([...profile.exclude, ...o.tags])],
                        )
                      }
                      sx={
                        active
                          ? {
                              backgroundColor: 'color-mix(in srgb, #57aefa 20%, transparent)',
                              color: 'var(--color-accent)',
                            }
                          : undefined
                      }
                    />
                  );
                })}
              </div>

              {profile.dislikedRecipes.length > 0 && (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-raised)] px-3 py-2">
                  <span className="text-xs">
                    <span className="tnum font-bold">{profile.dislikedRecipes.length}</span>{' '}
                    {t('blocked.suffix', { count: profile.dislikedRecipes.length })}
                  </span>
                  <button
                    type="button"
                    className="text-xs font-semibold text-[var(--color-muted)] underline underline-offset-2 hover:text-[var(--color-text)]"
                    onClick={() => set('dislikedRecipes', [])}
                  >
                    {t('blocked.unblockAll')}
                  </button>
                </div>
              )}
          </Field>
        </Card>

        <Card title={t('kitchen.title')} hint={t('kitchen.hint')}>
          <Field
            label={t('kitchen.maxTimeLabel', { minutes: profile.maxMinutes })}
            hint={t('kitchen.maxTimeHint')}
          >
            <Slider
              min={10}
              max={60}
              step={5}
              value={profile.maxMinutes}
              onChange={(_, v) => set('maxMinutes', v as number)}
            />
          </Field>

          <Toggle
            label={t('kitchen.leftoversLabel')}
            hint={t('kitchen.leftoversHint')}
            checked={profile.useLeftovers}
            onChange={(v) => set('useLeftovers', v)}
          />

          {/* Household is part of how you cook, not a separate concern — and
              on its own it was a card holding one button most of the time. */}
          <div>
            <h3 className="text-xs font-semibold tracking-wide text-[var(--color-muted)] uppercase">
              {t('cookingFor.title')}
            </h3>
            <p className="mt-1 mb-2 text-xs text-[var(--color-muted)]">{t('cookingFor.hint')}</p>
            <Household profile={profile} onChange={onChange} />
          </div>
        </Card>
          </div>
        )}
      </TabPanel>
    </div>
  );
}

type SetupT = ReturnType<typeof useTranslation<'setup'>>['t'];

function cyclingHint(profile: Profile, t: SetupT): string {
  const rest = [0, 1, 2, 3, 4, 5, 6].find((d) => !profile.trainingDays.includes(d));
  if (!profile.calorieCycling || profile.trainingDays.length === 0 || rest === undefined) {
    return t('cycling.hintDefault');
  }
  return t('cycling.hintDetail', {
    training: kcalForDay(profile, profile.trainingDays[0]),
    rest: kcalForDay(profile, rest),
  });
}

/**
 * Which of the region's shops you are buying from, which sets the prices, the
 * pack sizes and the order of the aisles.
 *
 * Only rendered where there is a choice, so Sweden — one store, by design —
 * shows nothing. The region itself lives in the header: it is the most visible
 * thing the app can change, and burying it here meant nobody found it.
 */
function ChainPicker({
  profile,
  onChange,
}: {
  profile: Profile;
  onChange: (p: Profile) => void;
}) {
  const { t } = useTranslation('setup');
  const region = regionOf(profile.region);
  if (region.chains.length < 2) return null;

  return (
    <div className="card shrink-0 p-4">
      <p className="text-xs font-semibold">{t('chain.title')}</p>
      <p className="mt-0.5 text-[11px] text-[var(--color-muted)]">{t('chain.hint')}</p>
      <div className="mt-2">
        <SegmentedControl<string>
          value={profile.chain ?? region.chains[0].id}
          onChange={(id) => onChange({ ...profile, chain: id })}
          columns="grid-cols-2 sm:grid-cols-4"
          options={region.chains.map((c) => ({
            value: c.id,
            label: c.name,
            icon: <ChainMark chainId={c.id} name={c.name} />,
            hint: c.searchUrl ? undefined : t('chain.noSearch'),
          }))}
        />
      </div>
    </div>
  );
}

function Card({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    // break-inside-avoid keeps a card whole instead of splitting it across two
    // columns; mb-4 is the vertical gap, since column-gap does not apply.
    <section className="card mb-4 break-inside-avoid p-4">
      <h2 className="text-base font-bold">{title}</h2>
      {hint && <p className="mt-1 text-xs text-[var(--color-muted)]">{hint}</p>}
      {/* gap-6, not gap-4: each Field carries a hint line under its control, and
          at the tighter rhythm that hint read as the caption for whatever came
          next rather than for its own field. */}
      <div className="mt-5 grid gap-6">{children}</div>
    </section>
  );
}

/** The outcome of every setting on this page, visible from all four sections. */
function TargetHero({ profile }: { profile: Profile }) {
  const { t } = useTranslation('setup');
  const { t: tc } = useTranslation('common');
  const nf = useNumberFormat();

  const target = baseKcal(profile);
  const macros = macrosForKcal(profile, target);
  const maintenance = Math.round(tdee(profile));
  const delta = target - maintenance;
  const factor = householdFactor(profile);

  // Groups are clustered left rather than pushed apart with ml-auto: in an
  // 1800px shell that opened a void wide enough to read as two unrelated bars.
  return (
    <div
      role="region"
      aria-label={t('hero.summaryLabel')}
      className="card flex shrink-0 flex-wrap items-center gap-x-8 gap-y-3 px-4 py-3"
    >
      <div>
        <div className="text-[10px] font-bold tracking-wide text-[var(--color-muted)] uppercase">
          {t('hero.dailyTarget')}
        </div>
        {/* The single most important number on this screen, and it used to be
            set two points above body text. Everything on the page exists to
            produce it, so it gets the top of the type scale. */}
        <div className="tnum text-[2.5rem] leading-none font-bold tracking-tight text-[var(--color-accent)]">
          {target}
          <span className="ml-1.5 text-sm font-medium text-[var(--color-muted)]">
            {tc('units.kcal')}
          </span>
        </div>
      </div>

      <div className="flex gap-4">
        <MacroReadout label={tc('macros.protein')} grams={macros.protein} color="var(--color-protein)" />
        <MacroReadout label={tc('macros.carbs')} grams={macros.carbs} color="var(--color-carbs)" />
        <MacroReadout label={tc('macros.fat')} grams={macros.fat} color="var(--color-fat)" />
      </div>

      <div className="tnum text-[11px] leading-relaxed text-[var(--color-muted)]">
        <div>{t('hero.bmr', { bmr: Math.round(bmr(profile)), maintenance })}</div>
        <div>
          {t(GOAL_KEYS[profile.goal].label)}{' '}
          <span style={{ color: delta === 0 ? undefined : 'var(--color-accent)' }}>
            {delta > 0 ? '+' : ''}
            {delta} {tc('units.kcal')}
          </span>
          {factor > 1 && t('hero.cooking', { factor: nf(factor, 2) })}
        </div>
      </div>
    </div>
  );
}

function MacroReadout({ label, grams, color }: { label: string; grams: number; color: string }) {
  const { t } = useTranslation('common');
  return (
    <div>
      <div className="flex items-center gap-1.5">
        <span className="size-2 rounded-full" style={{ background: color }} aria-hidden />
        <span className="text-[10px] font-bold tracking-wide text-[var(--color-muted)] uppercase">
          {label}
        </span>
      </div>
      <div className="tnum mt-0.5 text-base leading-none font-bold">
        {Math.round(grams)}
        <span className="ml-0.5 text-[11px] font-medium text-[var(--color-muted)]">
          {t('units.gram')}
        </span>
      </div>
    </div>
  );
}

/**
 * Who else eats these meals. Each person is a share of your portion rather than
 * a headcount, because a partner who needs 1900 kcal against your 3000 should
 * not double the shopping list.
 */
function Household({ profile, onChange }: { profile: Profile; onChange: (p: Profile) => void }) {
  const { t } = useTranslation('setup');
  const nf = useNumberFormat();
  const yourKcal = baseKcal(profile);
  const factor = householdFactor(profile);

  const update = (id: string, patch: Partial<HouseholdMember>) =>
    onChange({
      ...profile,
      household: profile.household.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between rounded-lg border border-[var(--color-line)] bg-[var(--color-raised)] px-3 py-2.5">
        <span className="text-sm font-semibold">{t('cookingFor.you')}</span>
        <span className="tnum text-xs text-[var(--color-muted)]">
          {t('cookingFor.youShare', { kcal: yourKcal })}
        </span>
      </div>

      {profile.household.map((m, i) => {
        const displayName = m.name || t('cookingFor.fallbackName', { number: i + 2 });
        return (
          <div
            key={m.id}
            className="rounded-lg border border-[var(--color-line)] bg-[var(--color-raised)] p-3"
          >
            <div className="flex items-center gap-2">
              <TextField
                fullWidth
                hiddenLabel
                placeholder={t('cookingFor.personPlaceholder', { number: i + 2 })}
                value={m.name}
                slotProps={{ htmlInput: { maxLength: 24 } }}
                onChange={(e) => update(m.id, { name: e.target.value })}
              />
              <IconButton
                onClick={() =>
                  onChange({
                    ...profile,
                    household: profile.household.filter((x) => x.id !== m.id),
                  })
                }
                aria-label={t('cookingFor.remove', { name: displayName })}
                sx={{ color: 'var(--color-muted)', '&:hover': { color: 'var(--color-fat)' } }}
              >
                ✕
              </IconButton>
            </div>

            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-[var(--color-muted)]">{t('cookingFor.portionSize')}</span>
              <span className="tnum font-semibold">
                {t('cookingFor.portionShare', { pct: Math.round(m.portionFactor * 100) })} ·{' '}
                <span className="text-[var(--color-accent)]">
                  {t('cookingFor.portionKcal', {
                    kcal: Math.round(yourKcal * m.portionFactor),
                  })}
                </span>
              </span>
            </div>
            <Slider
              min={0.3}
              max={1.3}
              step={0.05}
              value={m.portionFactor}
              onChange={(_, v) => update(m.id, { portionFactor: v as number })}
              aria-label={t('cookingFor.portionSliderLabel', { name: displayName })}
              sx={{ mt: 0.5 }}
            />
          </div>
        );
      })}

      <Button
        onClick={() =>
          onChange({
            ...profile,
            household: [
              ...profile.household,
              { id: crypto.randomUUID(), name: '', portionFactor: 0.7 },
            ],
          })
        }
      >
        {t('cookingFor.add')}
      </Button>

      {profile.household.length > 0 && (
        <p className="text-[11px] leading-relaxed text-[var(--color-muted)]">
          {t('cookingFor.cookingNotePrefix')}{' '}
          <span className="tnum font-bold text-[var(--color-accent)]">{nf(factor, 2)}×</span>{' '}
          {t('cookingFor.cookingNoteSuffix')}
        </p>
      )}
    </div>
  );
}
