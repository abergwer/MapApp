import { designSystemConfig } from './config/designSystem.config';
import createAppTheme from './Components/styles/mui/createAppTheme';

/** Apply CSS theme tokens before first paint (must match ThemeProvider mode). */
if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('data-app-theme', designSystemConfig.mode);
}

export default createAppTheme(designSystemConfig.mode);
