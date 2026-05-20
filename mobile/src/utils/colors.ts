export const Colors = {
  brand: { 50: '#eef2ff', 100: '#e0e7ff', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca' },
  gray: {
    50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb', 300: '#d1d5db',
    400: '#9ca3af', 500: '#6b7280', 600: '#4b5563', 700: '#374151',
    800: '#1f2937', 900: '#111827', 950: '#030712',
  },
  red: { 500: '#ef4444' },
  green: { 500: '#22c55e' },
  amber: { 500: '#f59e0b' },
  white: '#ffffff',
  black: '#000000',
}

export const darkTheme = {
  bg: Colors.gray[950],
  bgCard: Colors.gray[900],
  bgInput: Colors.gray[800],
  border: Colors.gray[800],
  text: '#f9fafb',
  textMuted: Colors.gray[400],
  tabBar: Colors.gray[900],
}

export const lightTheme = {
  bg: Colors.gray[50],
  bgCard: Colors.white,
  bgInput: Colors.white,
  border: Colors.gray[200],
  text: Colors.gray[900],
  textMuted: Colors.gray[500],
  tabBar: Colors.white,
}
