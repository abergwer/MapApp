import { useState, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import * as styles from '../../styles/common-ui/panel.styles';

interface SectionCardProps {
  title: string;
  children: ReactNode;
  /** Start collapsed. Defaults to open. */
  defaultCollapsed?: boolean;
}

/**
 * Collapsible content block used inside the left-nav views: uppercase
 * header, centered chevron, body (matches the reference design cards).
 */
export default function SectionCard({ title, children, defaultCollapsed = false }: SectionCardProps) {
  const [open, setOpen] = useState(!defaultCollapsed);

  return (
    <Paper sx={styles.sectionCard}>
      <Typography component="h3" sx={styles.sectionHeader}>
        {title}
      </Typography>
      <Box sx={styles.sectionChevron}>
        <IconButton
          size="small"
          onClick={() => setOpen((v) => !v)}
          aria-label={`${open ? 'Collapse' : 'Expand'} ${title} section`}
        >
          {open ? <ExpandMoreIcon fontSize="small" /> : <ExpandLessIcon fontSize="small" />}
        </IconButton>
      </Box>
      <Collapse in={open}>
        <Box sx={styles.sectionBody}>{children}</Box>
      </Collapse>
    </Paper>
  );
}
