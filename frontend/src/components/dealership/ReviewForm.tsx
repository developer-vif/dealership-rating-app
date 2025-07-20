import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControlLabel,
  TextField,
  Button,
  Paper,
  Rating,
  Checkbox,
  FormHelperText,
  Divider,
  Alert,
  AlertTitle,
  Avatar,
  Link,
} from '@mui/material';
import { Login as LoginIcon, Delete } from '@mui/icons-material';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { Dealership } from '../../types/dealership';
import { useAuth } from '../../contexts/AuthContext';
import GoogleSignInButton from '../auth/GoogleSignInButton';
import reviewService from '../../services/reviewService';
import ConfirmationDialog from '../dialogs/ConfirmationDialog';
import TermsOfServiceDialog from '../dialogs/TermsOfServiceDialog';
import { 
  generateAnonymousUsername, 
  generateAnonymousInitials, 
  generateAnonymousAvatarColor 
} from '../../utils/anonymization';
import DualTimeSliderRating from '../rating/DualTimeSliderRating';

interface ReviewFormProps {
  dealership?: Dealership;
  dealershipId?: string;
  dealershipName?: string;
  onSubmit?: () => void;
  editMode?: boolean;
  initialData?: {
    rating: number;
    title: string;
    content: string;
    receiptProcessingTime: string;
    platesProcessingTime: string;
    visitDate: string;
  };
  reviewId?: string;
  onSubmitting?: (submitting: boolean) => void;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onFormChange?: (hasChanges: boolean) => void;
}

interface FormData {
  receiptTime: number;
  platesTime: number;
  reviewText: string;
  acceptTerms: boolean;
  recaptchaToken: string | null;
}

interface FormErrors {
  receiptTime?: string;
  platesTime?: string;
  reviewText?: string;
  acceptTerms?: string;
  recaptcha?: string;
}



const convertScoreToApiValue = (score: number): string => {
  const apiValues = {
    0: 'longer',
    1: '2-months', 
    2: '1-month',
    3: '2-weeks',
    4: '1-week'
  };
  return apiValues[score as keyof typeof apiValues] || 'longer';
};

const convertApiValueToScore = (apiValue: string): number => {
  const scoreValues = {
    'longer': 0,
    '2-months': 1,
    '1-month': 2,
    '2-weeks': 3,
    '1-week': 4,
    'same-day': 4 // Map same-day to highest score
  };
  return scoreValues[apiValue as keyof typeof scoreValues] || 0;
};


