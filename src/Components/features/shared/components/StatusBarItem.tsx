import styles from '../../../styles/shared/StatusBarItem.module.css';

export type StatusBarItemTone = 'default' | 'success' | 'warning' | 'danger' | 'muted';

export interface StatusBarItemProps {
  label: string;
  value?: string | null;
  tone?: StatusBarItemTone;
  className?: string;
}

const toneClass: Record<StatusBarItemTone, string> = {
  default: styles.toneDefault,
  success: styles.toneSuccess,
  warning: styles.toneWarning,
  danger: styles.toneDanger,
  muted: styles.toneMuted,
};

/**
 * Compact label/value cell for the operational status bar.
 * Missing values render as an em dash — never invent telemetry.
 */
export default function StatusBarItem({
  label,
  value,
  tone = 'default',
  className,
}: StatusBarItemProps) {
  const display = value == null || value === '' ? '—' : value;
  const classes = [styles.item, toneClass[tone], className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{display}</span>
    </div>
  );
}
