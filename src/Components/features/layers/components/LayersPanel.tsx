import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { layersPanelConfig } from '../config/layersPanel.config';
import { useStores } from '../../../../stores/StoreContext';
import type { LayerGroup } from '../../../../stores/LayerVisibilityStore';
import CollapsiblePanelSection from '../../shared/components/CollapsiblePanelSection';
import PanelChrome from '../../shared/components/PanelChrome';
import StatusBullet from '../../shared/components/StatusBullet';
import layout from '../../../styles/layouts/panelLayout.module.css';
import controls from '../../../styles/mui/controls.module.css';
import styles from '../../../styles/layers/LayersPanel.module.css';

function LayerGroupCard({ group }: { group: LayerGroup }) {
    const { layerVisibilityStore } = useStores();
    const [expanded, setExpanded] = useState(false);

    const state = layerVisibilityStore.groupState(group.id);
    const allVisible = state === 'on';
    const mixed = state === 'partial';
    const expandable = group.layers.length > 1;
    const enabledCount = group.layers.filter((layer) =>
        layerVisibilityStore.isLayerEnabled(layer.id),
    ).length;

    const onParentToggle = () => {
        layerVisibilityStore.toggleGroup(group.id);
    };

    return (
        <Card variant="entityCategory">
            <div className={styles.groupRow}>
                {expandable ? (
                    <IconButton
                        className={controls.panelCollapse}
                        size="small"
                        aria-expanded={expanded}
                        aria-label={expanded ? 'Collapse layer details' : 'Expand layer details'}
                        onClick={() => setExpanded((value) => !value)}
                    >
                        <ExpandMoreIcon
                            fontSize="small"
                            className={`${styles.expandIcon} ${expanded ? styles.expandIconOpen : ''}`}
                        />
                    </IconButton>
                ) : (
                    <span className={styles.expandHitSpacer} aria-hidden="true" />
                )}

                <Button variant="entityCategory" onClick={onParentToggle} fullWidth>
                    <StatusBullet tone={state} size="md" />
                    <Typography variant="entityCategoryName" component="span">
                        {group.label}
                    </Typography>
                    {expandable && (
                        <Typography variant="mutedCaption" component="span" className={styles.count}>
                            {enabledCount}/{group.layers.length}
                        </Typography>
                    )}
                </Button>

                {/* Parent is never disabled — reflects children, acts on all of them. */}
                <Switch
                    size="small"
                    checked={allVisible}
                    // MUI Switch has no indeterminate; mixed is shown via StatusBullet.
                    onChange={onParentToggle}
                    slotProps={{
                        input: {
                            'aria-label': `Toggle ${group.label}`,
                            'aria-checked': mixed ? 'mixed' : allVisible,
                        },
                    }}
                />
            </div>

            {expandable && (
                <Collapse in={expanded} unmountOnExit>
                    <ul className={layout.entityItemList}>
                        {group.layers.map((layer) => {
                            const enabled = layerVisibilityStore.isLayerEnabled(layer.id);
                            return (
                                <li
                                    key={layer.id}
                                    className={styles.subRow}
                                    onClick={() => layerVisibilityStore.toggleLayer(layer.id)}
                                >
                                    <StatusBullet tone={enabled ? 'on' : 'off'} size="sm" />
                                    <Typography variant="entityItem" component="span" className={styles.childLabel}>
                                        {layer.label}
                                    </Typography>
                                    <Switch
                                        size="small"
                                        checked={enabled}
                                        tabIndex={-1}
                                        onClick={(event) => event.stopPropagation()}
                                        onChange={() => layerVisibilityStore.toggleLayer(layer.id)}
                                        slotProps={{ input: { 'aria-label': `Toggle ${layer.label}` } }}
                                    />
                                </li>
                            );
                        })}
                    </ul>
                </Collapse>
            )}
        </Card>
    );
}

const LayerGroupCardObserved = observer(LayerGroupCard);

function LayersVisibilitySection() {
    const { layerVisibilityStore } = useStores();
    const { groups } = layerVisibilityStore;
    const { groupsSection, emptyMessage } = layersPanelConfig;

    return (
        <CollapsiblePanelSection
            title={groupsSection.title}
            defaultExpanded={groupsSection.defaultExpanded}
        >
            {groups.length === 0 ? (
                <Typography variant="mutedCaption">{emptyMessage}</Typography>
            ) : (
                <div className={layout.entityList}>
                    {groups.map((group) => (
                        <LayerGroupCardObserved key={group.id} group={group} />
                    ))}
                </div>
            )}
        </CollapsiblePanelSection>
    );
}

const LayersVisibilitySectionObserved = observer(LayersVisibilitySection);

function LayersPanelImpl() {
    const { header } = layersPanelConfig;

    return (
        <PanelChrome title={header.title} subtitle={header.subtitle}>
            <LayersVisibilitySectionObserved />
        </PanelChrome>
    );
}

const LayersPanel = observer(LayersPanelImpl);
export default LayersPanel;