import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeContext.jsx';

const ThemeSwitcher = ({ className = "" }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        p-2 rounded-full 
        text-graphite-500 dark:text-dark-text-subtle 
        hover:bg-graphite-200 dark:hover:bg-dark-surface 
        transition-theme
        focus:outline-none focus:ring-2 focus:ring-glory-red-500 dark:focus:ring-dark-primary
        ${className}
      `}
      title={`切換至${theme === 'dark' ? '淺色' : '深色'}模式`}
      aria-label={`切換至${theme === 'dark' ? '淺色' : '深色'}模式`}
    >
      {theme === 'dark' ? (
        <Sun size={18} className="text-dark-accent transition-theme" />
      ) : (
        <Moon size={18} className="text-graphite-500 transition-theme" />
      )}
    </button>
  );
};

export default ThemeSwitcher;