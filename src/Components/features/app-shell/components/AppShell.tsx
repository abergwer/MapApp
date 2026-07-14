import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import Tooltip from '@mui/material/Tooltip';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { appLayoutConfig } from '../config/appLayout.config';
import {
  defaultSelectedRailItem,
  leftRailItems,
  type LeftRailItemId,
} from '../config/leftRail.config';
import ConfigIcon from '../../shared/components/ConfigIcon';
import styles from '../../../styles/app-shell/AppShell.module.css';

export type { LeftRailItemId };

export interface AppShellProps {
  topBarActions: ReactNode;
  appTitle?: string;
  engineLabel?: string;
  leftPanelSlots: Partial<Record<LeftRailItemId, ReactNode>>;
  mapWorkspace: ReactNode;
  rightPanel: ReactNode;
  /** Optional floating windows rendered inside the map workspace (above the map). */
  mapFloatingWindows?: ReactNode;
  bottomBar?: ReactNode;
  mapWorkspaceRef?: React.Ref<HTMLDivElement>;
  rightPanelRef?: React.Ref<HTMLElement>;
  onLayoutChange?: () => void;
}

function px(value: number) {
  return `${value}px`;
}

const COLLAPSED_RAIL_EXPAND_WIDTH = 32;

function resolveInitialRailItem(
  slots: Partial<Record<LeftRailItemId, ReactNode>>,
): LeftRailItemId | null {
  if (slots[defaultSelectedRailItem]) return defaultSelectedRailItem;
  const first = leftRailItems.find((item) => item.enabled && slots[item.id]);
  return first?.id ?? null;
}

