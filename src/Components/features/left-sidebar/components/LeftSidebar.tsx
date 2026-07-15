import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
  leftSidebarConfig,
  type LeftSidebarTabId,
} from '../config/leftSidebar.config';
import LayersTreePanel from '../../layers/components/LayersTreePanel';
import EntitiesPanel from '../../entities/components/EntitiesPanel';
import styles from '../../../styles/left-sidebar/LeftSidebar.module.css';

/**
 * Left ops sidebar shell: tabs compose feature panels (Entities / Layers).
 * Defaults and labels live in leftSidebar.config — MUI lives inside feature panels.
 */
function LeftSidebarImpl() {
  const [tab, setTab] = useState<LeftSidebarTabId>(leftSidebarConfig.defaultTab);
  const { ariaLabel, tabs, titles } = leftSidebarConfig;

  return (
    <aside className={styles.sidebar} aria-label={ariaLabel}>
      <div className={styles.header}>
        <h2 className={styles.title}>{titles[tab]}</h2>
        <div className={styles.tabs} role="tablist" aria-label="Sidebar views">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              className={[styles.tab, tab === item.id ? styles.tabActive : '']
                .filter(Boolean)
                .join(' ')}
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.body}>
        {tab === 'layers' ? (
          <LayersTreePanel />
        ) : (
          <div className={styles.entitiesHost}>
            <EntitiesPanel embedded />
          </div>
        )}
      </div>
    </aside>
  );
}

const LeftSidebar = observer(LeftSidebarImpl);
export default LeftSidebar;
