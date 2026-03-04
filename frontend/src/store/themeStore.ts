import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'dark' | 'light';

interface ThemeState {
    theme: Theme;
    setTheme: (t: Theme) => void;
    toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            theme: 'dark',

            setTheme: (theme: Theme) => {
                set({ theme });
                applyTheme(theme);
            },

            toggleTheme: () => {
                const next = get().theme === 'dark' ? 'light' : 'dark';
                set({ theme: next });
                applyTheme(next);
            },
        }),
        {
            name: 'solarscope-theme',
            onRehydrateStorage: () => (state) => {
                if (state) applyTheme(state.theme);
            },
        }
    )
);

function applyTheme(theme: Theme) {
    const root = document.documentElement;
    if (theme === 'light') {
        root.classList.add('light');
        root.classList.remove('dark');
    } else {
        root.classList.add('dark');
        root.classList.remove('light');
    }
}

// Apply on first load
applyTheme(useThemeStore.getState().theme);