export default function AppShell({
  topBarActions,
  appTitle = 'Map Engine Orchestrator',
  engineLabel,
  leftPanelSlots,
  mapWorkspace,
  rightPanel,
  mapFloatingWindows,
  bottomBar,
  mapWorkspaceRef,
  rightPanelRef,
  onLayoutChange,
}: AppShellProps) {
  const cfg = appLayoutConfig;

  const [selectedRailItem, setSelectedRailItem] = useState<LeftRailItemId | null>(() =>
    resolveInitialRailItem(leftPanelSlots),
  );
  const [leftPanelOpen, setLeftPanelOpen] = useState<boolean>(() => {
    const initial = resolveInitialRailItem(leftPanelSlots);
    return cfg.leftPanel.defaultOpen && initial !== null;
  });
  const [rightPanelOpen, setRightPanelOpen] = useState<boolean>(cfg.rightPanel.defaultOpen);

  const enabledRailItems = useMemo(
    () => leftRailItems.filter((item) => item.enabled && leftPanelSlots[item.id]),
    [leftPanelSlots],
  );

  const notifyLayoutChange = useCallback(() => {
    onLayoutChange?.();
  }, [onLayoutChange]);

  useEffect(() => {
    notifyLayoutChange();
  }, [leftPanelOpen, rightPanelOpen, selectedRailItem, notifyLayoutChange]);

  const showLeftPanel =
    cfg.leftPanel.enabled && leftPanelOpen && selectedRailItem !== null;

  const shellStyle = useMemo((): CSSProperties => {
    const leftRailWidth =
      cfg.leftRail.enabled && cfg.leftPanel.enabled ? cfg.leftRail.width : 0;
    const leftPanelWidth = showLeftPanel ? cfg.leftPanel.width : 0;
    const rightPanelWidth = !cfg.rightPanel.enabled
      ? 0
      : rightPanelOpen
        ? cfg.rightPanel.width
        : COLLAPSED_RAIL_EXPAND_WIDTH;

    return {
      '--layout-top-height': cfg.topBar.enabled ? px(cfg.topBar.height) : '0px',
      '--layout-bottom-height': cfg.bottomBar.enabled ? px(cfg.bottomBar.height) : '0px',
      '--layout-left-rail-width': px(leftRailWidth),
      '--layout-left-panel-width': px(leftPanelWidth),
      '--layout-right-panel-width': px(rightPanelWidth),
      '--layout-gap': px(cfg.spacing.gap),
      '--layout-panel-radius': px(cfg.borderRadius.panel),
      '--layout-z-top': cfg.zIndex.topBar,
      '--layout-z-bottom': cfg.zIndex.bottomBar,
      '--layout-z-left-rail': cfg.zIndex.leftRail,
      '--layout-z-left-panel': cfg.zIndex.leftPanel,
      '--layout-z-right-panel': cfg.zIndex.rightPanel,
    } as CSSProperties;
  }, [cfg, showLeftPanel, rightPanelOpen]);

  const showLeftRail = cfg.leftRail.enabled && cfg.leftPanel.enabled;

  const leftPanelContent =
    selectedRailItem !== null ? leftPanelSlots[selectedRailItem] : null;

  const handleRailSelect = (id: LeftRailItemId) => {
    if (selectedRailItem === id && leftPanelOpen) {
      setLeftPanelOpen(false);
      return;
    }
    setSelectedRailItem(id);
    setLeftPanelOpen(true);
  };

  const defaultBottom = (
    <span aria-hidden="true">Timeline / actions area — reserved</span>
  );

  return (
    <div className={styles.shell} style={shellStyle}>
      {cfg.topBar.enabled && (
        <header className={styles.topBar}>
          <div className={styles.topBarBrand}>
            {cfg.branding.appIconPath && (
              <ConfigIcon
                iconPath={cfg.branding.appIconPath}
                className={styles.topBarAppIcon}
                tone="none"
              />
            )}
            <h1 className={styles.topBarTitle}>{appTitle}</h1>
          </div>
          {engineLabel && (
            <div className={styles.topBarMeta}>
              <span>Engine:</span>
              <strong>{engineLabel}</strong>
            </div>
          )}
          <div className={styles.topBarActions}>{topBarActions}</div>
        </header>
      )}

      <div className={styles.middleRow}>
        {showLeftRail && (
          <nav className={styles.leftRail} aria-label="Tools rail">
            {enabledRailItems.map((item) => {
              const isActive = selectedRailItem === item.id;
              const classNames = [styles.railItem, isActive ? styles.railItemActive : '']
                .filter(Boolean)
                .join(' ');

              return (
                <Tooltip key={item.id} title={item.tooltip} placement="right">
                  <button
                    type="button"
                    className={classNames}
                    onClick={() => handleRailSelect(item.id)}
                    aria-pressed={isActive}
                    aria-label={item.label}
                  >
                    <ConfigIcon
                      iconPath={item.iconPath}
                      className={
                        isActive
                          ? `${styles.railItemIcon} ${styles.railItemActiveIcon}`
                          : styles.railItemIcon
                      }
                      tone={isActive ? 'none' : 'muted'}
                    />
                  </button>
                </Tooltip>
              );
            })}
            <div className={styles.leftRailSpacer} />
            {!leftPanelOpen && selectedRailItem && (
              <Tooltip title="Expand panel" placement="right">
                <button
                  type="button"
                  className={styles.railExpandButton}
                  onClick={() => setLeftPanelOpen(true)}
                  aria-label="Expand panel"
                >
                  <ChevronRightIcon fontSize="small" />
                </button>
              </Tooltip>
            )}
          </nav>
        )}

        {showLeftPanel && leftPanelContent && (
          <aside className={styles.leftPanel} aria-label="Tools panel">
            <div className={styles.panelCollapseRow}>
              <Tooltip title="Collapse panel">
                <button
                  type="button"
                  className={styles.railCollapseButton}
                  onClick={() => setLeftPanelOpen(false)}
                  aria-label="Collapse panel"
                >
                  <ChevronLeftIcon fontSize="small" />
                </button>
              </Tooltip>
            </div>
            <div className={styles.leftPanelInner}>{leftPanelContent}</div>
          </aside>
        )}

        <main className={styles.mapWorkspace} ref={mapWorkspaceRef}>
          {mapWorkspace}
          {mapFloatingWindows}
        </main>

        {cfg.rightPanel.enabled && rightPanelOpen && (
          <aside
            className={styles.rightPanel}
            aria-label="Windows dock"
            ref={rightPanelRef as React.Ref<HTMLElement>}
          >
            <div className={styles.rightPanelHeader}>
              <span className={styles.rightPanelLabel}>Windows</span>
              <Tooltip title="Collapse windows dock">
                <button
                  type="button"
                  className={styles.railCollapseButton}
                  onClick={() => setRightPanelOpen(false)}
                  aria-label="Collapse windows dock"
                >
                  <ChevronRightIcon fontSize="small" />
                </button>
              </Tooltip>
            </div>
            <div className={styles.rightPanelInner}>{rightPanel}</div>
          </aside>
        )}

        {cfg.rightPanel.enabled && !rightPanelOpen && (
          <div className={styles.rightRailExpand}>
            <Tooltip title="Expand windows dock" placement="left">
              <button
                type="button"
                className={styles.railExpandButton}
                onClick={() => setRightPanelOpen(true)}
                aria-label="Expand windows dock"
              >
                <ChevronLeftIcon fontSize="small" />
              </button>
            </Tooltip>
          </div>
        )}
      </div>

      {cfg.bottomBar.enabled && (
        <footer className={styles.bottomBar}>{bottomBar ?? defaultBottom}</footer>
      )}
    </div>
  );
}