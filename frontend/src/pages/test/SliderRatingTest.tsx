import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  Box, 
  Button, 
  Alert,
  Chip,
  Grid
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DualTimeSliderRating from '../../components/rating/DualTimeSliderRating';

const SliderRatingTest: React.FC = () => {
  const navigate = useNavigate();
  const [receiptTime, setReceiptTime] = useState<number>(2); // Start with middle value (< 1 Month)
  const [platesTime, setPlatesTime] = useState<number>(2); // Start with middle value (< 1 Month)
  const [submitted, setSubmitted] = useState(false);

  // Calculate rating based on both sliders (same logic as original)
  const calculateRating = (receipt: number, plates: number): number => {
    const averageScore = (receipt + plates) / 2;
    return Math.max(1, Math.round((averageScore / 4) * 4) + 1);
  };

  const currentRating = calculateRating(receiptTime, platesTime);

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const handleReset = () => {
    setReceiptTime(2);
    setPlatesTime(2);
    setSubmitted(false);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Button 
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/test/ratings')}
          sx={{ mb: 2 }}
        >
          Back to All Alternatives
        </Button>
        
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Dual Time-Based Sliders
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Separate sliders for receipt and plates processing times with automatic rating calculation
          </Typography>
          <Chip label="Alternative 2 - Enhanced" color="secondary" variant="outlined" />
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <DualTimeSliderRating
                receiptTime={receiptTime}
                platesTime={platesTime}
                onReceiptTimeChange={setReceiptTime}
                onPlatesTimeChange={setPlatesTime}
                showCalculatedRating={true}
              />
              
              <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button 
                  variant="contained" 
                  onClick={handleSubmit}
                >
                  Submit Rating
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={handleReset}
                >
                  Reset to Default
                </Button>
              </Box>
              
              {submitted && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  Rating submitted successfully! You rated: {currentRating} star{currentRating !== 1 ? 's' : ''}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Enhanced Features
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Chip label="Time-Based Processing" size="small" sx={{ m: 0.5 }} />
                    <Chip label="Dual Slider Control" size="small" sx={{ m: 0.5 }} />
                    <Chip label="Auto Rating Calculation" size="small" sx={{ m: 0.5 }} />
                    <Chip label="Visual Feedback" size="small" sx={{ m: 0.5 }} />
                  </Box>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Key Features:
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    • Separate receipt and plates processing times
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    • Real-world time labels (&gt; 2 months, &lt; 1 week, etc.)
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    • Color-coded track gradients
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Automatic star rating calculation
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Current Values:
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    <strong>Receipt Time:</strong> {receiptTime === 0 ? '> 2 Months' : receiptTime === 1 ? '< 2 Months' : receiptTime === 2 ? '< 1 Month' : receiptTime === 3 ? '< 2 Weeks' : '< 1 Week'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    <strong>Plates Time:</strong> {platesTime === 0 ? '> 2 Months' : platesTime === 1 ? '< 2 Months' : platesTime === 2 ? '< 1 Month' : platesTime === 3 ? '< 2 Weeks' : '< 1 Week'}
                  </Typography>
                  <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold' }}>
                    <strong>Calculated Rating:</strong> {currentRating}/5 stars
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mt: 3, bgcolor: 'background.default' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Implementation Notes
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            This enhanced implementation maintains the dual slider approach from the original ReviewForm while 
            applying the improved design from Alternative 2. It uses the exact same time-based labels and rating 
            calculation logic as the current system.
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            <strong>Pros:</strong> Familiar time-based metrics, precise control, maintains current data structure, 
            improved visual feedback, color-coded tracks, better accessibility
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Considerations:</strong> Takes more screen space than single slider, requires understanding 
            of processing time context, but provides more granular and realistic rating criteria
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

export default SliderRatingTest;