import { useState } from 'react';
import { applyTheme, nextTheme, readTheme, type ThemeChoice } from '../theme';
import styles from './Shell.module.css';

const LABEL: Record<ThemeChoice, string> = { system: 'System', light: 'Light', dark: 'Dark' };

export function ThemeButton() {
  const [theme, setTheme] = useState<ThemeChoice>(readTheme);
  function cycle() {
    const t = nextTheme(theme);
    applyTheme(t);
    setTheme(t);
  }
  return (
    <button type="button" className={styles.theme} onClick={cycle}
      aria-label={`Color theme: ${LABEL[theme]}. Change to ${LABEL[nextTheme(theme)]}.`}>
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 1.75a6.25 6.25 0 0 1 0 12.5z" fill="currentColor" />
      </svg>
      <span className={styles.themeText}>{LABEL[theme]}</span>
    </button>
  );
}
