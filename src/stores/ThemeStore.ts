import { makeAutoObservable } from 'mobx';
import type { ThemeName } from '../Components/layout/styles/tokens';

/** Active UI theme ('dark' = Night Ops, 'light' = Day Ops). */
export class ThemeStore {
  theme: ThemeName = 'dark';

  constructor() {
    makeAutoObservable(this);
  }

  setTheme(theme: ThemeName) {
    this.theme = theme;
  }

  toggle() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
  }
}
