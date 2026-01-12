"use client";

import React, { createContext, useContext, useEffect, useState, useLayoutEffect } from "react";

type ThemeContextType = {
    isDarkMode: boolean;
    toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Use useLayoutEffect on client, useEffect on server
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [mounted, setMounted] = useState(false);

    useIsomorphicLayoutEffect(() => {
        const saved = localStorage.getItem("isDarkMode");
        if (saved !== null) {
            setIsDarkMode(saved === "true");
        } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
            setIsDarkMode(true);
        }
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted) {
            document.documentElement.classList.toggle("dark", isDarkMode);
        }
    }, [isDarkMode, mounted]);

    const toggleTheme = () => {
        const newVal = !isDarkMode;
        setIsDarkMode(newVal);
        localStorage.setItem("isDarkMode", String(newVal));
    };

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
            <div style={{ visibility: mounted ? "visible" : "hidden" }}>
                {children}
            </div>
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
