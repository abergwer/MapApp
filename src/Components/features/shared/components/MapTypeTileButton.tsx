import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ConfigIcon from './ConfigIcon';
import layout from '../../../styles/layouts/panelLayout.module.css';

export interface MapTypeTileButtonProps {
  label: string;
  description: string;
  iconPath: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

/** Map type selector tile — theme variant mapType on Button. */
export default function MapTypeTileButton({
  label,
  description,
  iconPath,
  active = false,
  disabled = false,
  onClick,
}: MapTypeTileButtonProps) {
  return (
    <Button
      variant="mapType"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={active}
      fullWidth
    >
      <Stack className={layout.mapTypeHeader}>
        <ConfigIcon iconPath={iconPath} tone={active ? 'active' : 'light'} />
        <Typography variant="toolTileLabel" component="span">
          {label}
        </Typography>
      </Stack>
      <Typography variant="mutedCaption" component="span">
        {description}
      </Typography>
    </Button>
  );
}
