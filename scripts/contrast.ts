/**
 * Checks the palette actually works: text contrast against the two background
 * shades, and hue separation between the four colours that share a day card.
 */
const PALETTE = {
  ink: '#080b0f',
  surface: '#111820',
  raised: '#18212b',
  text: '#e8eef4',
  muted: '#8c9bad',
  accent: '#57aefa',
  protein: '#4dd4ac',
  carbs: '#ffb454',
  fat: '#a78bfa',
  btnText: '#05131d',
};

const srgb = (hex: string) =>
  [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });

const luminance = (hex: string) => {
  const [r, g, b] = srgb(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a: string, b: string) => {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

const hue = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return 0;
  const d = max - min;
  const h =
    max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return Math.round(((h * 60) % 360) + (h < 0 ? 360 : 0));
};

console.log('Text contrast (AA needs 4.5 for body text, 3.0 for large):\n');
for (const key of ['accent', 'protein', 'carbs', 'fat', 'text', 'muted'] as const) {
  const onSurface = contrast(PALETTE[key], PALETTE.surface);
  const onRaised = contrast(PALETTE[key], PALETTE.raised);
  const flag = Math.min(onSurface, onRaised) >= 4.5 ? 'AA ' : onSurface >= 3 ? 'AA-large' : 'FAIL';
  console.log(
    `  ${key.padEnd(9)} ${PALETTE[key]}  on surface ${onSurface.toFixed(2)}  ` +
      `on raised ${onRaised.toFixed(2)}  ${flag}`,
  );
}

console.log(
  `\nPrimary button: ${PALETTE.btnText} on ${PALETTE.accent} = ` +
    `${contrast(PALETTE.btnText, PALETTE.accent).toFixed(2)} ` +
    `(white would be ${contrast('#ffffff', PALETTE.accent).toFixed(2)})`,
);

console.log('\nHue separation between colours that share a card:\n');
const swatches = ['accent', 'protein', 'carbs', 'fat'] as const;
for (let i = 0; i < swatches.length; i++) {
  for (let j = i + 1; j < swatches.length; j++) {
    const a = hue(PALETTE[swatches[i]]);
    const b = hue(PALETTE[swatches[j]]);
    const gap = Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
    console.log(
      `  ${swatches[i].padEnd(8)} ${String(a).padStart(3)}°  vs  ` +
        `${swatches[j].padEnd(8)} ${String(b).padStart(3)}°   gap ${String(gap).padStart(3)}°` +
        `${gap < 40 ? '  <-- too close' : ''}`,
    );
  }
}
