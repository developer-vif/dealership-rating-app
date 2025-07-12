import React, { useState, useRef, useEffect, forwardRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Alert,
  Box,
  Fade,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { Dealership, DealershipReview } from '../../types/dealership';
import ReviewForm from '../dealership/ReviewForm';
import { TransitionProps } from '@mui/material/transitions';

// Custom Fade transition with longer duration
const FadeTransition = forwardRef<HTMLElement, TransitionProps>(function FadeTransition(props, ref) {
  const { in: inProp = false, children } = props;
  if (!children || !React.isValidElement(children)) return null;
  return (
    <Fade ref={ref} in={inProp} timeout={{ enter: 400, exit: 400 }} appear={true}>
      {children as React.ReactElement}
    </Fade>
  );
});

interface EditReviewDialogProps {
  open: boolean;
  onClose: () => void;
  review: DealershipReview | null;
  dealership: Dealership | null;
  dealershipName: string;
  onSuccess: () => void;
}

const EditReviewDialog: React.FC<EditReviewDialogProps> = ({
  open,
  onClose,
  review,
  dealership,
  dealershipName,
  onSuccess,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

  const handleSubmitSuccess = () => {
    setSuccess(true);
    setError(null);
    setSubmitting(false);
    // Show success message, then close dialog and call onSuccess
    setTimeout(() => {
      setSuccess(false);
      onClose();
      onSuccess();
    }, 1500);
  };

  const handleSubmitError = (errorMessage: string) => {
    setError(errorMessage);
    setSubmitting(false);
  };

  const handleFormChange = (_hasChanges: boolean) => {
    // This callback is used by ReviewForm to track changes
    // The button state is handled within ReviewForm itself
  };

  const handleClose = () => {
    if (!submitting) {
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  return (
    <Dialog
      ref={dialogRef}
      open={open}
      onClose={submitting ? () => {} : handleClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="edit-review-title"
      disableRestoreFocus
      disableAutoFocus
      TransitionComponent={FadeTransition}
    >
      <DialogTitle
        id="edit-review-title"
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
        }}
      >
        <Typography variant="h6" component="span">
          Edit Review for {dealershipName}
        </Typography>
        {!submitting && (
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
      
      <DialogContent sx={{ pb: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Review updated successfully!
          </Alert>
        )}

        {review && dealership && (
          <Box sx={{ mt: 1 }}>
            <ReviewForm
              dealershipId={dealership.googlePlaceId}
              dealershipName={dealershipName}
              editMode={true}
              initialData={{
                rating: review.rating,
                title: review.title,
                content: review.content,
                receiptProcessingTime: review.receiptProcessingTime,
                platesProcessingTime: review.platesProcessingTime,
                visitDate: review.visitDate,
              }}
              reviewId={review.id}
              onSubmitting={setSubmitting}
              onSuccess={handleSubmitSuccess}
              onError={handleSubmitError}
              onFormChange={handleFormChange}
            />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditReviewDialog;