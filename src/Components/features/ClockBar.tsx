import { useEffect, useState } from 'react';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const pad = (n: number) => String(n).padStart(2, '0');

const formatTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

const formatUtc = (d: Date) => `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;

/**
 * Live clock overlay. Shows local time (ticking every second) plus the
 * current UTC time — handy when correlating map events across time zones.
 */
function ClockBar() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
          {formatTime(now)}
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