const ReviewForm: React.FC<ReviewFormProps> = ({ 
  dealership, 
  dealershipId,
  dealershipName,
  onSubmit, 
  editMode = false,
  initialData,
  reviewId,
  onSubmitting,
  onSuccess,
  onError,
  onFormChange
}) => {
  const { user, isAuthenticated } = useAuth();
  const { executeRecaptcha } = useGoogleReCaptcha();
  
  // Initialize form data based on mode
  const getInitialFormData = (): FormData => {
    if (editMode && initialData) {
      return {
        receiptTime: convertApiValueToScore(initialData.receiptProcessingTime),
        platesTime: convertApiValueToScore(initialData.platesProcessingTime),
        reviewText: initialData.content,
        acceptTerms: false, // Always unchecked on load
        recaptchaToken: null,
      };
    }
    return {
      receiptTime: 2,
      platesTime: 2,
      reviewText: '',
      acceptTerms: false,
      recaptchaToken: null,
    };
  };
  
  const [formData, setFormData] = useState<FormData>(getInitialFormData());
  const [originalFormData, setOriginalFormData] = useState<FormData | null>(null);

  const [errors, setErrors] = useState<FormErrors>({});
  const [calculatedRating, setCalculatedRating] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [duplicateReviewError, setDuplicateReviewError] = useState(false);
  const [showUpdateConfirmation, setShowUpdateConfirmation] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);

  // Check if form has changes (for edit mode)
  const hasFormChanges = editMode && originalFormData ? 
    formData.receiptTime !== originalFormData.receiptTime ||
    formData.platesTime !== originalFormData.platesTime ||
    formData.reviewText !== originalFormData.reviewText : false;


  // Store original form data when component mounts or initialData changes
  useEffect(() => {
    if (editMode && initialData) {
      const initialFormData = {
        receiptTime: convertApiValueToScore(initialData.receiptProcessingTime),
        platesTime: convertApiValueToScore(initialData.platesProcessingTime),
        reviewText: initialData.content,
        acceptTerms: false,
        recaptchaToken: null,
      };
      setOriginalFormData(initialFormData);
    }
  }, [editMode, initialData]);

  // Check for form changes and notify parent component
  useEffect(() => {
    if (editMode && originalFormData && onFormChange) {
      const hasChanges = 
        formData.receiptTime !== originalFormData.receiptTime ||
        formData.platesTime !== originalFormData.platesTime ||
        formData.reviewText !== originalFormData.reviewText;
      
      onFormChange(hasChanges);
    }
  }, [formData, originalFormData, editMode, onFormChange]);

  // Calculate initial rating when component mounts
  useEffect(() => {
    const averageScore = (formData.receiptTime + formData.platesTime) / 2;
    const starRating = Math.max(1, Math.round((averageScore / 4) * 4) + 1);
    setCalculatedRating(starRating);
  }, [formData.receiptTime, formData.platesTime]);

  const handleReceiptTimeChange = (value: number) => {
    setFormData(prev => ({ ...prev, receiptTime: value }));
    // Calculate rating for form submission (same logic as DualTimeSliderRating)
    const averageScore = (value + formData.platesTime) / 2;
    const starRating = Math.max(1, Math.round((averageScore / 4) * 4) + 1);
    setCalculatedRating(starRating);
    if (errors.receiptTime) {
      const { receiptTime, ...rest } = errors;
      setErrors(rest);
    }
  };

  const handlePlatesTimeChange = (value: number) => {
    setFormData(prev => ({ ...prev, platesTime: value }));
    // Calculate rating for form submission (same logic as DualTimeSliderRating)
    const averageScore = (formData.receiptTime + value) / 2;
    const starRating = Math.max(1, Math.round((averageScore / 4) * 4) + 1);
    setCalculatedRating(starRating);
    if (errors.platesTime) {
      const { platesTime, ...rest } = errors;
      setErrors(rest);
    }
  };

  const handleReviewTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    setFormData(prev => ({ ...prev, reviewText: value }));
    if (errors.reviewText) {
      const { reviewText, ...rest } = errors;
      setErrors(rest);
    }
  };

  const handleAcceptTermsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, acceptTerms: event.target.checked }));
    if (errors.acceptTerms) {
      const { acceptTerms, ...rest } = errors;
      setErrors(rest);
    }
  };


  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (formData.receiptTime === null || formData.receiptTime === undefined) {
      newErrors.receiptTime = 'Please select receipt processing time';
    }

    if (formData.platesTime === null || formData.platesTime === undefined) {
      newErrors.platesTime = 'Please select plates processing time';
    }

    if (!formData.reviewText.trim()) {
      newErrors.reviewText = 'Please write a review';
    } else if (formData.reviewText.trim().length < 50) {
      newErrors.reviewText = 'Review must be at least 50 characters long';
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'Please accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm() || calculatedRating === null) {
      return;
    }

    if (editMode) {
      // Show confirmation dialog for updates
      setShowUpdateConfirmation(true);
    } else {
      // For new reviews, proceed directly (with reCAPTCHA)
      await submitReview();
    }
  };

  const submitReview = async () => {
    if (calculatedRating === null) {
      onError?.('Unable to calculate rating. Please try again.') || alert('Unable to calculate rating. Please try again.');
      return;
    }

    setSubmitting(true);
    onSubmitting?.(true);

    try {
      if (editMode) {
        // Edit mode - update existing review
        if (!reviewId) {
          throw new Error('Review ID is required for edit mode');
        }

        const updateData = {
          rating: calculatedRating,
          title: `${calculatedRating} star${calculatedRating !== 1 ? 's' : ''} - ${
            calculatedRating >= 5 ? 'Excellent' : 
            calculatedRating >= 4 ? 'Good' : 
            calculatedRating >= 3 ? 'Average' : 
            calculatedRating >= 2 ? 'Below Average' : 'Poor'
          } experience`,
          content: formData.reviewText,
          receiptProcessingTime: convertScoreToApiValue(formData.receiptTime),
          platesProcessingTime: convertScoreToApiValue(formData.platesTime),
        };

        console.log('Updating review:', updateData);
        const result = await reviewService.updateReview(reviewId, updateData);
        console.log('Review updated successfully:', result);

        onSuccess?.();
      } else {
        // Create mode - create new review
        if (!executeRecaptcha) {
          throw new Error('reCAPTCHA not available');
        }
        
        const recaptchaToken = await executeRecaptcha('submit_review');
        
        if (!recaptchaToken) {
          throw new Error('reCAPTCHA verification failed');
        }

        // Generate a meaningful title based on rating
        const title = `${calculatedRating} star${calculatedRating !== 1 ? 's' : ''} - ${
          calculatedRating >= 5 ? 'Excellent' : 
          calculatedRating >= 4 ? 'Good' : 
          calculatedRating >= 3 ? 'Average' : 
          calculatedRating >= 2 ? 'Below Average' : 'Poor'
        } experience`;

        const dealershipIdValue = dealership?.googlePlaceId || dealershipId;
        if (!dealershipIdValue) {
          throw new Error('Dealership ID is required');
        }

        const reviewData = {
          dealershipId: dealershipIdValue,
          rating: calculatedRating,
          title,
          content: formData.reviewText,
          receiptProcessingTime: convertScoreToApiValue(formData.receiptTime),
          platesProcessingTime: convertScoreToApiValue(formData.platesTime),
          visitDate: new Date().toISOString().split('T')[0], // Current date
          // Pass dealership information for auto-creation if needed
          dealershipName: dealership?.name || dealershipName || 'Unknown Dealership',
          // Include reCAPTCHA token
          recaptchaToken: recaptchaToken,
        };

        console.log('Submitting review data:', reviewData);

        // Make API call to create review using the review service
        const result = await reviewService.createReview(reviewData);
        console.log('Review created successfully:', result);

        onSuccess?.() || onSubmit?.();
      }
    } catch (error) {
      console.error(`Error ${editMode ? 'updating' : 'submitting'} review:`, error);
      
      // Check for specific error types
      if (error instanceof Error) {
        const errorMessage = error.message;
        
        if (errorMessage.includes('401')) {
          const message = `Your session has expired. Please sign in again to ${editMode ? 'update' : 'submit'} your review.`;
          onError?.(message) || alert(message);
        } else if (errorMessage.includes('already reviewed') || errorMessage.includes('DUPLICATE_REVIEW')) {
          if (!editMode) {
            setDuplicateReviewError(true);
          }
        } else if (errorMessage.includes('reCAPTCHA') || errorMessage.includes('RECAPTCHA')) {
          const message = 'Security verification failed. Please try again.';
          onError?.(message) || alert(message);
        } else {
          const message = errorMessage || `Failed to ${editMode ? 'update' : 'submit'} review. Please try again.`;
          onError?.(message) || alert(message);
        }
      } else {
        const message = `Failed to ${editMode ? 'update' : 'submit'} review. Please try again.`;
        onError?.(message) || alert(message);
      }
    } finally {
      setSubmitting(false);
      onSubmitting?.(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!reviewId) {
      onError?.('Review ID is required for deletion') || alert('Review ID is required for deletion');
      return;
    }

    setShowDeleteConfirmation(true);
  };

  const confirmDelete = async () => {
    setSubmitting(true);
    onSubmitting?.(true);

    try {
      await reviewService.deleteReview(reviewId!);
      onSuccess?.();
    } catch (error) {
      console.error('Error deleting review:', error);
      const message = error instanceof Error ? error.message : 'Failed to delete review. Please try again.';
      onError?.(message) || alert(message);
    } finally {
      setSubmitting(false);
      onSubmitting?.(false);
    }
  };

  // Show login prompt if user is not authenticated
  if (!isAuthenticated) {
    return (
      <Box>
        {/* Dealership Context */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            bgcolor: 'grey.50',
            borderRadius: 2,
            mb: 3,
          }}
        >
          <Typography variant="h6" gutterBottom>
            {dealership?.name || dealershipName || 'Dealership'}
          </Typography>
          {dealership?.address && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              📍 {dealership.address}
            </Typography>
          )}
          {dealership && (
            <Box display="flex" alignItems="center" gap={1}>
              <Rating
                value={dealership.averageRating || 0}
                readOnly
                size="small"
                precision={0.1}
              />
              <Typography variant="body2">
                {dealership.averageRating ? dealership.averageRating.toFixed(1) : 'No rating'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ({dealership.reviewCount || 0} review{dealership.reviewCount !== 1 ? 's' : ''})
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Login Required Message */}
        <Paper elevation={0} sx={{ p: 4, textAlign: 'center' }}>
          <LoginIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Sign in to Write a Review
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            You need to be signed in to share your experience and help other customers make informed decisions.
          </Typography>
          
          <GoogleSignInButton
            onSuccess={() => {
              // Form will re-render automatically when auth state changes
            }}
            onError={(error) => {
              console.error('Google Sign-In error:', error);
            }}
          />
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="body2" color="text.secondary">
            By signing in, you agree to our{' '}
            <Link
              component="button"
              onClick={(e) => {
                e.preventDefault();
                setShowTermsDialog(true);
              }}
              color="primary"
              sx={{ 
                textDecoration: 'underline',
                background: 'none',
                border: 'none',
                padding: 0,
                font: 'inherit',
                cursor: 'pointer'
              }}
            >
              Terms of Service
            </Link>
            {' '}and Review Guidelines.
          </Typography>
        </Paper>
      </Box>
    );
  }

  // Show duplicate review error if detected
  if (duplicateReviewError) {
    return (
      <Box>
        {/* Dealership Context */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            bgcolor: 'grey.50',
            borderRadius: 2,
            mb: 3,
          }}
        >
          <Typography variant="h6" gutterBottom>
            {dealership?.name || dealershipName || 'Dealership'}
          </Typography>
          {dealership?.address && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              📍 {dealership.address}
            </Typography>
          )}
          {dealership && (
            <Box display="flex" alignItems="center" gap={1}>
              <Rating
                value={dealership.averageRating || 0}
                readOnly
                size="small"
                precision={0.1}
              />
              <Typography variant="body2">
                {dealership.averageRating ? dealership.averageRating.toFixed(1) : 'No rating'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ({dealership.reviewCount || 0} review{dealership.reviewCount !== 1 ? 's' : ''})
              </Typography>
            </Box>
          )}
        </Paper>

        {/* User Info */}
        {user && (
          <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <Box display="flex" alignItems="center" gap={2}>
              {user.picture && (
                <Box
                  component="img"
                  src={user.picture}
                  alt={user.name}
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                  }}
                />
              )}
              <Box>
                <Typography variant="body2" fontWeight="medium">
                  Signed in as {user.name}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {user.email}
                </Typography>
              </Box>
            </Box>
          </Paper>
        )}

        {/* Duplicate Review Error */}
        <Alert severity="warning" sx={{ mb: 3 }}>
          <AlertTitle>Review Already Submitted</AlertTitle>
          <Typography variant="body2" sx={{ mb: 2 }}>
            You have already submitted a review for <strong>{dealership?.name || dealershipName}</strong>. 
            Each user can only submit one review per dealership.
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            If you'd like to update your existing review, you can:
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2 }}>
            <li>Switch to the "Details" tab to view all reviews</li>
            <li>Find your review in the reviews section</li>
            <li>Use the edit option to modify your existing review</li>
            <li>Or contact support if you need assistance</li>
          </Box>
        </Alert>

        {/* Action Buttons */}
        <Box display="flex" gap={2} justifyContent="center">
          <Button
            variant="outlined"
            onClick={() => {
              setDuplicateReviewError(false);
              // Reset form state
              setFormData({
                receiptTime: 2,
                platesTime: 2,
                reviewText: '',
                acceptTerms: false,
                recaptchaToken: null,
              });
              setErrors({});
              setCalculatedRating(null);
            }}
          >
            Try Again
          </Button>
          <Button
            variant="contained"
            onClick={onSubmit}
          >
            Back to Reviews
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {/* Dealership Context */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          bgcolor: 'grey.50',
          borderRadius: 2,
          mb: 3,
        }}
      >
        <Typography variant="h6" gutterBottom>
          {dealership?.name || dealershipName || 'Dealership'}
        </Typography>
        {dealership?.address && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            📍 {dealership.address}
          </Typography>
        )}
        {dealership && (
          <Box display="flex" alignItems="center" gap={1}>
            <Rating
              value={dealership.googleRating}
              readOnly
              size="small"
              precision={0.1}
            />
            <Typography variant="body2">
              {dealership.googleRating}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ({dealership.googleReviewCount} reviews)
            </Typography>
          </Box>
        )}
      </Paper>

      {/* User Info - Anonymized */}
      {user && (
        <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar
              sx={{ 
                width: 32, 
                height: 32,
                bgcolor: generateAnonymousAvatarColor(user.id),
                color: 'white',
                fontWeight: 'bold',
                fontSize: '0.875rem'
              }}
            >
              {generateAnonymousInitials(user.id)}
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight="medium">
                Writing as {generateAnonymousUsername(user.id)}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Your review will be posted anonymously
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Document Processing Times Section */}
      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Document Processing Times *
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Please indicate how long it took to receive these important documents from the dealership. 
          This helps other buyers know what to expect.
        </Typography>

        {/* Enhanced Dual Time Slider Rating */}
        <DualTimeSliderRating
          receiptTime={formData.receiptTime}
          platesTime={formData.platesTime}
          onReceiptTimeChange={handleReceiptTimeChange}
          onPlatesTimeChange={handlePlatesTimeChange}
          receiptError={errors.receiptTime}
          platesError={errors.platesTime}
          showCalculatedRating={true}
        />
      </Paper>

      {/* Experience Section */}
      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Your Experience *
        </Typography>
        
        <TextField
          fullWidth
          multiline
          rows={5}
          placeholder="Share details about your experience with this dealership. What went well? What could be improved? This helps other customers make informed decisions."
          value={formData.reviewText}
          onChange={handleReviewTextChange}
          inputProps={{ maxLength: 2000 }}
          error={!!errors.reviewText}
          helperText={errors.reviewText || 'Minimum 50 characters. Be specific and honest to help other customers.'}
        />
        
        <Box display="flex" justifyContent="flex-end" sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {formData.reviewText.length}/2000 characters
          </Typography>
        </Box>
      </Paper>

      {/* Review Guidelines */}
      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Review Guidelines
        </Typography>
        
        <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, mb: 2 }}>
          <Typography variant="body2" component="div">
            <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
              <li>Be honest and constructive in your feedback</li>
              <li>Focus on your experience with the dealership</li>
              <li>Don't include personal information of staff or other customers</li>
              <li>Avoid profanity or inappropriate language</li>
              <li>Don't post fake reviews or reviews for competitors</li>
            </ul>
          </Typography>
        </Box>
        
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.acceptTerms}
              onChange={handleAcceptTermsChange}
              color="primary"
            />
          }
          label={
            <Typography variant="body2">
              I agree to the{' '}
              <Link
                component="button"
                onClick={(e) => {
                  e.preventDefault();
                  setShowTermsDialog(true);
                }}
                color="primary"
                sx={{ 
                  textDecoration: 'underline',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  font: 'inherit',
                  cursor: 'pointer'
                }}
              >
                Terms of Service
              </Link>
              {' '}and Review Guidelines *
            </Typography>
          }
        />
        
        {errors.acceptTerms && (
          <FormHelperText error>{errors.acceptTerms}</FormHelperText>
        )}
      </Paper>

      {/* Security Notice - Only show for create mode */}
      {!editMode && (
        <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: 'info.light', color: 'info.contrastText' }}>
          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            🔒 <strong>Security:</strong> This form is protected by reCAPTCHA v3 for spam prevention.
          </Typography>
        </Paper>
      )}

      {/* Form Actions */}
      <Box display="flex" justifyContent="center" gap={2}>
        {editMode && (
          <Button 
            variant="outlined" 
            color="error"
            onClick={handleDeleteReview}
            disabled={submitting}
            startIcon={<Delete />}
          >
            Delete Review
          </Button>
        )}
        <Button 
          variant="contained" 
          type="submit" 
          disabled={submitting || (editMode && !hasFormChanges)}
        >
          {submitting ? (editMode ? 'Updating...' : 'Submitting...') : (editMode ? 'Update Review' : 'Submit Review')}
        </Button>
      </Box>

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        open={showUpdateConfirmation}
        onClose={() => setShowUpdateConfirmation(false)}
        onConfirm={() => {
          setShowUpdateConfirmation(false);
          submitReview();
        }}
        loading={submitting}
        title="Update Review"
        description="Are you sure you want to update your review? This will replace your existing review with the new information."
        confirmText="Update Review"
        cancelText="Cancel"
        severity="info"
        icon="edit"
        itemName={initialData?.title || 'Review'}
      />

      <ConfirmationDialog
        open={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={() => {
          setShowDeleteConfirmation(false);
          confirmDelete();
        }}
        loading={submitting}
        title="Delete Review"
        description="Are you sure you want to delete your review? This action cannot be undone and your review will be permanently removed."
        confirmText="Delete Review"
        cancelText="Cancel"
        severity="warning"
        icon="delete"
        itemName={initialData?.title || 'Review'}
      />

      {/* Terms of Service Dialog */}
      <TermsOfServiceDialog
        open={showTermsDialog}
        onClose={() => setShowTermsDialog(false)}
      />
    </Box>
  );
};

export default ReviewForm;