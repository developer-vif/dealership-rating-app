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
} from '@mui/material';
import { Close, Warning, Delete } from '@mui/icons-material';

interface DeleteConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  title?: string;
  description?: string;
  itemName?: string | undefined;
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
  loading = false,
  title = 'Delete Review',
  description = 'Are you sure you want to delete this review? This action cannot be undone.',
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

  return (
    <Dialog
      ref={dialogRef}
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="delete-confirmation-title"
      aria-describedby="delete-confirmation-description"
      disableRestoreFocus
      disableAutoFocus
    >
      <DialogTitle
        id="delete-confirmation-title"
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
        }}
      >
        <Typography variant="h6" component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="warning" />
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
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight="medium">
            This action is permanent and cannot be undone.
          </Typography>
        </Alert>
        
        <Typography
          id="delete-confirmation-description"
          variant="body1"
          color="text.secondary"
          sx={{ mb: 1 }}
        >
          {description}
        </Typography>
        
        {itemName && (
          <Typography variant="body2" color="text.secondary">
            Review: "{itemName}"
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
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="error"
          disabled={loading}
          startIcon={loading ? undefined : <Delete />}
          sx={{ minWidth: 100 }}
        >
          {loading ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmationDialog;