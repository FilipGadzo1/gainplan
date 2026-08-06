import { useMemo, useState } from 'react';
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
import type { WeightEntry } from '../lib/storage';
import { Field, NumberField, SegmentedControl, SegmentedTabs, Toggle } from './ui';
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

/**
 * Setup is six cards behind three tabs, two cards to a tab:
 *
 *   Body    — the measurements the calculation runs on, next to the weigh-in
 *             log that keeps the weight honest (logging one updates it).
 *   Targets — the goal and which days get the bump, next to the macro split.
 *   Food    — what you eat and what you won't, next to how and for whom you cook.
 *
 * Tabs exist because the whole form is roughly 1550px of stacked content and a
 * 1080p window has about 900px to give. Laid out in one page it either scrolls
 * or gets squeezed; only at 1440p does three-column flow fit it. Splitting into
 * thirds is what actually makes a section fit, rather than trading scroll
 * against density.
 *
 * Three tabs, not the original four: Food and Kitchen were a card each, and a
 * one-card section is how this page ended up looking scattered and full of gaps
 * in the first place. Two cards is the smallest section that fills a row.
 *
 * The target readout sits above the tabs, visible from every section, so you can
 * always see what a change did without navigating back.
 */
export default function SetupPanel({
  profile,
  onChange,
  weights,
  onWeightsChange,
}: {
  profile: Profile;
  onChange: (p: Profile) => void;
  weights: WeightEntry[];
  onWeightsChange: (w: WeightEntry[]) => void;
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

      <SegmentedTabs
        className="shrink-0 self-start"
        value={section}
        onChange={setSection}
        options={[
          { value: 'body', label: t('tabs.body') },
          { value: 'targets', label: t('tabs.targets') },
          { value: 'food', label: t('tabs.food') },
        ]}
      />

      <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
        {section === 'body' && (
          // Column flow rather than a grid: the two cards in a section are
          // never the same height, and a grid would top-align them into a row
          // and leave the short one trailing dead space to its bottom.
          <div className="columns-1 gap-4 md:columns-2">
        <Card title={t('measurements.title')} hint={t('measurements.hint')}>
          <Field label={t('measurements.sex')} hint={t('measurements.sexHint')}>
            <SegmentedControl<Sex>
              value={profile.sex}
              onChange={(v) => set('sex', v)}
              columns="grid-cols-2"
              options={[
                { value: 'male', label: t('measurements.male') },
                { value: 'female', label: t('measurements.female') },
              ]}
            />
          </Field>

          <div className="grid grid-cols-3 gap-3">
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
              columns="grid-cols-1 sm:grid-cols-2"
              options={ACTIVITY_LEVELS.map((k) => ({
                value: k,
                label: t(ACTIVITY_KEYS[k].label),
                hint: t(ACTIVITY_KEYS[k].hint),
              }))}
            />
          </Field>
        </Card>

            <WeightLog
              weights={weights}
              onChange={onWeightsChange}
              profile={profile}
              onWeightSync={(kg) => set('weightKg', kg)}
            />
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
                      <button
                        key={name}
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
                        title={name}
                        className={`rounded-lg border py-2 text-[11px] font-bold transition-colors ${
                          active
                            ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/12 text-[var(--color-accent)]'
                            : 'border-[var(--color-line)] bg-[var(--color-raised)] text-[var(--color-muted)]'
                        }`}
                      >
                        {days.min[i]}
                      </button>
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
                <input
                  type="range"
                  min={1.2}
                  max={3}
                  step={0.1}
                  value={profile.proteinPerKg}
                  onChange={(e) => set('proteinPerKg', Number(e.target.value))}
                  className="w-full"
                />
              </Field>

              <Field
                label={t('macroSplit.fatLabel', { pct: Math.round(profile.fatPct * 100) })}
                hint={t('macroSplit.fatHint')}
              >
                <input
                  type="range"
                  min={0.15}
                  max={0.45}
                  step={0.01}
                  value={profile.fatPct}
                  onChange={(e) => set('fatPct', Number(e.target.value))}
                  className="w-full"
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
                    <button
                      key={o.key}
                      type="button"
                      onClick={() =>
                        set(
                          'exclude',
                          active
                            ? profile.exclude.filter((tag) => !o.tags.includes(tag))
                            : [...new Set([...profile.exclude, ...o.tags])],
                        )
                      }
                      aria-pressed={active}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        active
                          ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/12 text-[var(--color-accent)]'
                          : 'border-[var(--color-line)] bg-[var(--color-raised)] text-[var(--color-muted)]'
                      }`}
                    >
                      {t(o.key)}
                    </button>
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
            <input
              type="range"
              min={10}
              max={60}
              step={5}
              value={profile.maxMinutes}
              onChange={(e) => set('maxMinutes', Number(e.target.value))}
              className="w-full"
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
      </div>
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
 * Where you shop, which everything else hangs off: the region picks the food,
 * the recipes, the currency and the language, and the chain picks the prices
 * and the order you walk the aisles.
 *
 * Changing region switches the language with it. The two are deliberately
 * coupled — a region's food data is written in exactly one non-English
 * language, so a Swedish interface listing Croatian products is not a state
 * worth reaching. English stays available afterwards from the header.
 *
 * The chain row only appears where there is a choice to make, so Sweden — one
 * store, by design — shows nothing extra.
 */
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
      <h2 className="text-sm font-bold">{title}</h2>
      {hint && <p className="mt-0.5 text-[11px] text-[var(--color-muted)]">{hint}</p>}
      <div className="mt-4 grid gap-4">{children}</div>
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
        <div className="tnum text-2xl leading-none font-bold text-[var(--color-accent)]">
          {target}
          <span className="ml-1 text-xs font-medium text-[var(--color-muted)]">
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
              <input
                type="text"
                className="field"
                placeholder={t('cookingFor.personPlaceholder', { number: i + 2 })}
                value={m.name}
                maxLength={24}
                onChange={(e) => update(m.id, { name: e.target.value })}
              />
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...profile,
                    household: profile.household.filter((x) => x.id !== m.id),
                  })
                }
                aria-label={t('cookingFor.remove', { name: displayName })}
                className="shrink-0 rounded-md border border-[var(--color-line)] px-2.5 py-2 text-sm text-[var(--color-muted)] hover:border-[var(--color-fat)] hover:text-[var(--color-fat)]"
              >
                ✕
              </button>
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
            <input
              type="range"
              min={0.3}
              max={1.3}
              step={0.05}
              value={m.portionFactor}
              onChange={(e) => update(m.id, { portionFactor: Number(e.target.value) })}
              className="mt-1 w-full"
              aria-label={t('cookingFor.portionSliderLabel', { name: displayName })}
            />
          </div>
        );
      })}

      <button
        type="button"
        className="btn"
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
      </button>

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

/**
 * Weekly weight trend, and what it implies about the calorie target. Scale
 * weight is noisy day to day, so the readout only fires once there are enough
 * entries to compare two halves.
 */
function WeightLog({
  weights,
  onChange,
  profile,
  onWeightSync,
}: {
  weights: WeightEntry[];
  onChange: (w: WeightEntry[]) => void;
  profile: Profile;
  onWeightSync: (kg: number) => void;
}) {
  const { t } = useTranslation('setup');
  const { t: tc } = useTranslation('common');
  const nf = useNumberFormat();
  const [input, setInput] = useState('');
  const today = new Date().toISOString().slice(0, 10);

  const sorted = useMemo(() => [...weights].sort((a, b) => a.date.localeCompare(b.date)), [weights]);

  const trend = useMemo(() => {
    if (sorted.length < 4) return null;
    const half = Math.floor(sorted.length / 2);
    const older = sorted.slice(0, half);
    const recent = sorted.slice(half);
    const avg = (xs: WeightEntry[]) => xs.reduce((s, x) => s + x.kg, 0) / xs.length;
    const days =
      (Date.parse(recent[recent.length - 1].date) - Date.parse(older[0].date)) / 86_400_000 || 1;
    return ((avg(recent) - avg(older)) / days) * 7;
  }, [sorted]);

  const add = () => {
    const kg = Number(input.replace(',', '.'));
    if (!Number.isFinite(kg) || kg < 35 || kg > 250) return;
    onChange([...weights.filter((w) => w.date !== today), { date: today, kg }]);
    onWeightSync(kg);
    setInput('');
  };

  return (
    <Card title={t('weighIn.title')} hint={t('weighIn.hint')}>
      <div className="flex gap-2">
        <input
          type="number"
          inputMode="decimal"
          step="0.1"
          placeholder={t('weighIn.placeholder')}
          className="field tnum"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <button type="button" className="btn btn-primary shrink-0" onClick={add}>
          {t('weighIn.logToday')}
        </button>
      </div>

      {sorted.length === 0 ? (
        <p className="text-xs text-[var(--color-muted)]">{t('weighIn.empty')}</p>
      ) : (
        <div>
          <Sparkline data={sorted.map((w) => w.kg)} label={t('weighIn.trendLabel')} />
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-[var(--color-muted)]">
              {t('weighIn.entries', { count: sorted.length })} · {t('weighIn.latest')}{' '}
              <span className="tnum font-semibold text-[var(--color-text)]">
                {sorted[sorted.length - 1].kg} {tc('units.kilogram')}
              </span>
            </span>
            <button
              type="button"
              className="text-[var(--color-muted)] underline underline-offset-2"
              onClick={() => onChange([])}
            >
              {t('weighIn.clear')}
            </button>
          </div>
          {trend !== null && (
            <p className="mt-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-raised)] p-3 text-xs leading-relaxed">
              <span className="tnum font-bold text-[var(--color-accent)]">
                {trend > 0 ? '+' : ''}
                {t('weighIn.perWeek', { value: nf(trend, 2) })}
              </span>{' '}
              {t(trendAdviceKey(trend, profile))}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

type TrendKey =
  | 'trend.cutSlow'
  | 'trend.cutFast'
  | 'trend.cutGood'
  | 'trend.bulkNone'
  | 'trend.bulkFast'
  | 'trend.bulkGood'
  | 'trend.stable'
  | 'trend.driftingUp'
  | 'trend.driftingDown';

function trendAdviceKey(perWeek: number, profile: Profile): TrendKey {
  const pct = (perWeek / profile.weightKg) * 100;
  if (profile.goal === 'cut') {
    if (pct > -0.2) return 'trend.cutSlow';
    if (pct < -1) return 'trend.cutFast';
    return 'trend.cutGood';
  }
  if (profile.goal === 'bulk' || profile.goal === 'lean-bulk') {
    const ceiling = profile.goal === 'lean-bulk' ? 0.35 : 0.6;
    if (pct < 0.1) return 'trend.bulkNone';
    if (pct > ceiling) return 'trend.bulkFast';
    return 'trend.bulkGood';
  }
  if (Math.abs(pct) < 0.2) return 'trend.stable';
  return perWeek > 0 ? 'trend.driftingUp' : 'trend.driftingDown';
}

function Sparkline({ data, label }: { data: number[]; label: string }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * 100},${30 - ((v - min) / span) * 26 - 2}`)
    .join(' ');

  return (
    <svg
      viewBox="0 0 100 30"
      preserveAspectRatio="none"
      className="mt-1 h-14 w-full"
      role="img"
      aria-label={label}
    >
      <polyline
        points={points}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
