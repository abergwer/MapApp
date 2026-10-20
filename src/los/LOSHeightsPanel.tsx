import { observer } from 'mobx-react-lite';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import { useTranslation } from 'react-i18next';
import { useStores } from '../stores/StoreContext';
import * as styles from './los.styles';

/** LOS settings section: observer/target heights above ground. */
function LOSHeightsFieldsImpl() {
  const { t } = useTranslation();
  const { losStore } = useStores();

  const heightField = (
    label: string,
    value: number,
    onChange: (heightM: number) => void,
  ) => (
    <TextField
      label={label}
      type="number"
      size="small"
      fullWidth
      value={value}
      sx={styles.heightField}
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
    <Stack direction="row" spacing={1}>
      {heightField(t('LOS.panel.observer'), losStore.observerHeightM, losStore.setObserverHeight)}
      {heightField(t('LOS.panel.target'), losStore.targetHeightM, losStore.setTargetHeight)}
    </Stack>
  );
}

const LOSHeightsFields = observer(LOSHeightsFieldsImpl);
export default LOSHeightsFields;
