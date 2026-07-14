import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Collapse from '@mui/material/Collapse';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { entitiesPanelConfig } from '../config/entitiesPanel.config';
import type { DrawTool, MapShape } from '../../../../stores/DrawingToolStore';
import { useStores } from '../../../../stores/StoreContext';
import CollapsiblePanelSection from '../../shared/components/CollapsiblePanelSection';
import PanelChrome from '../../shared/components/PanelChrome';
import { ToolsGrid } from '../../shared/components/PanelGrids';
import ToolTileButton from '../../shared/components/ToolTileButton';
import ConfigIcon from '../../shared/components/ConfigIcon';
import {
  cancelDrawSession,
  isDrawToolSupported,
  selectDrawTool,
} from '../actions/drawToolActions';
import layout from '../../../styles/layouts/panelLayout.module.css';

function getCategoryLabel(kind: DrawTool, index: number): string {
  return `${kind} #${index + 1}`;
}

function groupShapesByKind(shapes: MapShape[]): Map<DrawTool, MapShape[]> {
  const map = new Map<DrawTool, MapShape[]>();
  for (const shape of shapes) {
    const list = map.get(shape.kind) ?? [];
    list.push(shape);
    map.set(shape.kind, list);
  }
  return map;
}

function ExistingEntitiesSection() {
  const { drawingToolStore } = useStores();
  const { categories, existingSection } = entitiesPanelConfig;
  const [expandedKinds, setExpandedKinds] = useState<Set<DrawTool>>(new Set());

  const shapes = drawingToolStore.completedShapes;
  const grouped = groupShapesByKind(shapes);
  const totalCount = shapes.length;

  const toggleKind = (kind: DrawTool) => {
    setExpandedKinds((prev) => {
      const next = new Set(prev);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });
  };

  return (
    <CollapsiblePanelSection
      title={existingSection.title}
      defaultExpanded={existingSection.defaultExpanded}
    >
      {totalCount === 0 ? (
        <Typography variant="mutedCaption">{existingSection.emptyMessage}</Typography>
      ) : (
        <Stack className={layout.entityList}>
          {categories.map((category) => {
            const items = grouped.get(category.kind) ?? [];
            if (items.length === 0) return null;

            const isOpen = expandedKinds.has(category.kind);

            return (
              <Card key={category.kind} variant="entityCategory">
                <Button
                  variant="entityCategory"
                  onClick={() => toggleKind(category.kind)}
                  aria-expanded={isOpen}
                  fullWidth
                >
                  <ConfigIcon iconPath={category.iconPath} tone="light" />
                  <Typography variant="entityCategoryName" component="span">
                    {category.label}
                  </Typography>
                  <Typography variant="mutedCaption" component="span">
                    {items.length}
                  </Typography>
                  <ChevronRightIcon
                    fontSize="inherit"
                    className={isOpen ? layout.collapseIconExpanded : undefined}
                  />
                </Button>
                <Collapse in={isOpen}>
                  <ul className={layout.entityItemList}>
                    {items.map((shape, index) => {
                      const selected = drawingToolStore.selectedId === shape.id;
                      return (
                        <Typography
                          key={shape.id}
                          variant="entityItem"
                          component="li"
                          className={
                            selected
                              ? `${layout.entityItemButton} ${layout.entityItemButtonSelected}`
                              : layout.entityItemButton
                          }
                          onClick={() => drawingToolStore.setSelectedId(shape.id)}
                        >
                          {getCategoryLabel(category.kind, index)}
                        </Typography>
                      );
                    })}
                  </ul>
                </Collapse>
              </Card>
            );
          })}
        </Stack>
      )}
    </CollapsiblePanelSection>
  );
}

const ExistingEntitiesSectionObserved = observer(ExistingEntitiesSection);

function CreateEntitySection() {
  const { mapEngineStore, drawingToolStore, entityService } = useStores();
  const engine = mapEngineStore.engine;
  const { createSection, createTools, cancelAction } = entitiesPanelConfig;
  const activeTool = drawingToolStore.activeDrawTool;

  const cancelDisabled = !activeTool && !drawingToolStore.selectedId;

  return (
    <CollapsiblePanelSection
      title={createSection.title}
      defaultExpanded={createSection.defaultExpanded}
    >
      <ToolsGrid columns={entitiesPanelConfig.layout.createToolsGridColumns}>
        {createTools.map((tool) => (
          <ToolTileButton
            key={tool.id}
            label={tool.label}
            iconPath={tool.iconPath}
            active={activeTool === tool.id}
            disabled={!tool.enabled || !isDrawToolSupported(engine, tool.id) || !engine}
            onClick={() => selectDrawTool(engine, drawingToolStore, entityService, tool.id)}
          />
        ))}
      </ToolsGrid>
      <ToolTileButton
        label={cancelAction.label}
        iconPath={cancelAction.iconPath}
        danger
        disabled={cancelDisabled || !engine}
        onClick={() => cancelDrawSession(engine, drawingToolStore)}
      />
    </CollapsiblePanelSection>
  );
}

const CreateEntitySectionObserved = observer(CreateEntitySection);

function EntitiesPanelImpl() {
  const { header } = entitiesPanelConfig;

  return (
    <PanelChrome title={header.title} subtitle={header.subtitle}>
      <ExistingEntitiesSectionObserved />
      <CreateEntitySectionObserved />
    </PanelChrome>
  );
}

const EntitiesPanel = observer(EntitiesPanelImpl);
export default EntitiesPanel;
