import type { ReactNode } from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import layout from '../../../styles/layouts/panelLayout.module.css';

export interface PanelChromeProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

/** Panel header + stack shell — styling from MUI theme variants only. */
export default function PanelChrome({ title, subtitle, children }: PanelChromeProps) {
  return (
    <Stack className={layout.panelRoot}>
      <Stack spacing={0.5}>
        <Typography variant="panelTitle" component="h2">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="panelSubtitle" component="p">
            {subtitle}
          </Typography>
        )}
      </Stack>
      {children}
    </Stack>
  );
}
