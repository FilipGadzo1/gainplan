import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * The palette used to be checked by scripts/contrast.ts, which carried its own
 * copy of every hex value. Two copies of a palette drift, and the check only
 * ran when someone remembered to run it — so a colour could fail contrast for
 * months without anyone hearing about it.
 *
 * These read the real custom properties out of index.css. There is one palette
 * now, and changing a colour to something unreadable fails the build.
 */
const css = readFileSync('src/index.css', 'utf8');

function colour(name: string): string {
  const match = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!match) throw new Error(`--color-${name} is not defined in index.css`);
  return match[1];
}

const channels = (hex: string) =>
  [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });

function luminance(hex: string): number {
  const [r, g, b] = channels(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio, 1 (identical) to 21 (black on white). */
function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (light + 0.05) / (dark + 0.05);
}

function hue(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return 0;
  const d = max - min;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return Math.round(((h * 60) % 360) + (h < 0 ? 360 : 0));
}

const BACKGROUNDS = ['ink', 'surface', 'raised'] as const;

describe('text is readable on every background it lands on', () => {
  // Body-sized text. Anything here failing 4.5 is unreadable to someone with
  // reduced contrast sensitivity, which is a large share of people over 40.
  it.each(['text', 'muted'])('%s clears AA on all three backgrounds', (name) => {
    for (const bg of BACKGROUNDS) {
      expect(contrast(colour(name), colour(bg)), `${name} on ${bg}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  // The macro colours only ever appear as bold numbers and short labels, which
  // WCAG treats as large text at 3.0.
  it.each(['accent', 'protein', 'carbs', 'fat'])('%s clears AA-large', (name) => {
    for (const bg of BACKGROUNDS) {
      expect(contrast(colour(name), colour(bg)), `${name} on ${bg}`).toBeGreaterThanOrEqual(3);
    }
  });

  it('keeps the primary button legible, which white would not', () => {
    // Not a custom property — it is a literal inside .btn-primary, alongside a
    // comment claiming 7.9:1 against white's 2.3:1. This is that claim, checked.
    const button = css.match(/\.btn-primary\s*\{[^}]*?color:\s*(#[0-9a-fA-F]{6})/);
    if (!button) throw new Error('.btn-primary has no literal text colour');

    const onAccent = contrast(button[1], colour('accent'));
    expect(onAccent).toBeGreaterThanOrEqual(4.5);
    expect(onAccent).toBeGreaterThan(contrast('#ffffff', colour('accent')));
  });
});

describe('the macro colours stay tellable apart', () => {
  // Protein, carbs and fat sit side by side in one stacked bar a few pixels
  // tall. If two of them are close in hue the bar stops carrying information,
  // and no amount of contrast against the background fixes that.
  const swatches = ['accent', 'protein', 'carbs', 'fat'] as const;

  it('separates every pair by at least 40° of hue', () => {
    for (let i = 0; i < swatches.length; i++) {
      for (let j = i + 1; j < swatches.length; j++) {
        const a = hue(colour(swatches[i]));
        const b = hue(colour(swatches[j]));
        const gap = Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
        expect(gap, `${swatches[i]} ${a}° vs ${swatches[j]} ${b}°`).toBeGreaterThanOrEqual(40);
      }
    }
  });
});
