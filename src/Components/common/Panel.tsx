import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import type { SxProps, Theme } from '@mui/material/styles';
import { panelRoot, panelHeader, panelTitle, panelBody } from '../../styles/common-ui/panel.styles';

interface PanelProps {
  title: string;
  /** Optional element rendered on the right side of the header. */
  action?: ReactNode;
  children: ReactNode;
  sx?: SxProps<Theme>;
}

/** Bordered side-rail panel with an uppercase header, shared by all rails. */
export default function Panel({ title, action, children, sx }: PanelProps) {
  return (
    <Paper sx={[panelRoot, ...(Array.isArray(sx) ? sx : [sx])] as SxProps<Theme>}>
      <Box sx={panelHeader}>
        <Typography component="h2" sx={panelTitle}>
          {title}
        </Typography>
        {action}
      </Box>
      <Box sx={panelBody}>{children}</Box>
    </Paper>
  );
}
