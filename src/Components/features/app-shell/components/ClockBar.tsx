import { useLiveClock, formatLocalTime, formatUtc } from '../../shared/hooks/useLiveClock';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

/**
 * Top-nav live clock (MUI Paper + theme typography).
 */
function ClockBar() {
  const now = useLiveClock();

  return (
    <Paper sx={{ px: 1.25, py: 0.75, userSelect: 'none' }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', height: '100%' }}>
        <AccessTimeIcon fontSize="small" sx={{ opacity: 0.85 }} />
        <Typography
          variant="body2"
          component="span"
          sx={{
            fontFamily: "'JetBrains Mono', ui-monospace, Consolas, monospace",
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatLocalTime(now)}
        </Typography>
        <Typography
          component="span"
          variant="caption"
          sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}
        >
          {formatUtc(now)}
        </Typography>
      </Stack>
    </Paper>
  );
}

export default ClockBar;
