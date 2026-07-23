import { createContext, useContext, useEffect, useState } from 'react';

// To add a theme: add an entry here and a matching
// :root[data-theme="<value>"] { ... } block in index.css.
// `system` follows the OS preference and is resolved to light/dark at runtime.
export const THEMES = [
    { value: 'system', label: 'System' },
    { value: 'light',  label: 'Light' },
    { value: 'dark',   label: 'Dark' },
    { value: 'sky',   label: 'Sky' },
];

const STORAGE_KEY = 'theme';

function systemTheme() {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(theme) {
    return theme === 'system' ? systemTheme() : theme;
}

function applyTheme(theme) {
    document.documentElement.dataset.theme = resolveTheme(theme);
}

// Read the saved choice and apply it at module load — before React renders —
// so there's no flash of the default theme on first paint.
const initialTheme = localStorage.getItem(STORAGE_KEY) || 'system';
applyTheme(initialTheme);

const ThemeContext = createContext(undefined);

export function ThemeProvider({ children }) {
    const [theme, setThemeState] = useState(initialTheme);

    const setTheme = (next) => {
        setThemeState(next);
        localStorage.setItem(STORAGE_KEY, next);
        applyTheme(next);
    };

    // While following the system, react to OS light/dark changes live.
    useEffect(() => {
        if (theme !== 'system') return;
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const onChange = () => applyTheme('system');
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}