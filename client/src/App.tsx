import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import { store, RootState } from './app/store';
import { AppRoutes } from './routes/AppRoutes';

const ThemeSync: React.FC = () => {
  const mode = useSelector((state: RootState) => state.theme?.mode || 'light');

  useEffect(() => {
    const root = document.documentElement;
    if (mode === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      localStorage.setItem('attendly-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      localStorage.setItem('attendly-theme', 'light');
    }
  }, [mode]);

  return null;
};

export const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ThemeSync />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </Provider>
  );
};

export default App;
