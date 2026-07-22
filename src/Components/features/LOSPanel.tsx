import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import Button from '@mui/material/Button';
import Popover from '@mui/material/Popover';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Tooltip from '@mui/material/Tooltip';
import TuneIcon from '@mui/icons-material/Tune';
import { useStores } from '../../stores/StoreContext';

/** LOS settings popover: observer/target heights above ground. */
function LOSPanelImpl() {
  const { losStore } = useStores();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  const heightField = (
    label: string,
    value: number,
    onChange: (heightM: number) => void,
  ) => (
    <TextField
      label={label}
      type="number"
      size="small"
      value={value}
      onChange={(e) => {
        const v = Number(e.target.value);
        if (Number.isFinite(v) && v >= 0) onChange(v);
      }}
      slotProps={{
        input: { endAdornment: <InputAdornment position="end">m</InputAdornment> },
        htmlInput: { min: 0, step: 1 },
      }}
    />
  );

  return (
    <>
      <Tooltip title="LOS settings (heights)">
        <Button
          color="inherit"
          onClick={(e) => setAnchor(e.currentTarget)}
          sx={{ minWidth: 0, px: 1 }}
        >
          <TuneIcon fontSize="small" />
        </Button>
      </Tooltip>

      <Popover
        open={anchor !== null}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Stack spacing={2} sx={{ p: 2, width: 260 }}>
          <Typography variant="subtitle2">LOS — heights above ground</Typography>
          {heightField('Observer', losStore.observerHeightM, losStore.setObserverHeight)}
          {heightField('Target', losStore.targetHeightM, losStore.setTargetHeight)}
        </Stack>
      </Popover>
    </>
  );
}

const LOSPanel = observer(LOSPanelImpl);
export default LOSPanel;
