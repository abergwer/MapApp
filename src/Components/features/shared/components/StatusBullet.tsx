import type { KeyboardEvent, MouseEvent } from 'react';
import styles from '../../../styles/shared/StatusBullet.module.css';

/** Visibility / presence state for hierarchical lists. */
export type StatusBulletState = 'on' | 'off' | 'partial' | 'unavailable';

/** Optional color accent; defaults derive from state. */
export type StatusBulletTone =
  | 'on'
  | 'off'
  | 'partial'
  | 'danger'
  | 'live'
  | 'primary'
  | 'success'
  | 'warning'
  | 'neutral';

export type StatusBulletSize = 'sm' | 'md';

interface StatusBulletProps {
  /** Preferred API for layers / groups. */
  state?: StatusBulletState;
  /** Legacy + semantic accent. When `state` is set, it takes precedence for shape. */
  tone?: StatusBulletTone;
  size?: StatusBulletSize;
  className?: string;
  onClick?: (event: MouseEvent) => void;
  title?: string;
}

const stateToTone: Record<StatusBulletState, StatusBulletTone> = {
  on: 'on',
  off: 'off',
  partial: 'partial',
  unavailable: 'neutral',
};

const toneClass: Record<StatusBulletTone, string> = {
  on: styles.toneOn,
  off: styles.toneOff,
  partial: styles.tonePartial,
  danger: styles.toneDanger,
  live: styles.toneLive,
  primary: styles.toneOn,
  success: styles.toneLive,
  warning: styles.toneWarning,
  neutral: styles.toneNeutral,
};

const sizeClass: Record<StatusBulletSize, string> = {
  sm: styles.sizeSm,
  md: styles.sizeMd,
};

/**
 * Generic status indicator for rows, groups, and lists.
 * Prefer `state` for visibility trees; `tone` for semantic accents (live, danger).
 */
export default function StatusBullet({
  state,
  tone,
  size = 'md',
  className,
  onClick,
  title,
}: StatusBulletProps) {
  const resolvedTone = tone ?? (state ? stateToTone[state] : 'off');
  const classes = [
    styles.bullet,
    sizeClass[size],
    toneClass[resolvedTone],
    onClick ? styles.clickable : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      className={classes}
      aria-hidden={onClick ? undefined : true}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      title={title}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e: KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick(e as unknown as MouseEvent);
              }
            }
          : undefined
      }
    />
  );
}
