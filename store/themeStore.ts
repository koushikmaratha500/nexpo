import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      isDark: false,
      toggleTheme: () => {
        const nextTheme = get().theme === 'light' ? 'dark' : 'light';
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', nextTheme === 'dark');
        }
        set({ theme: nextTheme, isDark: nextTheme === 'dark' });
      },
      setTheme: (theme: Theme) => {
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', theme === 'dark');
        }
        set({ theme, isDark: theme === 'dark' });
      },
    }),
    {
      name: 'nexpo_theme_store',
    }
  )
);

if (typeof window !== 'undefined') {
  const { theme } = useThemeStore.getState();
  document.documentElement.classList.toggle('dark', theme === 'dark');
}
