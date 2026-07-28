import type { ReactNode } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { observer } from 'mobx-react-lite';
import { useStores } from '../../stores/StoreContext';
import { THEMES } from '../../styles/system-ui/theme';

/**
 * Store-driven ThemeProvider: swaps the whole MUI theme (and the `--ma-*`
 * CSS variables injected by CssBaseline) when `themeStore.theme` changes,
 * so the user can switch the UI theme at runtime.
 */
function AppThemeProviderImpl({ children }: { children: ReactNode }) {
  const { themeStore } = useStores();
  return (
    <ThemeProvider theme={THEMES[themeStore.theme]}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

export default observer(AppThemeProviderImpl);
