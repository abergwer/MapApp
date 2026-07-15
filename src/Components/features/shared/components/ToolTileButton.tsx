import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import ConfigIcon from './ConfigIcon';
import iconStyles from '../../../styles/shared/ConfigIcon.module.css';

export interface ToolTileButtonProps {
  label: string;
  iconPath: string;
  active?: boolean;
  disabled?: boolean;
  danger?: boolean;
  /** Soft accent for the icon (Entities / tools). Ignored when active (uses bright tone). */
  iconTint?: string;
  onClick: () => void;
}

/** Grid tool tile — styles from MUI theme variant toolTile / toolDanger. */
export default function ToolTileButton({
  label,
  iconPath,
  active = false,
  disabled = false,
  danger = false,
  iconTint,
  onClick,
}: ToolTileButtonProps) {
  if (danger) {
    return (
      <Button variant="toolDanger" disabled={disabled} onClick={onClick} fullWidth>
        <ConfigIcon iconPath={iconPath} tone="danger" className={iconStyles.iconToolTile} />
        <Typography variant="toolTileLabel" component="span">
          {label}
        </Typography>
      </Button>
    );
  }

  return (
    <Button
      variant="toolTile"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={active}
      fullWidth
    >
      <ConfigIcon
        iconPath={iconPath}
        tone={active ? 'active' : 'light'}
        tint={active ? undefined : iconTint}
        className={iconStyles.iconToolTile}
      />
      <Typography variant="toolTileLabel" component="span">
        {label}
      </Typography>
    </Button>
  );
}
