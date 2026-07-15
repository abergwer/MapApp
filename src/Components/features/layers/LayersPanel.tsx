import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import { observer } from 'mobx-react-lite';
import { useStores } from '../../../stores/StoreContext';
import type { EntityLayerId } from '../../../stores/UIVisibilityStore';
import { palette } from '../../../styles/system-ui/tokens';
import * as styles from '../../../styles/features/layers.styles';

interface LayerRowDef {
  id: EntityLayerId;
  label: string;
  color: string;
}

const GROUPS: { title: string; rows: LayerRowDef[] }[] = [
  {
    title: 'Air Units',
    rows: [
      { id: 'aircraft', label: 'Aircraft', color: palette.aircraft },
      { id: 'drones', label: 'Drones', color: palette.drone },
    ],
  },
  {
    title: 'Ordnance',
    rows: [{ id: 'missiles', label: 'Missiles', color: palette.missile }],
  },
  {
    title: 'Overlays',
    rows: [
      { id: 'polygons', label: 'Zones', color: palette.area },
      { id: 'rangeRings', label: 'Range Rings', color: palette.drone },
      { id: 'drawnShapes', label: 'Drawn Shapes', color: palette.accent },
    ],
  },
];

/** Layer toggles + live entity counts, driven by UIVisibilityStore.
 *  Rendered inside a LayoutManager panel (which provides the chrome). */
function LayersPanelImpl() {
  const stores = useStores();
  const { uiVisibilityStore: vis } = stores;

  const counts: Record<EntityLayerId, number> = {
    aircraft: stores.airCraftStore.targets.length,
    drones: stores.droneStore.targets.length,
    missiles: stores.missileStore.missiles.length,
    polygons: stores.polygonStore.polygons.length,
    rangeRings: stores.droneStore.targets.length,
    drawnShapes: stores.drawingToolStore.completedShapes.length,
  };

  return (
    <Box>
      {GROUPS.map((group) => (
        <Box key={group.title}>
          <Typography sx={styles.groupTitle}>{group.title}</Typography>
          {group.rows.map((row) => (
            <Box key={row.id} sx={styles.layerRow} onClick={() => vis.toggleLayer(row.id)}>
              <Checkbox
                checked={vis.isLayerVisible(row.id)}
                onChange={() => vis.toggleLayer(row.id)}
                onClick={(e) => e.stopPropagation()}
                slotProps={{ input: { 'aria-label': `Toggle ${row.label} layer` } }}
              />
              <Box sx={styles.layerSwatch(row.color)} />
              <Typography sx={styles.layerLabel}>{row.label}</Typography>
              <Typography sx={styles.layerCount}>{counts[row.id]}</Typography>
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  );
}

export default observer(LayersPanelImpl);
