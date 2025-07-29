import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeContext.jsx';

const ThemeSwitcher = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button
      onClick={toggleTheme}
      className={`
        relative inline-flex items-center h-7 w-12 rounded-full transition-colors duration-300 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-glory-red-500 dark:focus:ring-offset-dark-surface
        ${theme === 'dark' ? 'bg-glory-red-500' : 'bg-graphite-200 dark:bg-graphite-600'}
      `}
      aria-label={`切換至${theme === 'dark' ? '淺色' : '深色'}模式`}
      title={`切換至${theme === 'dark' ? '淺色' : '深色'}模式`}
    >
      <span
        className={`
          inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300 ease-in-out
          flex items-center justify-center
          ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}
        `}
      >
        {theme === 'dark' 
          ? <Moon size={12} className="text-glory-red-500" /> 
          : <Sun size={12} className="text-yellow-500" />
        }
      </span>
    </button>
  );
};

export default ThemeSwitcher;