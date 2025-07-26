import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // 從 localStorage 讀取主題，預設為 'light'
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme || 'light';
      } catch (error) {
        console.warn('Failed to read theme from localStorage:', error);
        return 'light';
      }
    }
    return 'light';
  });

  // 應用主題到 DOM
  useEffect(() => {
    try {
      const root = window.document.documentElement;
      const body = window.document.body;
      
      if (theme === 'dark') {
        root.classList.add('dark');
        body.classList.add('dark');
      } else {
        root.classList.remove('dark');
        body.classList.remove('dark');
      }
      
      // 持久化到 localStorage
      localStorage.setItem('theme', theme);
    } catch (error) {
      console.error('Failed to apply theme:', error);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  const setLightTheme = () => {
    setTheme('light');
  };

  const setDarkTheme = () => {
    setTheme('dark');
  };

  const value = {
    theme,
    setTheme,
    toggleTheme,
    setLightTheme,
    setDarkTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;