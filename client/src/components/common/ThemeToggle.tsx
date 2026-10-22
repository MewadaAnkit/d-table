import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../app/store';
import { toggleTheme } from '../../features/theme/themeSlice';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const dispatch = useDispatch();
  const mode = useSelector((state: RootState) => state.theme?.mode || 'light');

  const handleToggle = () => {
    dispatch(toggleTheme());
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label="Toggle theme"
      title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
      className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center cursor-pointer"
    >
      {mode === 'light' ? (
        <Moon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
      ) : (
        <Sun className="w-5 h-5 text-amber-400" />
      )}
    </button>
  );
};
