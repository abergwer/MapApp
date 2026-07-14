import iconStyles from '../../../styles/shared/ConfigIcon.module.css';

export type ConfigIconTone = 'light' | 'active' | 'danger' | 'muted' | 'none';

interface ConfigIconProps {
  iconPath: string;
  className?: string;
  tone?: ConfigIconTone;
}

const toneClass: Record<ConfigIconTone, string | undefined> = {
  light: iconStyles.iconToneLight,
  active: iconStyles.iconToneActive,
  danger: iconStyles.iconToneDanger,
  muted: iconStyles.iconToneMuted,
  none: iconStyles.icon,
};

/** Renders an icon from an external config path — no inline SVG. */
export default function ConfigIcon({ iconPath, className, tone = 'light' }: ConfigIconProps) {
  const toneCls = toneClass[tone] ?? iconStyles.iconToneLight;
  const classes = className ? `${toneCls} ${className}` : toneCls;
  return <img className={classes} src={iconPath} alt="" draggable={false} />;
}
