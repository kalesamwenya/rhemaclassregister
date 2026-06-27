export const BaseColors = {
  blue: '#3b82f6',
  red: '#ef4444',
  emerald: '#10b981',
  amber: '#f59e0b',
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  }
};

export const getColors = (mode: 'light' | 'dark' = 'light', primary = BaseColors.blue) => {
  const isDark = mode === 'dark';

  return {
    primary: primary,
    primaryDark: primary, // Simplified for now
    secondary: BaseColors.red,
    secondaryDark: '#dc2626',

    background: isDark ? BaseColors.slate[950] : BaseColors.slate[50],
    surface: isDark ? BaseColors.slate[900] : '#ffffff',
    card: isDark ? BaseColors.slate[800] : '#ffffff',

    text: isDark ? '#f1f5f9' : BaseColors.slate[800],
    textLight: isDark ? BaseColors.slate[400] : BaseColors.slate[500],
    textLighter: isDark ? BaseColors.slate[500] : BaseColors.slate[400],

    border: isDark ? BaseColors.slate[800] : BaseColors.slate[200],

    success: BaseColors.emerald,
    warning: BaseColors.amber,
    danger: BaseColors.red,

    white: '#ffffff',
    black: '#000000',

    slate900: BaseColors.slate[900],
    slate950: BaseColors.slate[950],
    blue50: isDark ? '#1e293b' : '#eff6ff',
    blue100: isDark ? '#1e3a8a' : '#dbeafe',
    blue900: '#1e3a8a',
    blue950: '#172554',
  };
};

// Legacy support - default export
export const Colors = getColors('light', BaseColors.blue);

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};
