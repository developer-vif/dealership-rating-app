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
  Slider,
  Avatar,
} from '@mui/material';
import { Login as LoginIcon } from '@mui/icons-material';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { Dealership } from '../../types/dealership';
import { useAuth } from '../../contexts/AuthContext';
import GoogleSignInButton from '../auth/GoogleSignInButton';
import reviewService from '../../services/reviewService';
import { 
  generateAnonymousUsername, 
  generateAnonymousInitials, 
  generateAnonymousAvatarColor 
} from '../../utils/anonymization';

interface ReviewFormProps {
  dealership: Dealership;
  onSubmit: () => void;
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


const sliderMarks = [
  { value: 0, label: '> 2 Months' },
  { value: 1, label: '< 2 Months' },
  { value: 2, label: '< 1 Month' },
  { value: 3, label: '< 2 Weeks' },
  { value: 4, label: '< 1 Week' },
];

const getTimeDescription = (score: number): string => {
  const descriptions = {
    0: '60+ days',
    1: '31-60 days',
    2: '15-30 days',
    3: '8-14 days',
    4: '1-7 days'
  };
  return descriptions[score as keyof typeof descriptions] || '';
};

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

const ratingDescriptions = {
  5: 'Excellent - Very Fast Processing',
  4: 'Good - Fast Processing',
  3: 'Average - Standard Processing',
  2: 'Below Average - Slow Processing',
  1: 'Poor - Very Slow Processing',
};

const ReviewForm: React.FC<ReviewFormProps> = ({ dealership, onSubmit }) => {
  const { user, isAuthenticated } = useAuth();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [formData, setFormData] = useState<FormData>({
    receiptTime: 2,
    platesTime: 2,
    reviewText: '',
    acceptTerms: false,
    recaptchaToken: null,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [calculatedRating, setCalculatedRating] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [duplicateReviewError, setDuplicateReviewError] = useState(false);

  const calculateRating = (receiptTime: number, platesTime: number) => {
    const receiptScore = receiptTime;
    const platesScore = platesTime;
    
    // Convert 0-4 scale to 1-5 star rating
    const averageScore = (receiptScore + platesScore) / 2;
    const starRating = Math.max(1, Math.round((averageScore / 4) * 4) + 1); // Map 0-4 to 1-5 stars
    
    setCalculatedRating(starRating);
  };

  // Calculate initial rating when component mounts
  useEffect(() => {
    calculateRating(formData.receiptTime, formData.platesTime);
  }, [formData.receiptTime, formData.platesTime]);

  const handleReceiptTimeChange = (value: number) => {
    setFormData(prev => ({ ...prev, receiptTime: value }));
    calculateRating(value, formData.platesTime);
    if (errors.receiptTime) {
      const { receiptTime, ...rest } = errors;
      setErrors(rest);
    }
  };

  const handlePlatesTimeChange = (value: number) => {
    setFormData(prev => ({ ...prev, platesTime: value }));
    calculateRating(formData.receiptTime, value);
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

    setSubmitting(true);

    try {
      // Execute reCAPTCHA v3
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

      const reviewData = {
        dealershipId: dealership.googlePlaceId, // Use the Google Place ID
        rating: calculatedRating,
        title,
        content: formData.reviewText,
        receiptProcessingTime: convertScoreToApiValue(formData.receiptTime),
        platesProcessingTime: convertScoreToApiValue(formData.platesTime),
        visitDate: new Date().toISOString().split('T')[0], // Current date
        // Pass dealership information for auto-creation if needed
        dealershipName: dealership.name,
        // Include reCAPTCHA token
        recaptchaToken: recaptchaToken,
      };

      console.log('Submitting review data:', reviewData);

      // Make API call to create review using the review service
      const result = await reviewService.createReview(reviewData);
      console.log('Review created successfully:', result);

      onSubmit();
    } catch (error) {
      console.error('Error submitting review:', error);
      
      // Check for specific error types
      if (error instanceof Error) {
        const errorMessage = error.message;
        
        if (errorMessage.includes('401')) {
          alert('Your session has expired. Please sign in again to submit your review.');
        } else if (errorMessage.includes('already reviewed') || errorMessage.includes('DUPLICATE_REVIEW')) {
          setDuplicateReviewError(true);
        } else if (errorMessage.includes('reCAPTCHA') || errorMessage.includes('RECAPTCHA')) {
          alert('Security verification failed. Please try again.');
        } else {
          alert(errorMessage || 'Failed to submit review. Please try again.');
        }
      } else {
        alert('Failed to submit review. Please try again.');
      }
    } finally {
      setSubmitting(false);
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
            {dealership.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            📍 {dealership.address}
          </Typography>
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
            By signing in, you agree to our Terms of Service and Review Guidelines.
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
            {dealership.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            📍 {dealership.address}
          </Typography>
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
            You have already submitted a review for <strong>{dealership.name}</strong>. 
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
          {dealership.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          📍 {dealership.address}
        </Typography>
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

        {/* Receipt Time */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            <strong>Official Receipt & Certificate of Registration Release Time</strong> *
          </Typography>
          
          <Box sx={{ px: 2, mb: 2 }}>
            <Slider
              value={formData.receiptTime}
              onChange={(_, value) => handleReceiptTimeChange(value as number)}
              min={0}
              max={4}
              step={1}
              marks={sliderMarks}
              valueLabelDisplay="off"
              sx={{ mb: 1 }}
            />
            <Typography variant="body2" color="primary" sx={{ textAlign: 'center', fontWeight: 'medium' }}>
              {sliderMarks.find(mark => mark.value === formData.receiptTime)?.label} ({getTimeDescription(formData.receiptTime)})
            </Typography>
          </Box>
          
          <Typography variant="caption" color="text.secondary">
            Official receipt and certificate of registration needed for insurance and legal ownership.
          </Typography>
          
          {errors.receiptTime && (
            <FormHelperText error>{errors.receiptTime}</FormHelperText>
          )}
        </Box>

        {/* Plates Time */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            <strong>Registration Plates Release Time</strong> *
          </Typography>
          
          <Box sx={{ px: 2, mb: 2 }}>
            <Slider
              value={formData.platesTime}
              onChange={(_, value) => handlePlatesTimeChange(value as number)}
              min={0}
              max={4}
              step={1}
              marks={sliderMarks}
              valueLabelDisplay="off"
              sx={{ mb: 1 }}
            />
            <Typography variant="body2" color="primary" sx={{ textAlign: 'center', fontWeight: 'medium' }}>
              {sliderMarks.find(mark => mark.value === formData.platesTime)?.label} ({getTimeDescription(formData.platesTime)})
            </Typography>
          </Box>
          
          <Typography variant="caption" color="text.secondary">
            License plates are required to legally drive your vehicle on public roads.
          </Typography>
          
          {errors.platesTime && (
            <FormHelperText error>{errors.platesTime}</FormHelperText>
          )}
        </Box>

        {/* Calculated Rating */}
        {calculatedRating !== null && (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              bgcolor: 'grey.50',
              borderRadius: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">
                Calculated Rating:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Based on document processing efficiency
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Rating
                value={calculatedRating}
                readOnly
                size="small"
              />
              <Typography variant="body2" fontWeight="medium">
                {calculatedRating}/5 - {ratingDescriptions[calculatedRating as keyof typeof ratingDescriptions]}
              </Typography>
            </Box>
          </Paper>
        )}
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
              I agree to the Terms of Service and Review Guidelines *
            </Typography>
          }
        />
        
        {errors.acceptTerms && (
          <FormHelperText error>{errors.acceptTerms}</FormHelperText>
        )}
      </Paper>

      {/* Security Notice */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: 'info.light', color: 'info.contrastText' }}>
        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          🔒 <strong>Security:</strong> This form is protected by reCAPTCHA v3 for spam prevention.
        </Typography>
      </Paper>

      {/* Form Actions */}
      <Box display="flex" justifyContent="center">
        <Button 
          variant="contained" 
          type="submit" 
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : 'Submit Review'}
        </Button>
      </Box>
    </Box>
  );
};

export default ReviewForm;