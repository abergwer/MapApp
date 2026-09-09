import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { useStores } from '../../stores/StoreContext';
import { TURN_STYLES, type TurnStyle } from '../../map/utils/geo';

/**
 * Post-draw editor for a selected Mixed Route: one dropdown per interior
 * waypoint to pick how the route turns there. Changes go through
 * `EntityService.update`, so they're undoable and notify the host app.
 * Renders nothing unless the selected shape is a mixed route.
 */
function RouteTurnsPanelImpl() {
  const { t } = useTranslation();
  const { drawingToolStore, entityService } = useStores();
  const shape = drawingToolStore.selectedShape;
  if (!shape || shape.kind !== 'mixedRoute') return null;

  const setTurn = (index: number, style: TurnStyle) => {
    const turns = shape.turns.slice();
    turns[index] = style;
    entityService.update({ ...shape, turns });
  };

  // Endpoints have no turn, so only waypoints 1 .. n-2 are listed.
  const interior = shape.positions.slice(1, -1);

  return (
    <Paper sx={{ px: 1.5, py: 1, minWidth: 220 }}>
      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
        {t('routeTurns.title')}
      </Typography>
      <Stack spacing={0.5}>
        {interior.map((_, i) => {
          const index = i + 1;
          return (
            <Stack key={index} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Typography variant="body2" sx={{ flex: 1 }}>
                {t('routeTurns.waypoint', { n: index + 1 })}
              </Typography>
              <Select
                size="small"
                value={shape.turns[index] ?? 'sharp'}
                onChange={(e) => setTurn(index, e.target.value as TurnStyle)}
                sx={{ minWidth: 120 }}
              >
                {TURN_STYLES.map((style) => (
                  <MenuItem key={style} value={style}>
                    {t(`routeTurns.${style}`)}
                  </MenuItem>
                ))}
              </Select>
            </Stack>
          );
        })}
      </Stack>
    </Paper>
  );
}

export default observer(RouteTurnsPanelImpl);
