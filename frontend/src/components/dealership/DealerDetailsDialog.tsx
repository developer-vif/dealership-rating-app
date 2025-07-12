import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Typography,
  Box,
  Grid,
  Paper,
  IconButton,
  CircularProgress,
  Alert,
  Rating,
  Chip,
  Avatar,
} from '@mui/material';
import {
  Close as CloseIcon,
  Phone as PhoneIcon,
  Language as WebsiteIcon,
  Directions as DirectionsIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import { Dealership } from '../../types/dealership';
import { formatDistance } from '../../utils/locationUtils';
import { formatPhone } from '../../utils/formatPhone';
import { getDealershipHours } from '../../utils/dealershipHours';
import ReviewForm from './ReviewForm';
import ReviewsList from './ReviewsList';

interface DealerDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  dealership: Dealership | null;
  loading?: boolean;
}


const DealerDetailsDialog: React.FC<DealerDetailsDialogProps> = ({
  open,
  onClose,
  dealership,
  loading = false,
}) => {
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleReviewSubmit = () => {
    setReviewSubmitted(true);
    setRefreshTrigger(prev => prev + 1); // Trigger reviews refresh
    // Reset after showing success message
    setTimeout(() => {
      setReviewSubmitted(false);
    }, 3000);
  };

  const handleCall = () => {
    if (dealership?.phone) {
      window.location.href = `tel:${dealership.phone}`;
    }
  };

  const handleWebsite = () => {
    if (dealership?.website) {
      window.open(dealership.website, '_blank');
    }
  };

  const handleDirections = () => {
    if (dealership?.latitude && dealership?.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${dealership.latitude},${dealership.longitude}`;
      window.open(url, '_blank');
    }
  };

  const currentHours = dealership ? getDealershipHours(dealership.hours) : null;

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="200px"
          >
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  if (!dealership) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Alert severity="error">
            Unable to load dealership details. Please try again.
          </Alert>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{dealership.name}</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Dealership Details Section - Always Visible */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            bgcolor: 'grey.50',
            borderRadius: 2,
            mb: 3,
          }}
        >
          <Grid container spacing={3} alignItems="center">
            {/* Dealer Photo */}
            <Grid item xs={12} sm={3} md={2}>
              <Avatar
                src={dealership.photos?.[0] || '/assets/default-dealership.jpg'}
                alt={dealership.name}
                sx={{ 
                  width: 100, 
                  height: 100, 
                  mx: 'auto',
                  border: '2px solid',
                  borderColor: 'grey.300'
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={9} md={6}>
              <Typography variant="h6" gutterBottom>
                {dealership.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {dealership.address}
              </Typography>
              <Box display="flex" alignItems="center" gap={2} mb={1}>
                <Box display="flex" alignItems="center">
                  <Rating
                    value={dealership.averageRating || 0}
                    readOnly
                    size="small"
                    precision={0.1}
                  />
                  <Typography variant="body2" ml={1}>
                    {dealership.averageRating ? dealership.averageRating.toFixed(1) : 'No rating'}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  ({dealership.reviewCount || 0} review{dealership.reviewCount !== 1 ? 's' : ''})
                </Typography>
                {dealership.distance && (
                  <Typography variant="body2" color="text.secondary">
                    {formatDistance(dealership.distance)}
                  </Typography>
                )}
              </Box>
              {dealership.brands && dealership.brands.length > 0 && (
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {dealership.brands.map((brand, index) => (
                    <Chip
                      key={index}
                      label={brand}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              )}
            </Grid>
            <Grid item xs={12} md={4}>
              <Box display="flex" flexDirection="column" gap={1}>
                {dealership.phone && (
                  <Button
                    variant="outlined"
                    startIcon={<PhoneIcon />}
                    onClick={handleCall}
                    size="small"
                    fullWidth
                  >
                    {formatPhone(dealership.phone)}
                  </Button>
                )}
                {dealership.website && (
                  <Button
                    variant="outlined"
                    startIcon={<WebsiteIcon />}
                    onClick={handleWebsite}
                    size="small"
                    fullWidth
                  >
                    Website
                  </Button>
                )}
                <Button
                  variant="outlined"
                  startIcon={<DirectionsIcon />}
                  onClick={handleDirections}
                  size="small"
                  fullWidth
                >
                  Directions
                </Button>
              </Box>
            </Grid>
          </Grid>

          {/* Business Hours */}
          {currentHours && (
            <Box mt={3}>
              <Typography variant="subtitle1" gutterBottom>
                <TimeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Business Hours
              </Typography>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography
                  variant="body2"
                  color={currentHours.isOpen ? 'success.main' : 'error.main'}
                >
                  {currentHours.isOpen ? 'Open' : 'Closed'}
                </Typography>
                {currentHours.nextChange && (
                  <Typography variant="body2" color="text.secondary">
                    • {currentHours.nextChange}
                  </Typography>
                )}
              </Box>
              <Typography variant="body2" color="text.secondary">
                {currentHours.todayHours}
              </Typography>
            </Box>
          )}

          {/* Description */}
          {dealership.description && (
            <Box mt={3}>
              <Typography variant="subtitle1" gutterBottom>
                About
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {dealership.description}
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Photos Section */}
        {dealership.photos && dealership.photos.length > 0 && (
          <Box mb={4}>
            <Typography variant="h6" gutterBottom>
              Photos
            </Typography>
            <Grid container spacing={2}>
              {dealership.photos.map((photo, index) => (
                <Grid item xs={6} md={4} key={index}>
                  <Box
                    component="img"
                    src={photo}
                    alt={`${dealership.name} photo ${index + 1}`}
                    sx={{
                      width: '100%',
                      height: 120,
                      objectFit: 'cover',
                      borderRadius: 1,
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Write Review Section */}
        <Box mb={4}>
          <Typography variant="h6" gutterBottom>
            Write a Review
          </Typography>
          {reviewSubmitted ? (
            <Alert severity="success" sx={{ mb: 3 }}>
              Thank you for your review! Your feedback helps other customers make informed decisions.
            </Alert>
          ) : (
            <ReviewForm dealership={dealership} onSubmit={handleReviewSubmit} />
          )}
        </Box>

        {/* Existing Reviews Section */}
        <Box>
          <ReviewsList 
            placeId={dealership.googlePlaceId} 
            dealershipName={dealership.name}
            refreshTrigger={refreshTrigger} 
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default DealerDetailsDialog;