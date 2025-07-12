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
  Grid,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ButtonRatingInput from '../../components/rating/ButtonRatingInput';

const ButtonRatingTest: React.FC = () => {
  const navigate = useNavigate();
  const [rating, setRating] = useState<number>(0);
  const [submitted, setSubmitted] = useState(false);
  const [variant, setVariant] = useState<'text' | 'emoji' | 'mixed'>('mixed');

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
            Button Group Rating
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Descriptive button options with clear visual feedback
          </Typography>
          <Chip label="Alternative 3" color="success" variant="outlined" />
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ mb: 3 }}>
                <FormControl component="fieldset">
                  <FormLabel component="legend" sx={{ mb: 1 }}>
                    Button Variant
                  </FormLabel>
                  <RadioGroup
                    row
                    value={variant}
                    onChange={(e) => setVariant(e.target.value as 'text' | 'emoji' | 'mixed')}
                  >
                    <FormControlLabel value="mixed" control={<Radio size="small" />} label="Emoji + Text" />
                    <FormControlLabel value="emoji" control={<Radio size="small" />} label="Emoji Only" />
                    <FormControlLabel value="text" control={<Radio size="small" />} label="Text Only" />
                  </RadioGroup>
                </FormControl>
              </Box>
              
              <ButtonRatingInput
                value={rating}
                onChange={setRating}
                label="Rate Your Experience"
                required
                showStars
                variant={variant}
              />
              
              <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
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
                <Chip label="Mobile Friendly" size="small" sx={{ m: 0.5 }} />
                <Chip label="Descriptive Labels" size="small" sx={{ m: 0.5 }} />
                <Chip label="Clear Visual States" size="small" sx={{ m: 0.5 }} />
                <Chip label="Touch Optimized" size="small" sx={{ m: 0.5 }} />
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>
                Features:
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                • Large touch targets
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                • Emoji visual feedback
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                • Responsive layout
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                • Color-coded selections
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Multiple display variants
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
            This button group implementation provides clear, descriptive options with visual feedback.
            The layout adapts to mobile screens and offers multiple display variants for different use cases.
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            <strong>Pros:</strong> Mobile-friendly, clear labeling, good touch targets, visual feedback, accessible
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Considerations:</strong> Takes more screen space, may be slower for power users, requires more clicks
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

export default ButtonRatingTest;