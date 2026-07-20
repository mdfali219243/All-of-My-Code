export type ThemeMode = 'dark' | 'light';

export type ThemeColors = {
  bg: string;
  bgSecondary: string;
  surface: string;
  surfaceHover: string;
  surfaceMuted: string;
  border: string;
  text: string;
  textMuted: string;
  textDim: string;
  brand: string;
  brandDark: string;
  brandLight: string;
  brandGlow: string;
  accent: string;
  accentSoft: string;
  error: string;
  errorBg: string;
  success: string;
  white: string;
  overlay: string;
};

export const darkColors: ThemeColors = {
  bg: '#0f1117',
  bgSecondary: '#18191a',
  surface: '#242526',
  surfaceHover: '#3a3b3c',
  surfaceMuted: '#1c1d1f',
  border: '#393a3b',
  text: '#e4e6eb',
  textMuted: '#b0b3b8',
  textDim: '#8a8d91',
  brand: '#6366f1',
  brandDark: '#4f46e5',
  brandLight: '#818cf8',
  brandGlow: 'rgba(99, 102, 241, 0.35)',
  accent: '#ec4899',
  accentSoft: 'rgba(236, 72, 153, 0.15)',
  error: '#f87171',
  errorBg: 'rgba(248, 113, 113, 0.12)',
  success: '#34d399',
  white: '#ffffff',
  overlay: 'rgba(15, 17, 23, 0.85)',
};

export const lightColors: ThemeColors = {
  bg: '#f0f2f5',
  bgSecondary: '#ffffff',
  surface: '#ffffff',
  surfaceHover: '#e4e6eb',
  surfaceMuted: '#f7f8fa',
  border: '#dddfe2',
  text: '#050505',
  textMuted: '#65676b',
  textDim: '#8a8d91',
  brand: '#6366f1',
  brandDark: '#4f46e5',
  brandLight: '#4f46e5',
  brandGlow: 'rgba(99, 102, 241, 0.2)',
  accent: '#db2777',
  accentSoft: 'rgba(219, 39, 119, 0.1)',
  error: '#dc2626',
  errorBg: 'rgba(220, 38, 38, 0.08)',
  success: '#059669',
  white: '#ffffff',
  overlay: 'rgba(0, 0, 0, 0.45)',
};

/** Default dark palette — prefer `useTheme().colors` in new UI. */
export const colors = darkColors;

export function getThemeColors(mode: ThemeMode): ThemeColors {
  return mode === 'light' ? lightColors : darkColors;
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

export const typography = {
  hero: { fontSize: 36, fontWeight: '800' as const, letterSpacing: -0.5 },
  title: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.3 },
  heading: { fontSize: 20, fontWeight: '700' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  bodyMedium: { fontSize: 15, fontWeight: '500' as const },
  caption: { fontSize: 13, fontWeight: '500' as const },
  label: { fontSize: 13, fontWeight: '600' as const, letterSpacing: 0.3 },
};

export function avatarUrl(name: string, bg = '6366f1') {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff&size=128&bold=true`;
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
