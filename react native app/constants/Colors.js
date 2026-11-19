// Smart City Color System (Dark & Light Theme Tokens)

export const DarkTheme = {
  isDark: true,
  background: '#030712',
  surface: '#0f172a',
  surfaceBorder: 'rgba(51, 65, 85, 0.7)',
  card: '#0f172a',
  cardBorder: 'rgba(51, 65, 85, 0.7)',
  cardSubtle: '#1e293b',
  subtle: '#070b14',
  headerBg: '#0f172a',
  footerBg: '#0f172a',
  footerBorder: 'rgba(51, 65, 85, 0.7)',
  trackBg: 'rgba(30, 41, 59, 0.8)',
  text: {
    primary: '#f8fafc',
    secondary: '#94a3b8',
    muted: '#64748b',
    invert: '#030712'
  },
  brand: {
    sky: '#38bdf8',
    blue: '#0ea5e9',
    darkBlue: '#0284c7'
  },
  status: {
    success: '#10b981',
    successBg: 'rgba(16, 185, 129, 0.15)',
    successBorder: 'rgba(16, 185, 129, 0.3)',
    warning: '#f59e0b',
    warningBg: 'rgba(245, 158, 11, 0.15)',
    warningBorder: 'rgba(245, 158, 11, 0.3)',
    danger: '#ef4444',
    dangerBg: 'rgba(239, 68, 68, 0.15)',
    dangerBorder: 'rgba(239, 68, 68, 0.3)'
  }
};

export const LightTheme = {
  isDark: false,
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceBorder: 'rgba(203, 213, 225, 0.8)',
  card: '#ffffff',
  cardBorder: 'rgba(226, 232, 240, 0.9)',
  cardSubtle: '#f1f5f9',
  subtle: '#f8fafc',
  headerBg: '#ffffff',
  footerBg: '#ffffff',
  footerBorder: 'rgba(226, 232, 240, 0.9)',
  trackBg: 'rgba(226, 232, 240, 0.9)',
  text: {
    primary: '#0f172a',
    secondary: '#475569',
    muted: '#94a3b8',
    invert: '#ffffff'
  },
  brand: {
    sky: '#0284c7',
    blue: '#0ea5e9',
    darkBlue: '#0369a1'
  },
  status: {
    success: '#059669',
    successBg: 'rgba(16, 185, 129, 0.12)',
    successBorder: 'rgba(16, 185, 129, 0.25)',
    warning: '#d97706',
    warningBg: 'rgba(245, 158, 11, 0.12)',
    warningBorder: 'rgba(245, 158, 11, 0.25)',
    danger: '#dc2626',
    dangerBg: 'rgba(239, 68, 68, 0.12)',
    dangerBorder: 'rgba(239, 68, 68, 0.25)'
  }
};

// Legacy fallback export
export const Colors = DarkTheme;
