import type { CSSProperties } from 'react';
import iconStyles from '../../../styles/shared/ConfigIcon.module.css';

export type ConfigIconTone = 'light' | 'active' | 'danger' | 'muted' | 'none';

interface ConfigIconProps {
  iconPath: string;
  className?: string;
  tone?: ConfigIconTone;
  /** Soft accent color (CSS color / var). Uses mask tint instead of grayscale filter. */
  tint?: string;
}

const toneClass: Record<ConfigIconTone, string | undefined> = {
  light: iconStyles.iconToneLight,
  active: iconStyles.iconToneActive,
  danger: iconStyles.iconToneDanger,
  muted: iconStyles.iconToneMuted,
  none: iconStyles.icon,
};

/** Renders an icon from an external config path — no inline SVG. */
export default function ConfigIcon({
  iconPath,
  className,
  tone = 'light',
  tint,
}: ConfigIconProps) {
  if (tint) {
    const classes = [iconStyles.iconTint, className].filter(Boolean).join(' ');
    const style = {
      '--config-icon-tint': tint,
      WebkitMaskImage: `url(${iconPath})`,
      maskImage: `url(${iconPath})`,
    } as CSSProperties;
    return <span className={classes} style={style} aria-hidden="true" />;
  }

  const toneCls = toneClass[tone] ?? iconStyles.iconToneLight;
  const classes = className ? `${toneCls} ${className}` : toneCls;
  return <img className={classes} src={iconPath} alt="" draggable={false} />;
}
