/**
 * HugATree brand colour palette.
 *
 * Derived from the HugATree logo:
 *   - The tree canopy uses a vivid forest-green family
 *   - Warm earthy amber/brown tones from the trunk & logo text
 *   - Neutrals keep text readable in both light and dark modes
 *
 * Usage:
 *   import { Brand, Colors, Fonts } from '@/constants/theme';
 *
 *   // Flat token (always the same hex):
 *   backgroundColor: Brand.primary
 *
 *   // Theme-aware token (switches with color scheme):
 *   const scheme = useColorScheme();
 *   const c = Colors[scheme ?? 'light'];
 *   color: c.text
 */

import { Platform } from 'react-native';

// ─────────────────────────────────────────────────────────────
// Brand tokens — raw hex values, never depend on color scheme
// ─────────────────────────────────────────────────────────────
export const Brand = {
  // Forest-green family (darkest → lightest)
  forest:    '#1B4332',   // deep dark green — shadows, focus rings
  deep:      '#2D6A4F',   // dark muted green — dark-mode borders
  primary:   '#40916C',   // main brand green — buttons, links, accents
  mid:       '#52B788',   // medium green — secondary accents
  light:     '#74C69D',   // light green — dark-mode tint / highlights
  pale:      '#B7E4C7',   // very light green — light-mode borders
  mint:      '#D8F3DC',   // near-white green — backgrounds, badges

  // Earthy amber accent (mirrors the warm browns/yellows in the logo)
  amber:     '#D4A017',   // golden amber — badges, stars, highlights
  amberLight:'#F4C842',   // bright yellow — active states, warnings

  // Neutral / UI grays
  charcoal:  '#1C2721',   // near-black green-tinted — dark-mode background
  darkCard:  '#243B2F',   // slightly lighter — dark-mode card surfaces
  midGray:   '#4A5E54',   // mid-tone — secondary text, light-mode icons
  softGray:  '#A8BBB0',   // soft gray-green — placeholder text, dark icons
  offWhite:  '#F4FAF6',   // warm off-white — light-mode background
  white:     '#FFFFFF',   // pure white — cards, buttons, icons on colour
} as const;

// ─────────────────────────────────────────────────────────────
// Theme-aware color map — plug into useColorScheme()
// ─────────────────────────────────────────────────────────────
const tintColorLight = Brand.primary;  // green CTA in light mode
const tintColorDark  = Brand.light;    // lighter green tint in dark mode

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

// ─────────────────────────────────────────────────────────────
// Platform font stacks
// ─────────────────────────────────────────────────────────────
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
