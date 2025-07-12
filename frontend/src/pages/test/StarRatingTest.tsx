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
  Divider,
  Grid
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import StarRatingInput from '../../components/rating/StarRatingInput';

const StarRatingTest: React.FC = () => {
  const navigate = useNavigate();
  const [rating, setRating] = useState<number>(0);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (rating > 0) {
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    }
  };

  const handleReset = () => {
    setRating(0);
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
            Direct Star Rating
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Simple and intuitive 5-star rating system
          </Typography>
          <Chip label="Alternative 1" color="primary" variant="outlined" />
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <StarRatingInput
                value={rating}
                onChange={setRating}
                label="Rate Your Experience"
                required
                showValueText
              />
              
              <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button 
                  variant="contained" 
                  onClick={handleSubmit}
                  disabled={rating === 0}
                >
                  Submit Rating
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={handleReset}
                >
                  Reset
                </Button>
              </Box>
              
              {submitted && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  Rating submitted successfully! You rated: {rating} star{rating !== 1 ? 's' : ''}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Benefits
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Chip label="Universal Understanding" size="small" sx={{ m: 0.5 }} />
                <Chip label="High Accessibility" size="small" sx={{ m: 0.5 }} />
                <Chip label="Quick Selection" size="small" sx={{ m: 0.5 }} />
                <Chip label="Visual Feedback" size="small" sx={{ m: 0.5 }} />
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>
                Accessibility Features:
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                • Full keyboard navigation
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                • Screen reader announcements
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                • ARIA labels and descriptions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • High contrast focus indicators
              </Typography>
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
            This implementation uses Material-UI's Rating component with enhanced accessibility features.
            The star rating provides immediate visual feedback and is universally understood by users.
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            <strong>Pros:</strong> Intuitive, accessible, quick to use, familiar pattern
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Considerations:</strong> Less granular than sliders, may be less engaging than custom interactions
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

export default StarRatingTest;