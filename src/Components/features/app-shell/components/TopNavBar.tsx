import type { ReactNode } from 'react';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import EmailOutlinedIcon from '@mui/icons-material/Email';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import ConfigIcon from '../../shared/components/ConfigIcon';
import StatusBullet from '../../shared/components/StatusBullet';
import { appLayoutConfig } from '../config/appLayout.config';
import styles from '../../../styles/app-shell/TopNavBar.module.css';

export interface TopNavBarProps {
  appTitle?: string;
  appSubtitle?: string;
  clock?: ReactNode;
  /** Optional real alert count. When omitted or zero, no badge is shown. */
  alertCount?: number;
}

export default function TopNavBar({
  appTitle = appLayoutConfig.branding.appTitle,
  appSubtitle = appLayoutConfig.branding.appSubtitle,
  clock,
  alertCount,
}: TopNavBarProps) {
  const iconPath = appLayoutConfig.branding.appIconPath;
  const showAlertBadge = typeof alertCount === 'number' && alertCount > 0;

  return (
    <header className={styles.root}>
      <div className={styles.brand}>
        {iconPath && (
          <ConfigIcon iconPath={iconPath} className={styles.brandIcon} tone="none" />
        )}
        <div className={styles.brandText}>
          <h1 className={styles.title}>{appTitle}</h1>
          <p className={styles.subtitle}>{appSubtitle}</p>
        </div>
      </div>

      <div className={styles.actions}>
        <div className={styles.systemStatus} title="System status">
          <StatusBullet tone="live" size="sm" />
          <span className={styles.systemStatusLabel}>System Operational</span>
        </div>

        <div className={styles.actionDivider} aria-hidden="true" />

        <Tooltip title="Messages">
          <IconButton
            type="button"
            size="small"
            className={styles.iconAction}
            aria-label="Messages"
          >
            <EmailOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Alerts">
          <IconButton
            type="button"
            size="small"
            className={styles.iconAction}
            aria-label="Alerts"
          >
            <NotificationsNoneOutlinedIcon fontSize="small" />
            {showAlertBadge && (
              <span className={styles.badge}>{alertCount}</span>
            )}
          </IconButton>
        </Tooltip>

        <div className={styles.operator}>
          <PersonOutlinedIcon fontSize="small" className={styles.operatorIcon} />
          <span className={styles.operatorLabel}>Operator</span>
        </div>

        {clock != null && <div className={styles.clockSlot}>{clock}</div>}
      </div>
    </header>
  );
}
