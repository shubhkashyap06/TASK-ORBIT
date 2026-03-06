import React, { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext(null)

const THEMES = {
    dark: {
        name: 'dark',
        bg: '#0f0f17',
        bgSecondary: '#1a1a2e',
        bgCard: '#1e1e32',
        bgHover: '#252540',
        bgInput: '#16162a',
        border: 'rgba(255,255,255,0.08)',
        borderHover: 'rgba(167,139,250,0.3)',
        text: '#f1f0f5',
        textSecondary: '#9b97b0',
        textMuted: '#5f5b73',
        accent: '#7c3aed',
        accentLight: '#a78bfa',
        accentBg: 'rgba(124,58,237,0.12)',
        shadow: 'rgba(0,0,0,0.3)',
        danger: '#ef4444',
        dangerBg: 'rgba(239,68,68,0.12)',
        success: '#22c55e',
        warning: '#f59e0b',
        columnBg: 'rgba(26,26,46,0.7)',
    },
    light: {
        name: 'light',
        bg: '#f5f5fa',
        bgSecondary: '#ffffff',
        bgCard: '#ffffff',
        bgHover: '#f0eef7',
        bgInput: '#f0eef7',
        border: 'rgba(0,0,0,0.08)',
        borderHover: 'rgba(124,58,237,0.3)',
        text: '#1a1a2e',
        textSecondary: '#6b6885',
        textMuted: '#9b97b0',
        accent: '#7c3aed',
        accentLight: '#8b5cf6',
        accentBg: 'rgba(124,58,237,0.08)',
        shadow: 'rgba(0,0,0,0.06)',
        danger: '#ef4444',
        dangerBg: 'rgba(239,68,68,0.08)',
        success: '#16a34a',
        warning: '#d97706',
        columnBg: '#ffffff',
    },
}

export function ThemeProvider({ children }) {
    const [themeName, setThemeName] = useState(() => {
        try {
            return localStorage.getItem('kanban-theme') || 'dark'
        } catch {
            return 'dark'
        }
    })

    const theme = THEMES[themeName] || THEMES.dark

    const toggleTheme = () => {
        const next = themeName === 'dark' ? 'light' : 'dark'
        setThemeName(next)
        try { localStorage.setItem('kanban-theme', next) } catch { }
    }

    return (
        <ThemeContext.Provider value={{ theme, themeName, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const ctx = useContext(ThemeContext)
    if (!ctx) throw new Error('useTheme must be inside ThemeProvider')
    return ctx
}
