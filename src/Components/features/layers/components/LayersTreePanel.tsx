import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Switch from '@mui/material/Switch';
import { layersSidebarConfig } from '../config/layersSidebar.config';
import { buildLayerTreeView, type LayerTreeGroup } from '../utils/layerTreeView';
import { useStores } from '../../../../stores/StoreContext';
import StatusBullet from '../../shared/components/StatusBullet';
import styles from '../../../styles/left-sidebar/LeftSidebar.module.css';

function GroupNode({
  group,
  expanded,
  onToggleExpand,
}: {
  group: LayerTreeGroup;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const { layerVisibilityStore } = useStores();
  const state = layerVisibilityStore.groupState(group.id);
  const hasChildren = group.children.length > 0;
  const groupOn = state === 'on' || state === 'partial';

  const toggleGroup = () => {
    layerVisibilityStore.toggleGroup(group.id);
  };

  return (
    <div className={styles.groupBlock}>
      <div className={styles.row}>
        {hasChildren ? (
          <button
            type="button"
            className={[styles.chevron, expanded ? styles.chevronOpen : '']
              .filter(Boolean)
              .join(' ')}
            aria-expanded={expanded}
            aria-label={expanded ? `Collapse ${group.label}` : `Expand ${group.label}`}
            onClick={onToggleExpand}
          >
            <ExpandMoreIcon sx={{ fontSize: 16 }} />
          </button>
        ) : (
          <span className={styles.chevronSpacer} aria-hidden="true" />
        )}

        <StatusBullet state={state} size="md" />

        <button type="button" className={styles.rowToggle} onClick={toggleGroup}>
          <span className={styles.rowName}>{group.label}</span>
        </button>

        <span className={styles.rowCount}>{group.count}</span>

        <Switch
          size="small"
          checked={groupOn}
          onChange={toggleGroup}
          slotProps={{
            input: {
              'aria-label': `Toggle ${group.label}`,
              'aria-checked': state === 'partial' ? 'mixed' : groupOn,
            },
          }}
        />
      </div>

      {hasChildren && expanded && (
        <ul className={styles.childList}>
          {group.children.map((child) => {
            const enabled = layerVisibilityStore.isLayerEnabled(child.id);
            const effectivelyVisible = layerVisibilityStore.isLayerVisible(child.id);
            return (
              <li key={child.id} className={styles.childRow}>
                <span className={styles.chevronSpacer} aria-hidden="true" />
                <StatusBullet state={effectivelyVisible ? 'on' : 'off'} size="md" />
                <button
                  type="button"
                  className={styles.rowToggle}
                  onClick={() => layerVisibilityStore.toggleLayer(child.id)}
                >
                  <span className={styles.rowName}>{child.label}</span>
                </button>
                <span className={styles.rowCountSpacer} aria-hidden="true" />
                <Switch
                  size="small"
                  checked={enabled}
                  onChange={() => layerVisibilityStore.toggleLayer(child.id)}
                  slotProps={{
                    input: { 'aria-label': `Toggle ${child.label}` },
                  }}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

const GroupNodeObserved = observer(GroupNode);

function LayersTreeBody() {
  const stores = useStores();
  const { layerVisibilityStore } = stores;
  const [query, setQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());

  void stores.airCraftStore.targets.length;
  void stores.droneStore.targets.length;
  void stores.missileStore.missiles.length;
  void stores.polygonStore.polygons.length;
  void stores.drawingToolStore.completedShapes.length;

  const groups = layerVisibilityStore.groups;

  useEffect(() => {
    if (groups.length === 0) return;
    setExpandedIds((prev) => {
      if (prev.size > 0) return prev;
      return new Set(groups.filter((g) => g.layers.length > 1).map((g) => g.id));
    });
  }, [groups]);

  const { categories, autoExpandGroupIds } = buildLayerTreeView(
    layerVisibilityStore.groups,
    stores,
    query,
  );

  const searching = query.trim().length > 0;

  const isExpanded = (id: string) =>
    searching ? autoExpandGroupIds.has(id) || expandedIds.has(id) : expandedIds.has(id);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <>
      <div className={styles.searchWrap}>
        <input
          className={styles.search}
          type="search"
          placeholder={layersSidebarConfig.searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={layersSidebarConfig.searchPlaceholder}
        />
      </div>
      <div className={styles.scroll}>
        {layerVisibilityStore.groups.length === 0 ? (
          <p className={styles.empty}>{layersSidebarConfig.emptyGroups}</p>
        ) : categories.length === 0 ? (
          <p className={styles.empty}>No matching layers</p>
        ) : (
          categories.map((cat) => (
            <section key={cat.id} className={styles.category}>
              <h3 className={styles.categoryLabel}>{cat.label}</h3>
              {cat.groups.map((group) => (
                <GroupNodeObserved
                  key={group.id}
                  group={group}
                  expanded={isExpanded(group.id)}
                  onToggleExpand={() => toggleExpand(group.id)}
                />
              ))}
            </section>
          ))
        )}
      </div>
    </>
  );
}

const LayersTreeBodyObserved = observer(LayersTreeBody);

function AlertsSection() {
  const { title, emptyMessage } = layersSidebarConfig.alerts;
  const alertCount = 0;

  return (
    <section className={styles.alerts} aria-label={title}>
      <div className={styles.alertsHeader}>
        <h3 className={styles.alertsTitle}>{title}</h3>
        <span className={styles.alertsCount}>{alertCount}</span>
      </div>
      <div className={styles.alertsBody}>
        <p className={styles.alertsEmpty}>{emptyMessage}</p>
      </div>
    </section>
  );
}

/** Layers tab content: searchable tree + alerts strip. */
function LayersTreePanelImpl() {
  return (
    <>
      <LayersTreeBodyObserved />
      <AlertsSection />
    </>
  );
}

const LayersTreePanel = observer(LayersTreePanelImpl);
export default LayersTreePanel;
