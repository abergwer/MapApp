import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { observer } from 'mobx-react-lite';
import Tooltip from '@mui/material/Tooltip';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { appLayoutConfig } from '../config/appLayout.config';
import { rightDockConfig } from '../../live-view/config/rightDock.config';
import TopNavBar from './TopNavBar';
import OperationalStatusBar from './OperationalStatusBar';
import { useStores } from '../../../../stores/StoreContext';
import type { RightWorkspaceLayout } from '../../../../stores/WindowDockStore';
import styles from '../../../styles/app-shell/AppShell.module.css';

export type LeftRailItemId = 'entities' | 'mapTools' | 'layers';

export interface AppShellProps {
  topBarActions: ReactNode;
  appTitle?: string;
  appSubtitle?: string;
  engineLabel?: string;
  leftSidebar?: ReactNode;
  leftPanelSlots?: Partial<Record<LeftRailItemId, ReactNode>>;
  mapWorkspace: ReactNode;
  rightPanel: ReactNode;
  mapFloatingWindows?: ReactNode;
  bottomBar?: ReactNode;
  mapWorkspaceRef?: React.Ref<HTMLDivElement>;
  rightPanelRef?: React.Ref<HTMLElement>;
  onLayoutChange?: () => void;
}

function px(value: number) {
  return `${value}px`;
}

function resolveRightWidth(
  layout: RightWorkspaceLayout,
  manuallyCollapsed: boolean,
): string {
  const cfg = appLayoutConfig.rightPanel;
  if (!cfg.enabled) return '0px';
  if (layout === 'hidden') return '0px';
  if (manuallyCollapsed) return px(cfg.collapsedWidth);
  if (layout === 'single') return cfg.widthSingle;
  return cfg.widthDouble;
}

