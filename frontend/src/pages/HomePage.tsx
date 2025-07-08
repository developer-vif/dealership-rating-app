import React, { useEffect, useRef } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  Rating,
  Chip
} from '@mui/material';
import { Search, LocationOn, Star } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import useGeolocation from '../hooks/useGeolocation';
import { getCurrentLocationName } from '../utils/locationUtils';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = React.useState('');
  const { position, loading, error } = useGeolocation();
  
  const locationInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (locationInputRef.current && window.google) {
      autocompleteRef.current = new google.maps.places.Autocomplete(
        locationInputRef.current,
        {
          types: ['(cities)'],
          bounds: new google.maps.LatLngBounds(
            new google.maps.LatLng(4.5, 116.0), // Southwest corner of Philippines
            new google.maps.LatLng(21.0, 127.0)  // Northeast corner of Philippines
          ),
          strictBounds: false, // Bias toward Philippines but allow global suggestions
        }
      );

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
        if (place && place.formatted_address) {
          setSearchValue(place.formatted_address);
        }
      });
    }

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const fetchLocationName = async () => {
      if (position) {
        try {
          const locationName = await getCurrentLocationName(
            position.latitude,
            position.longitude
          );
          setSearchValue(locationName);
        } catch (error) {
          console.error('Error getting location name:', error);
          setSearchValue('Manila'); // Fallback
        }
      } else if (error) {
        setSearchValue('Manila'); // Fallback on error
      }
    };

    if (!loading) {
      fetchLocationName();
    }
  }, [position, loading, error]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/dealerships?location=${encodeURIComponent(searchValue)}&radius=10`);
  };

  const mockRecentReviews = [
    {
      id: '1',
      dealership: 'Sunset Toyota',
      rating: 5,
      title: 'Amazing experience at Sunset Toyota',
      excerpt: 'Just bought my first car here and the staff was incredibly helpful...',
      author: 'Sarah M.',
      date: '2 days ago'
    },
    {
      id: '2',
      dealership: 'Metro Honda',
      rating: 4,
      title: 'Good service at Metro Honda',
      excerpt: 'Service department was quick and efficient. They fixed my AC issue...',
      author: 'Mike R.',
      date: '1 week ago'
    },
    {
      id: '3',
      dealership: 'AutoMax Used Cars',
      rating: 5,
      title: 'Excellent used car purchase',
      excerpt: 'AutoMax was transparent about the car\'s history and condition...',
      author: 'David K.',
      date: '5 days ago'
    }
  ];

  return (
    <>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 8,
          textAlign: 'center'
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h1" component="h1" gutterBottom>
            Find the Best Car Dealerships Near You
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
            Read reviews, compare ratings, and share your dealership experiences
          </Typography>
          
          <Paper
            component="form"
            onSubmit={handleSearch}
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              maxWidth: 600,
              mx: 'auto'
            }}
          >
            <LocationOn color="action" />
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Enter city, dealership name, or car brand..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              size="medium"
              inputRef={locationInputRef}
            />
            <Button
              type="submit"
              variant="contained"
              startIcon={<Search />}
              sx={{ minWidth: 140 }}
            >
              Search
            </Button>
          </Paper>
          
          <Box sx={{ mt: 3 }}>
            <Button
              variant="outlined"
              sx={{ color: 'white', borderColor: 'white', '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' } }}
              onClick={() => navigate('/dealerships')}
            >
              Browse All Dealerships
            </Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 6 }}>
        {/* Recent Reviews Section */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h2" component="h2" gutterBottom align="center">
            Recent Reviews
          </Typography>
          <Typography variant="body1" align="center" sx={{ mb: 4, color: 'text.secondary' }}>
            See what others are saying about local dealerships
          </Typography>
          
          <Grid container spacing={3}>
            {mockRecentReviews.map((review) => (
              <Grid item xs={12} md={4} key={review.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Rating value={review.rating} readOnly size="small" />
                      <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                        {review.date}
                      </Typography>
                    </Box>
                    
                    <Typography variant="h6" component="h3" gutterBottom>
                      {review.title}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {review.excerpt}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                      <Chip
                        label={review.dealership}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Typography variant="caption" color="text.secondary">
                        - {review.author}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Call to Action */}
        <Box
          sx={{
            textAlign: 'center',
            py: 6,
            backgroundColor: 'background.paper',
            borderRadius: 2,
            boxShadow: 1
          }}
        >
          <Typography variant="h3" component="h2" gutterBottom>
            Share Your Dealership Experience
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
            Help others make informed decisions by sharing your honest review
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<Star />}
            onClick={() => navigate('/dealerships')}
          >
            Write a Review
          </Button>
        </Box>
      </Container>
    </>
  );
};

export default HomePage;