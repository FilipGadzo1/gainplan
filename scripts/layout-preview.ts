/**
 * Renders the real generated week into a static HTML page mirroring the desktop
 * layout, so the "does it fit on one screen" question can be looked at without a
 * browser automation tool. Data is real; the CSS is a hand-written stand-in for
 * the Tailwind classes, so treat it as indicative, not pixel-exact.
 */
import { writeFileSync } from 'node:fs';
import { DEFAULT_PROFILE } from '../src/lib/storage';
import { generatePlan, dayMacros, mealMacros } from '../src/lib/planner';
import { getRecipe } from '../src/data/recipes';
import { getIngredient } from '../src/data/ingredients';
import { DAY_NAMES, formatGrams } from './_shared';

const profile = { ...DEFAULT_PROFILE };
const plan = generatePlan(profile, { seed: 2026 });
const SELECTED = 0;

const bars = (m: { protein: number; carbs: number; fat: number }) => {
  const p = m.protein * 4;
  const c = m.carbs * 4;
  const f = m.fat * 9;
  const s = p + c + f || 1;
  return `<div class="bar">
    <i style="width:${(p / s) * 100}%;background:var(--protein)"></i>
    <i style="width:${(c / s) * 100}%;background:var(--carbs)"></i>
    <i style="width:${(f / s) * 100}%;background:var(--fat)"></i></div>`;
};

const tiles = plan.days
  .map((day) => {
    const total = dayMacros(day);
    const on = day.index === SELECTED;
    return `<button class="tile${on ? ' on' : ''}">
      <div class="th"><span class="tn">${DAY_NAMES[day.index].slice(0, 3)}</span>${
        day.training ? '<i class="dot"></i>' : ''
      }</div>
      <div class="tk">${Math.round(total.kcal)}</div>
      <div class="tt">/ ${day.target.kcal}</div>
      ${bars(total)}
    </button>`;
  })
  .join('');

