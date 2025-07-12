import React from 'react';
import { 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  CardActions, 
  Button, 
  Grid, 
  Chip,
  Box 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import StarIcon from '@mui/icons-material/Star';
import TuneIcon from '@mui/icons-material/Tune';
import TouchAppIcon from '@mui/icons-material/TouchApp';

const TestRatingPage: React.FC = () => {
  const navigate = useNavigate();

  const alternatives = [
    {
      id: 'stars',
      title: 'Direct Star Rating',
      description: 'Simple and intuitive 5-star rating system with immediate visual feedback.',
      icon: <StarIcon sx={{ fontSize: 32 }} />,
      benefits: ['Universal understanding', 'High accessibility', 'Quick selection'],
      path: '/test/rating-stars'
    },
    {
      id: 'slider',
      title: 'Dual Time-Based Sliders',
      description: 'Separate sliders for receipt and plates processing times with automatic rating calculation.',
      icon: <TuneIcon sx={{ fontSize: 32 }} />,
      benefits: ['Time-based metrics', 'Dual control', 'Auto calculation', 'Visual feedback'],
      path: '/test/rating-slider'
    },
    {
      id: 'buttons',
      title: 'Button Group Rating',
      description: 'Descriptive button options from Poor to Excellent for clear choices.',
      icon: <TouchAppIcon sx={{ fontSize: 32 }} />,
      benefits: ['Mobile-friendly', 'Descriptive labels', 'Clear visual states'],
      path: '/test/rating-buttons'
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Rating Input Alternatives
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          Simplified rating slider alternatives for the review dialog
        </Typography>
        <Chip 
          label="Test Environment" 
          color="warning" 
          variant="outlined" 
          sx={{ mb: 2 }}
        />
      </Box>

      <Grid container spacing={3}>
        {alternatives.map((alternative) => (
          <Grid item xs={12} md={4} key={alternative.id}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: (theme) => theme.shadows[8]
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {alternative.icon}
                  <Typography variant="h5" component="h2" sx={{ ml: 1 }}>
                    {alternative.title}
                  </Typography>
                </Box>
                
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  {alternative.description}
                </Typography>
                
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Key Benefits:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {alternative.benefits.map((benefit, index) => (
                    <Chip 
                      key={index}
                      label={benefit} 
                      size="small" 
                      variant="outlined" 
                      color="primary"
                    />
                  ))}
                </Box>
              </CardContent>
              
              <CardActions sx={{ p: 2 }}>
                <Button 
                  variant="contained" 
                  fullWidth
                  onClick={() => navigate(alternative.path)}
                  aria-label={`Test ${alternative.title}`}
                >
                  Test This Alternative
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Each alternative demonstrates a different approach to simplifying the rating input process.
          Compare accessibility, user experience, and implementation complexity.
        </Typography>
      </Box>
    </Container>
  );
};

export default TestRatingPage;