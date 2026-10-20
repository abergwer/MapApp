import { observer } from 'mobx-react-lite';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Slide from '@mui/material/Slide';
import { alpha } from '@mui/material/styles';
import type { TransitionProps } from '@mui/material/transitions';
import { forwardRef } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { messageDialogStore, type MessageSeverity } from '../../stores/MessageDialogStore';

const severityConfig: Record<
  MessageSeverity,
  { color: 'error' | 'info' | 'success' | 'warning'; Icon: typeof InfoOutlinedIcon }
> = {
  info: { color: 'info', Icon: InfoOutlinedIcon },
  error: { color: 'error', Icon: ErrorOutlineIcon },
  success: { color: 'success', Icon: CheckCircleOutlineIcon },
  warning: { color: 'warning', Icon: WarningAmberIcon },
};

const SlideUp = forwardRef(function SlideUp(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

/**
 * Global message/error popup anchored to the bottom-right of the screen. Mount once near the app root.
 * Drive it from anywhere via `showMessage(...)`.
 */
function MessageDialog() {
  const { open, title, message, severity } = messageDialogStore;
  const { color, Icon } = severityConfig[severity];

  const handleClose = () => messageDialogStore.close();

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      hideBackdrop
      disableEnforceFocus
      disableScrollLock
      slots={{ transition: SlideUp }}
      aria-labelledby="message-dialog-title"
      sx={{
        pointerEvents: 'none',
        '& .MuiDialog-container': {
          alignItems: 'flex-end',
          justifyContent: 'flex-end',
        },
        '& .MuiDialog-paper': {
          pointerEvents: 'auto',
          m: 3,
          width: 400,
          maxWidth: 'calc(100vw - 48px)',
          borderRadius: 2,
          border: 1,
          borderColor: 'divider',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.18), 0 2px 8px rgba(0, 0, 0, 0.08)',
          backgroundImage: 'none',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.75, p: 2.25, pr: 1.5 }}>
        <Box
          sx={(theme) => ({
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 38,
            height: 38,
            flexShrink: 0,
            borderRadius: 1.5,
            bgcolor: alpha(theme.palette[color].main, 0.12),
            color: `${color}.main`,
          })}
        >
          <Icon fontSize="small" />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0, pt: 0.25 }}>
          <Typography
            id="message-dialog-title"
            variant="subtitle2"
            sx={{ fontWeight: 600, lineHeight: 1.4, color: 'text.primary' }}
          >
            {title ?? severity.charAt(0).toUpperCase() + severity.slice(1)}
          </Typography>
          <Typography
            variant="body2"
            sx={{ mt: 0.5, color: 'text.secondary', whiteSpace: 'pre-line', lineHeight: 1.5 }}
          >
            {message}
          </Typography>
        </Box>
        <IconButton
          aria-label="close"
          size="small"
          onClick={handleClose}
          sx={{ mt: -0.25, color: 'text.disabled', '&:hover': { color: 'text.primary' } }}
        >
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>
    </Dialog>
  );
}

export default observer(MessageDialog);
