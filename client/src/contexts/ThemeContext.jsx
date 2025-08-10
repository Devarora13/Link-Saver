import { createContext, useContext, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  const dark = theme === 'dark';

  const toggleTheme = () => {
    setTheme(dark ? 'light' : 'dark');
  };

  // Apply theme to document root for potential CSS custom properties
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const value = {
    dark,
    toggleTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
