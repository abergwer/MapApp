import styles from '../../../styles/shared/StatusBullet.module.css';

export type StatusBulletTone = 'on' | 'off' | 'partial' | 'danger' | 'live';
export type StatusBulletSize = 'sm' | 'md';

interface StatusBulletProps {
  tone?: StatusBulletTone;
  size?: StatusBulletSize;
  className?: string;
}

const toneClass: Record<StatusBulletTone, string> = {
  on: styles.toneOn,
  off: styles.toneOff,
  partial: styles.tonePartial,
  danger: styles.toneDanger,
  live: styles.toneLive,
};

const sizeClass: Record<StatusBulletSize, string> = {
  sm: styles.sizeSm,
  md: styles.sizeMd,
};

/**
 * Generic status dot for rows, groups, and lists.
 * Same look everywhere — panels pass tone/size only.
 */
export default function StatusBullet({
  tone = 'off',
  size = 'md',
  className,
}: StatusBulletProps) {
  const classes = [styles.bullet, sizeClass[size], toneClass[tone], className]
    .filter(Boolean)
    .join(' ');

  return <span className={classes} aria-hidden="true" />;
}