function AppShellImpl({
  topBarActions,
  appTitle = appLayoutConfig.branding.appTitle,
  appSubtitle = appLayoutConfig.branding.appSubtitle,
  leftSidebar,
  mapWorkspace,
  rightPanel,
  mapFloatingWindows,
  bottomBar,
  mapWorkspaceRef,
  rightPanelRef,
  onLayoutChange,
}: AppShellProps) {
  const cfg = appLayoutConfig;
  const { windowDockStore } = useStores();
  const rightLayout = windowDockStore.rightWorkspaceLayout;

  const [leftSidebarOpen, setLeftSidebarOpen] = useState<boolean>(cfg.leftSidebar.defaultOpen);
  const [rightManuallyCollapsed, setRightManuallyCollapsed] = useState(false);

  // Re-open automatically when windows appear after a fully hidden state.
  useEffect(() => {
    if (rightLayout !== 'hidden') return;
    setRightManuallyCollapsed(false);
  }, [rightLayout]);

  const notifyLayoutChange = useCallback(() => {
    onLayoutChange?.();
  }, [onLayoutChange]);

  const showLeftSidebar = cfg.leftSidebar.enabled && leftSidebarOpen && leftSidebar != null;
  const showRightContent = cfg.rightPanel.enabled && rightLayout !== 'hidden';
  const rightExpanded = showRightContent && !rightManuallyCollapsed;

  useEffect(() => {
    notifyLayoutChange();
  }, [leftSidebarOpen, rightExpanded, rightLayout, notifyLayoutChange]);

  const shellStyle = useMemo((): CSSProperties => {
    const leftWidth = showLeftSidebar
      ? px(cfg.leftSidebar.width)
      : cfg.leftSidebar.enabled
        ? px(cfg.rightPanel.collapsedWidth)
        : '0px';

    return {
      '--layout-top-bar-height': cfg.topBar.enabled ? px(cfg.topBar.height) : '0px',
      '--layout-bottom-bar-height': cfg.bottomBar.enabled ? px(cfg.bottomBar.height) : '0px',
      '--layout-left-sidebar-width': leftWidth,
      '--layout-left-rail-width': '0px',
      '--layout-left-panel-width': '0px',
      '--layout-right-workspace-width': resolveRightWidth(rightLayout, rightManuallyCollapsed),
      '--layout-gap': px(cfg.spacing.gap),
      '--layout-panel-radius': px(cfg.borderRadius.panel),
      '--layout-z-top': cfg.zIndex.topBar,
      '--layout-z-bottom': cfg.zIndex.bottomBar,
      '--layout-z-left-rail': cfg.zIndex.leftRail,
      '--layout-z-left-panel': cfg.zIndex.leftPanel,
      '--layout-z-right-panel': cfg.zIndex.rightPanel,
      '--layout-z-map-toolbar': cfg.zIndex.mapToolbar,
      '--layout-z-map-nav': cfg.zIndex.mapNav,
      '--layout-map-toolbar-top': px(cfg.mapOverlay.toolbar.top),
      '--layout-map-toolbar-left': px(cfg.mapOverlay.toolbar.left),
      '--layout-map-nav-top': px(cfg.mapOverlay.nav.top),
      '--layout-map-nav-right': px(cfg.mapOverlay.nav.right),
    } as CSSProperties;
  }, [cfg, showLeftSidebar, rightLayout, rightManuallyCollapsed]);

  return (
    <div
      className={styles.shell}
      style={shellStyle}
      data-right-layout={rightLayout}
    >
      {cfg.topBar.enabled && (
        <div className={styles.topBarSlot}>
          <TopNavBar appTitle={appTitle} appSubtitle={appSubtitle} clock={topBarActions} />
        </div>
      )}

      <div className={styles.middleRow}>
        {cfg.leftSidebar.enabled && (
          <div className={styles.leftWorkspace}>
            {showLeftSidebar ? (
              <aside className={styles.leftSidebar} aria-label="Layers sidebar">
                <div className={styles.panelCollapseRow}>
                  <Tooltip title={cfg.labels.collapseSidebar}>
                    <button
                      type="button"
                      className={styles.railCollapseButton}
                      onClick={() => setLeftSidebarOpen(false)}
                      aria-label={cfg.labels.collapseSidebar}
                    >
                      <ChevronLeftIcon fontSize="small" />
                    </button>
                  </Tooltip>
                </div>
                <div className={styles.leftSidebarInner}>{leftSidebar}</div>
              </aside>
            ) : (
              <div className={styles.leftRailExpand}>
                <Tooltip title={cfg.labels.expandSidebar} placement="right">
                  <button
                    type="button"
                    className={styles.railExpandButton}
                    onClick={() => setLeftSidebarOpen(true)}
                    aria-label={cfg.labels.expandSidebar}
                  >
                    <ChevronRightIcon fontSize="small" />
                  </button>
                </Tooltip>
              </div>
            )}
          </div>
        )}

        <main className={styles.mapWorkspace} ref={mapWorkspaceRef}>
          {mapWorkspace}
          {mapFloatingWindows}
        </main>

        {showRightContent && (
          <div
            className={styles.rightWorkspace}
            ref={rightPanelRef as React.Ref<HTMLDivElement>}
            data-right-layout={rightLayout}
          >
            {rightExpanded ? (
              <aside className={styles.rightPanel} aria-label="Operations workspace">
                <div className={styles.rightPanelHeader}>
                  <span className={styles.rightPanelLabel}>{rightDockConfig.header.title}</span>
                  <Tooltip title={cfg.labels.collapseWorkspace}>
                    <button
                      type="button"
                      className={styles.railCollapseButton}
                      onClick={() => setRightManuallyCollapsed(true)}
                      aria-label={cfg.labels.collapseWorkspace}
                    >
                      <ChevronRightIcon fontSize="small" />
                    </button>
                  </Tooltip>
                </div>
                <div className={styles.rightPanelInner}>{rightPanel}</div>
              </aside>
            ) : (
              <div className={styles.rightRailExpand}>
                <Tooltip title={cfg.labels.expandWorkspace} placement="left">
                  <button
                    type="button"
                    className={styles.railExpandButton}
                    onClick={() => setRightManuallyCollapsed(false)}
                    aria-label={cfg.labels.expandWorkspace}
                  >
                    <ChevronLeftIcon fontSize="small" />
                  </button>
                </Tooltip>
              </div>
            )}
          </div>
        )}
      </div>

      {cfg.bottomBar.enabled && (
        <div className={styles.bottomBarSlot}>
          {bottomBar ?? <OperationalStatusBar />}
        </div>
      )}
    </div>
  );
}

const AppShell = observer(AppShellImpl);
export default AppShell;
