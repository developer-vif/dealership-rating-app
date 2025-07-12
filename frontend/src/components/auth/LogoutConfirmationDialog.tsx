import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  IconButton,
} from '@mui/material';
import { Close, ExitToApp } from '@mui/icons-material';

interface LogoutConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const LogoutConfirmationDialog: React.FC<LogoutConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
}) => {
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="logout-confirmation-title"
      aria-describedby="logout-confirmation-description"
    >
      <DialogTitle
        id="logout-confirmation-title"
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
        }}
      >
        Confirm Logout
        <IconButton
          onClick={onClose}
          size="small"
          aria-label="close dialog"
          sx={{ color: 'text.secondary' }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ pb: 2 }}>
        <Typography
          id="logout-confirmation-description"
          variant="body1"
          color="text.secondary"
          sx={{ mb: 1 }}
        >
          Are you sure you want to log out?
        </Typography>
        <Typography variant="body2" color="text.secondary">
          You will need to sign in again to access your account and submit reviews.
        </Typography>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          color="primary"
          autoFocus
          sx={{ minWidth: 100 }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="error"
          startIcon={<ExitToApp />}
          sx={{ minWidth: 100 }}
        >
          Logout
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LogoutConfirmationDialog;