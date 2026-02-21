/**
 * HugATree brand colour palette.
 *
 * Derived from the HugATree logo:
 *   - Vivid forest-green tree canopy family
 *   - Warm earthy amber/brown tones (trunk, logo text)
 *   - Neutrals for readable light and dark mode UI
 *
 * Usage:
 *   import { Brand, Colors } from '@/constants/theme';
 *   backgroundColor: Brand.primary          // flat token
 *   color: Colors[colorScheme ?? 'light'].text  // theme-aware
 */

import { Platform } from 'react-native';

// ─── Brand tokens — fixed hex values, not theme-dependent ───────────────────
export const Brand = {
  // Forest-green family (darkest → lightest)
  forest:    '#1B4332',
  deep:      '#2D6A4F',
  primary:   '#40916C',
  mid:       '#52B788',
  light:     '#74C69D',
  pale:      '#B7E4C7',
  mint:      '#D8F3DC',

  // Earthy amber accent (sun/trunk tones from the logo)
  amber:     '#D4A017',
  amberLight:'#F4C842',

  // Neutrals
  charcoal:  '#1C2721',
  darkCard:  '#243B2F',
  midGray:   '#4A5E54',
  softGray:  '#A8BBB0',
  offWhite:  '#F4FAF6',
  white:     '#FFFFFF',
} as const;

// ─── Theme-aware colour map ──────────────────────────────────────────────────
const tintColorLight = Brand.primary;
const tintColorDark  = Brand.light;

export const Colors = {
  light: {
    text:            Brand.charcoal,
    background:      Brand.offWhite,
    card:            Brand.white,
    tint:            tintColorLight,
    icon:            Brand.midGray,
    tabIconDefault:  Brand.softGray,
    tabIconSelected: tintColorLight,
    border:          Brand.pale,
    placeholder:     Brand.softGray,
  },
  dark: {
    text:            Brand.offWhite,
    background:      Brand.charcoal,
    card:            Brand.darkCard,
    tint:            tintColorDark,
    icon:            Brand.softGray,
    tabIconDefault:  Brand.midGray,
    tabIconSelected: tintColorDark,
    border:          Brand.deep,
    placeholder:     Brand.midGray,
  },
};

// ─── Platform font stacks ────────────────────────────────────────────────────
export const Fonts = Platform.select({
  ios: {
    sans:    'system-ui',
    serif:   'ui-serif',
    rounded: 'ui-rounded',
    mono:    'ui-monospace',
  },
  default: {
    sans:    'normal',
    serif:   'serif',
    rounded: 'normal',
    mono:    'monospace',
  },
  web: {
    sans:    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif:   "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono:    "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