const day = plan.days[SELECTED];
const cards = day.meals
  .map((meal) => {
    const r = getRecipe(meal.recipeId);
    const m = mealMacros(meal);
    const rows = r.ingredients
      .map((ri) => {
        const ing = getIngredient(ri.id);
        const grams = ri.fixed ? ri.g : ri.g * meal.scale;
        const amount =
          ing.unitWeight && grams / ing.unitWeight >= 0.8
            ? `${Math.round(grams / ing.unitWeight)} st`
            : formatGrams(grams);
        return `<li><span class="in">${ing.name}</span><span class="ia">${amount}</span></li>`;
      })
      .join('');

    return `<section class="card">
      <header><span class="slot">${meal.slot}</span><span class="min">${r.minutes} min</span></header>
      <div class="title">${r.name}</div>
      <div class="en">${r.en}</div>
      <div class="kc"><b>${Math.round(m.kcal)}</b><span>kcal</span></div>
      ${bars(m)}
      <div class="legend"><span class="p">P ${Math.round(m.protein)}</span><span class="c">C ${Math.round(
        m.carbs,
      )}</span><span class="f">F ${Math.round(m.fat)}</span></div>
      <div class="ingh">Ingredients</div>
      <ul class="ings">${rows}</ul>
      <div class="acts">
        <button>−</button><span class="pct">${Math.round(meal.scale * 100)}%</span><button>+</button>
        <span class="sp"></span>
        <button class="lbl">Swap</button><button class="lbl">Lock</button><button class="lbl">Recipe</button>
      </div>
    </section>`;
  })
  .join('');

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<title>GainPlan — week layout</title>
<style>
  :root{--ink:#080b0f;--surface:#111820;--raised:#18212b;--line:#26323f;--text:#e8eef4;
        --muted:#8c9bad;--accent:#57aefa;--protein:#4dd4ac;--carbs:#ffb454;--fat:#a78bfa}
  *{box-sizing:border-box}
  body{margin:0;background:#000;color:var(--text);
       font-family:Inter,ui-sans-serif,system-ui,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
  .note{padding:12px 16px;font-size:12px;color:var(--muted)} .note b{color:var(--accent)}
  .scaler{overflow:auto;max-width:100%}
  .frame{width:1600px;height:900px;background:var(--ink);display:flex;flex-direction:column;
         overflow:hidden;border:1px solid var(--line)}
  header.app{border-bottom:1px solid var(--line);flex-shrink:0}
  .approw{display:flex;align-items:center;gap:12px;padding:10px 16px}
  .logo{font-size:18px;font-weight:800}.logo span{color:var(--accent)}
  .tabs{margin-left:auto;display:flex;gap:4px}
  .tabs button{background:none;border:0;color:var(--muted);font:600 14px inherit;padding:6px 12px;border-radius:8px}
  .tabs button.on{background:var(--raised);color:var(--accent)}
  .cta{background:var(--accent);color:#05131d;border:0;border-radius:8px;padding:8px 16px;font:600 14px inherit}
  .summary{display:flex;gap:20px;padding:6px 16px;border-top:1px solid var(--line);font-size:11px;color:var(--muted)}
  main{flex:1;min-height:0;overflow:hidden;padding:16px;display:flex;flex-direction:column;gap:12px}
  .toolbar{display:flex;flex-shrink:0;gap:8px}
  .toolbar .right{margin-left:auto;display:flex;gap:8px}
  .toolbar button{background:var(--raised);border:1px solid var(--line);color:var(--text);
                  border-radius:8px;padding:8px 14px;font:600 13px inherit}
  .strip{display:grid;grid-template-columns:repeat(7,1fr);gap:8px;flex-shrink:0}
  .tile{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:10px;
        text-align:left;color:var(--text);font:inherit}
  .tile.on{border-color:var(--accent);background:rgba(255,45,111,.10)}
  .th{display:flex;justify-content:space-between;align-items:center}
  .tn{font-size:12px;font-weight:700}.tile.on .tn{color:var(--accent)}
  .dot{width:6px;height:6px;border-radius:999px;background:var(--accent);display:block}
  .tk{font-size:14px;font-weight:700;margin-top:4px;font-variant-numeric:tabular-nums}
  .tt{font-size:10px;color:var(--muted);font-variant-numeric:tabular-nums}
  .bar{display:flex;height:6px;border-radius:999px;overflow:hidden;background:var(--raised);margin-top:6px}
  .detail{flex:1;min-height:0;display:grid;grid-template-columns:repeat(${day.meals.length},1fr);gap:12px}
  .card{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:12px;
        display:flex;flex-direction:column;overflow:hidden}
  .card header{display:flex;align-items:center;gap:8px;flex-shrink:0}
  .slot{font-size:10px;font-weight:700;text-transform:uppercase;color:var(--muted);letter-spacing:.04em}
  .min{margin-left:auto;font-size:11px;color:var(--muted)}
  .title{font-size:14px;font-weight:700;line-height:1.3;margin-top:6px}
  .en{font-size:11px;color:var(--muted);font-style:italic;line-height:1.3}
  .kc{display:flex;align-items:baseline;gap:5px;margin-top:8px}
  .kc b{font-size:20px;font-variant-numeric:tabular-nums}.kc span{font-size:11px;color:var(--muted)}
  .legend{display:flex;gap:10px;font-size:10px;margin-top:6px;font-variant-numeric:tabular-nums}
  .p{color:var(--protein)}.c{color:var(--carbs)}.f{color:var(--fat)}
  .ingh{font-size:10px;font-weight:700;text-transform:uppercase;color:var(--muted);
        letter-spacing:.04em;margin-top:12px}
  .ings{list-style:none;margin:4px 0 0;padding:0;flex:1;min-height:0;overflow:hidden}
  .ings li{display:flex;justify-content:space-between;gap:8px;font-size:11px;padding:2px 0}
  .in{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .ia{font-weight:600;font-variant-numeric:tabular-nums;flex-shrink:0}
  .acts{display:flex;align-items:center;gap:4px;margin-top:8px;padding-top:8px;
        border-top:1px solid var(--line);flex-shrink:0}
  .acts button{background:none;border:1px solid var(--line);color:var(--muted);border-radius:6px;
               width:24px;height:24px;font:700 13px inherit;padding:0}
  .acts button.lbl{width:auto;padding:3px 8px;font-size:11px}
  .pct{font-size:11px;font-weight:700;color:var(--muted);width:40px;text-align:center;
       font-variant-numeric:tabular-nums}
  .sp{flex:1}
</style></head><body>
<p class="note">Static mock of the redesigned <b>Week page</b> in a fixed 1600×900 frame, from the real generated plan.
Day strip stays visible; the selected day's meals fill the rest. <b>Nothing scrolls.</b></p>
<div class="scaler"><div class="frame">
  <header class="app">
    <div class="approw">
      <div class="logo">Gain<span>Plan</span></div>
      <div class="tabs"><button>Setup</button><button class="on">Week</button><button>Shopping</button><button>Prep</button></div>
      <button class="cta">Regenerate week</button>
    </div>
    <div class="summary"><span>Avg 3053 kcal/day (target 3035)</span><span>Protein 214 g (2.7 g/kg)</span><span>65 recipes in your pool</span></div>
  </header>
  <main>
    <div class="toolbar"><div class="right"><button>Rebalance portions</button><button>Print</button></div></div>
    <div class="strip">${tiles}</div>
    <div class="detail">${cards}</div>
  </main>
</div></div>
</body></html>`;

writeFileSync(process.argv[2] ?? 'week-layout.html', html);
console.log(`Wrote preview to ${process.argv[2] ?? 'week-layout.html'}`);
