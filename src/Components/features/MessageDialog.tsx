import { observer } from 'mobx-react-lite';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import DialogContentText from '@mui/material/DialogContentText';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
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

/**
 * Global, centered message/error popup. Mount once near the app root.
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
      maxWidth="xs"
      fullWidth
      aria-labelledby="message-dialog-title"
    >
      <DialogTitle
        id="message-dialog-title"
        sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 6 }}
      >
        <Icon color={color} />
        <Box component="span" sx={{ flex: 1 }}>
          {title ?? severity.charAt(0).toUpperCase() + severity.slice(1)}
        </Box>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ whiteSpace: 'pre-line' }}>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} variant="contained" color={color} autoFocus>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default observer(MessageDialog);
