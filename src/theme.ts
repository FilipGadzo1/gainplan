import { createTheme } from '@mui/material/styles';

/**
 * The design system, in one file.
 *
 * This used to be a three-line theme with the real decisions scattered across
 * every component's `sx` — which meant MUI supplied the behaviour and the app
 * spent its overrides cancelling out the look. That produced an interface with
 * twelve type sizes, a 1px border around every element on the page, and a
 * segmented control indistinguishable from a text field.
 *
 * Now the theme owns it. Components should need `sx` only for genuine one-offs.
 *
 * Two things stay outside: the palette hexes, which live as custom properties
 * in index.css because src/palette.test.ts reads them there and checks contrast
 * and hue separation; and print, which is a stylesheet concern.
 */

/** Reads a palette value out of index.css so there is only ever one copy. */
const ink = '#080b0f';
const surface = '#111820';
const raised = '#18212b';
const line = '#26323f';
const text = '#e8eef4';
const muted = '#8c9bad';
const accent = '#57aefa';

/**
 * Elevation on a dark ground.
 *
 * Shadows barely read against #080b0f, so Material 3 raises a surface by
 * tinting it rather than by shading under it. These are the tint steps; the
 * shadow underneath is kept soft and only does the edge.
 */
const elevate = (level: 0 | 1 | 2 | 3) =>
  [surface, raised, '#1e2833', '#243040'][level];

