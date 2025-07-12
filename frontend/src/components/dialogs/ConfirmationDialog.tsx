import React, { useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  IconButton,
  Alert,
  AlertTitle,
} from '@mui/material';
import { Close, Warning, CheckCircle, Delete, Edit } from '@mui/icons-material';

interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  severity?: 'warning' | 'info' | 'success';
  icon?: 'warning' | 'info' | 'success' | 'delete' | 'edit';
  itemName?: string;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
  loading = false,
  title = 'Confirm Action',
  description = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  severity = 'warning',
  icon = 'warning',
  itemName,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Store the element that had focus before the dialog opened
  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }
  }, [open]);

  // Restore focus when dialog closes
  useEffect(() => {
    if (!open && previousFocusRef.current) {
      // Use setTimeout to ensure the dialog is fully closed before restoring focus
      setTimeout(() => {
        if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
          previousFocusRef.current.focus();
        }
      }, 100);
    }
  }, [open]);

  const handleConfirm = () => {
    if (!loading) {
      onConfirm();
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const getIcon = () => {
    switch (icon) {
      case 'info':
        return <CheckCircle color="info" />;
      case 'success':
        return <CheckCircle color="success" />;
      case 'delete':
        return <Delete color="error" />;
      case 'edit':
        return <Edit color="primary" />;
      case 'warning':
      default:
        return <Warning color="warning" />;
    }
  };

  return (
    <Dialog
      ref={dialogRef}
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="confirmation-dialog-title"
      aria-describedby="confirmation-dialog-description"
      disableRestoreFocus
      disableAutoFocus
    >
      <DialogTitle
        id="confirmation-dialog-title"
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
        }}
      >
        <Typography variant="h6" component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getIcon()}
          {title}
        </Typography>
        {!loading && (
          <IconButton
            onClick={handleClose}
            size="small"
            aria-label="close dialog"
            sx={{ color: 'text.secondary' }}
          >
            <Close />
          </IconButton>
        )}
      </DialogTitle>
      
      <DialogContent sx={{ pb: 2 }}>
        <Alert severity={severity} sx={{ mb: 2 }}>
          <AlertTitle>{title}</AlertTitle>
          {description}
        </Alert>
        
        <Typography
          id="confirmation-dialog-description"
          variant="body1"
          color="text.secondary"
          sx={{ mb: 1 }}
        >
          {description}
        </Typography>
        
        {itemName && (
          <Typography variant="body2" color="text.secondary">
            Item: "{itemName}"
          </Typography>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          color="primary"
          disabled={loading}
          sx={{ minWidth: 100 }}
        >
          {cancelText}
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color={severity === 'warning' ? 'error' : 'primary'}
          disabled={loading}
          startIcon={loading ? undefined : (icon === 'delete' ? <Delete /> : icon === 'edit' ? <Edit /> : undefined)}
          sx={{ minWidth: 100 }}
        >
          {loading ? 'Processing...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationDialog; 