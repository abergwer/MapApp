import { observer } from 'mobx-react-lite';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { mapToolsPanelConfig } from '../config/mapToolsPanel.config';
import type { MeasureTool } from '../../../../stores/DrawingToolStore';
import type { BaseMap } from '../../../../stores/MapStyleStore';
import { useMapContext } from '../../../../map/MapContext';
import { useStores } from '../../../../stores/StoreContext';
import CollapsiblePanelSection from '../../shared/components/CollapsiblePanelSection';
import MapTypeTileButton from '../../shared/components/MapTypeTileButton';
import PanelChrome from '../../shared/components/PanelChrome';
import { MapTypeGrid, ToolsGrid } from '../../shared/components/PanelGrids';
import ToolTileButton from '../../shared/components/ToolTileButton';
import { setBaseMapStyle, supportsBaseMapSwitch } from '../actions/mapStyleActions';
import {
    clearMeasurements,
    isMeasureSupported,
    selectMeasureTool,
} from '../actions/measureToolActions';
import { useBasemapBrightness } from '../hooks/useBasemapBrightness';
import layout from '../../../styles/layouts/panelLayout.module.css';

function MeasurementsSection() {
    const { mapEngineStore, drawingToolStore } = useStores();
    const engine = mapEngineStore.engine;
    const activeTool = drawingToolStore.activeMeasureTool;
    const { measurementTools, measurementsSection, clearAction } = mapToolsPanelConfig;

    if (!isMeasureSupported(engine)) {
        return (
            <CollapsiblePanelSection
                title={measurementsSection.title}
                defaultExpanded={measurementsSection.defaultExpanded}
            >
                <Typography variant="mutedCaption">Not supported by this map engine.</Typography>
            </CollapsiblePanelSection>
        );
    }

    return (
        <CollapsiblePanelSection
            title={measurementsSection.title}
            defaultExpanded={measurementsSection.defaultExpanded}
        >
            <ToolsGrid columns={mapToolsPanelConfig.layout.measurementGridColumns}>
                {measurementTools.map((tool) => {
                    const measureId = tool.id as MeasureTool;
                    return (
                        <ToolTileButton
                            key={tool.id}
                            label={tool.label}
                            iconPath={tool.iconPath}
                            active={activeTool === measureId}
                            disabled={!tool.enabled || !engine}
                            onClick={() => selectMeasureTool(engine, drawingToolStore, measureId)}
                        />
                    );
                })}
            </ToolsGrid>
            <ToolTileButton
                label={clearAction.label}
                iconPath={clearAction.iconPath}
                danger
                disabled={!engine}
                onClick={() => clearMeasurements(engine, drawingToolStore)}
            />
        </CollapsiblePanelSection>
    );
}

const MeasurementsSectionObserved = observer(MeasurementsSection);

function MapTypeSection() {
    const { mapEngineStore, mapStyleStore } = useStores();
    const engine = mapEngineStore.engine;
    const { mapTypes, mapTypeSection } = mapToolsPanelConfig;
    const activeBaseMap = mapStyleStore.baseMap;
    const canSwitch = supportsBaseMapSwitch(engine);

    return (
        <CollapsiblePanelSection
            title={mapTypeSection.title}
            defaultExpanded={mapTypeSection.defaultExpanded}
        >
            {!canSwitch && (
                <Typography variant="mutedCaption">Map type switch not supported by this engine.</Typography>
            )}
            <MapTypeGrid columns={mapToolsPanelConfig.layout.mapTypeGridColumns}>
                {mapTypes.map((mapType) => (
                    <MapTypeTileButton
                        key={mapType.id}
                        label={mapType.label}
                        description={mapType.description}
                        iconPath={mapType.iconPath}
                        active={activeBaseMap === mapType.id}
                        disabled={!mapType.enabled || !canSwitch || !engine}
                        onClick={() => setBaseMapStyle(engine, mapStyleStore, mapType.id as BaseMap)}
                    />
                ))}
            </MapTypeGrid>
        </CollapsiblePanelSection>
    );
}

const MapTypeSectionObserved = observer(MapTypeSection);

function ViewControlsSection() {
    const { containerRef } = useMapContext();
    const { mapStyleStore, windowDockStore } = useStores();
    const { viewControlsSection, liveToggles } = mapToolsPanelConfig;
    const { brightness } = mapStyleStore;
    const brightnessCfg = viewControlsSection.brightness;

    useBasemapBrightness(containerRef, brightness, mapStyleStore.baseMap);

    return (
        <CollapsiblePanelSection
            title={viewControlsSection.title}
            defaultExpanded={viewControlsSection.defaultExpanded}
        >
            <Stack className={layout.brightnessRow}>
                <Stack className={layout.brightnessHeader} direction="row">
                    <Typography variant="toolTileLabel" component="span">
                        {brightnessCfg.label}
                    </Typography>
                    <Typography variant="toolTileLabel" component="span">
                        {brightness}%
                    </Typography>
                </Stack>
                <Slider
                    min={brightnessCfg.min}
                    max={brightnessCfg.max}
                    step={brightnessCfg.step}
                    value={brightness}
                    onChange={(_, value) => mapStyleStore.setBrightness(value as number)}
                    aria-label={brightnessCfg.label}
                />
            </Stack>
            <ToolsGrid columns={mapToolsPanelConfig.layout.liveToggleGridColumns}>
                {liveToggles.map((toggle) => {
                    const id = toggle.id === 'minimap' ? 'minimap' : 'video';
                    const active = windowDockStore.isOpen(id);
                    return (
                        <ToolTileButton
                            key={toggle.id}
                            label={toggle.label}
                            iconPath={toggle.iconPath}
                            active={active}
                            disabled={!toggle.enabled}
                            onClick={() => {
                                if (active) {
                                    windowDockStore.setOpen(id, false);
                                } else {
                                    windowDockStore.dock(id);
                                }
                            }}
                        />
                    );
                })}
            </ToolsGrid>
        </CollapsiblePanelSection>
    );
}

const ViewControlsSectionObserved = observer(ViewControlsSection);

function MapToolsPanelImpl() {
    const { header } = mapToolsPanelConfig;

    return (
        <PanelChrome title={header.title} subtitle={header.subtitle}>
            <MeasurementsSectionObserved />
            <MapTypeSectionObserved />
            <ViewControlsSectionObserved />
        </PanelChrome>
    );
}

const MapToolsPanel = observer(MapToolsPanelImpl);
export default MapToolsPanel;