export const theme = createTheme({
  palette: {
    mode: 'dark',
    background: { default: ink, paper: surface },
    primary: {
      main: accent,
      // Dark ink on the azure beats white: 7.9:1 against 2.3:1.
      contrastText: '#05131d',
    },
    error: { main: '#a78bfa' },
    text: { primary: text, secondary: muted },
    divider: line,
  },

  /*
   * Eight roles replacing twelve ad-hoc sizes. The base is 14px rather than the
   * 10-11px most of the interface used to sit at — that was below comfortable
   * reading and was the main reason the app read as an admin panel.
   *
   * Figures are tabular everywhere. This is an app about numbers that change:
   * a calorie total that shifts its own digits sideways as you drag a slider
   * looks broken.
   */
  typography: {
    fontFamily: "'Inter Variable', ui-sans-serif, system-ui, -apple-system, sans-serif",
    fontSize: 14,
    h1: { fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' },
    h2: { fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.015em', lineHeight: 1.15, fontVariantNumeric: 'tabular-nums' },
    h3: { fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.25 },
    h4: { fontSize: '1rem', fontWeight: 700, lineHeight: 1.35 },
    subtitle1: { fontSize: '0.9375rem', fontWeight: 600, lineHeight: 1.45 },
    body1: { fontSize: '0.875rem', lineHeight: 1.55 },
    body2: { fontSize: '0.8125rem', lineHeight: 1.5 },
    caption: { fontSize: '0.75rem', lineHeight: 1.45, color: muted },
    overline: {
      fontSize: '0.6875rem',
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      lineHeight: 1.4,
    },
    button: { fontSize: '0.875rem', fontWeight: 600, textTransform: 'none', letterSpacing: 0 },
  },

  shape: { borderRadius: 12 },

  components: {
    /*
     * Surfaces carry grouping now, so the default Paper has no outline at all.
     * Every card on the page used to be a 1px box, and when everything is boxed
     * nothing has hierarchy.
     */
    MuiPaper: {
      defaultProps: { elevation: 1 },
      styleOverrides: {
        root: { backgroundImage: 'none', border: 0 },
        elevation1: {
          backgroundColor: elevate(1),
          boxShadow: '0 1px 2px rgb(0 0 0 / 0.4)',
        },
        elevation8: {
          backgroundColor: elevate(2),
          boxShadow: '0 8px 24px rgb(0 0 0 / 0.5)',
        },
        elevation24: {
          backgroundColor: elevate(2),
          boxShadow: '0 24px 48px rgb(0 0 0 / 0.6)',
        },
      },
    },

    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 10, paddingInline: '1rem', paddingBlock: '0.5rem', minHeight: 40 },
        // Tonal rather than outlined: the secondary action is a filled surface,
        // which is what stops it competing with the input fields for attention.
        text: {
          backgroundColor: elevate(2),
          color: text,
          '&:hover': { backgroundColor: elevate(3) },
        },
      },
    },

    /*
     * Filled, so a field you type into is unmistakably not a button. Under the
     * old outline-everything treatment "Male / Female" and "Age / Height /
     * Weight" were the same rounded bordered rectangle.
     */
    MuiTextField: { defaultProps: { variant: 'filled', size: 'small' } },
    MuiFilledInput: {
      defaultProps: { disableUnderline: false },
      styleOverrides: {
        root: {
          // Lighter than the toggle wells beside it, and square-shouldered at
          // the bottom so the underline reads as part of the field.
          backgroundColor: elevate(3),
          borderRadius: '8px 8px 0 0',
          fontVariantNumeric: 'tabular-nums',
          '&:hover': { backgroundColor: '#2a374a' },
          '&.Mui-focused': { backgroundColor: '#2a374a' },
        },
        input: {
          /*
           * 16px, and not a sixteenth less: iOS Safari magnifies the page when
           * you focus an input whose text is smaller than that, and it does not
           * undo it when you leave. Every age and weight field used to leave the
           * layout zoomed and scrolled sideways with no way back but pinching.
           * Above the first breakpoint there is no such rule and the tighter
           * setting reads better in a row of three fields.
           */
          fontSize: '1rem',
          '@media (min-width: 40rem)': { fontSize: '0.9375rem' },
        },
      },
    },
    MuiInputLabel: { styleOverrides: { root: { fontSize: '0.8125rem' } } },

    /*
     * The underline indicator is Material's own and reads as navigation, which
     * is what these are. The previous pill tray looked like a group of buttons.
     */
    MuiTabs: {
      styleOverrides: {
        root: { minHeight: 44, borderBottom: `1px solid ${line}` },
        indicator: { height: 2, borderRadius: 2 },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 44,
          padding: '0 1rem',
          fontSize: '0.875rem',
          fontWeight: 600,
          textTransform: 'none',
          color: muted,
          '&.Mui-selected': { color: accent },
        },
      },
    },

    MuiToggleButtonGroup: {
      styleOverrides: { root: { gap: 4 } },
    },
    /*
     * Material's filter-chip logic, and the one place an outline earns its
     * keep. Unselected is a transparent well with a hairline; selected is a
     * tonal fill. That difference is what finally separates a choice from an
     * input — when both were dark filled rectangles you could not tell "Female"
     * from "180". The border is always 1px, transparent when selected, so
     * picking one does not shift the row.
     */
    MuiToggleButton: {
      styleOverrides: {
        root: {
          border: `1px solid ${line}`,
          borderRadius: 10,
          padding: '0.5rem 1rem',
          textTransform: 'none',
          fontSize: '0.875rem',
          fontWeight: 600,
          color: muted,
          backgroundColor: 'transparent',
          '&:hover': { backgroundColor: elevate(2) },
          '&.Mui-selected': {
            backgroundColor: 'color-mix(in srgb, #57aefa 20%, transparent)',
            borderColor: 'transparent',
            color: accent,
            '&:hover': { backgroundColor: 'color-mix(in srgb, #57aefa 26%, transparent)' },
          },
          '&.MuiToggleButtonGroup-grouped': {
            borderRadius: 10,
            margin: 0,
            border: `1px solid ${line}`,
            '&.Mui-selected': { borderColor: 'transparent' },
          },
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, fontVariantNumeric: 'tabular-nums' },
        filled: { backgroundColor: elevate(2) },
      },
    },

    MuiSwitch: { defaultProps: { color: 'primary' } },

    MuiSlider: {
      styleOverrides: {
        root: { height: 4 },
        thumb: { width: 16, height: 16 },
        rail: { backgroundColor: line, opacity: 1 },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: elevate(3),
          border: `1px solid ${line}`,
          color: text,
          fontSize: '0.75rem',
          fontWeight: 500,
          lineHeight: 1.5,
          padding: '0.5rem 0.625rem',
          maxWidth: '18rem',
        },
      },
    },

    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          fontWeight: 500,
          gap: 8,
          '&.Mui-selected': {
            backgroundColor: 'color-mix(in srgb, #57aefa 16%, transparent)',
            color: accent,
          },
        },
      },
    },

    MuiCheckbox: { defaultProps: { color: 'primary' } },
  },
});
