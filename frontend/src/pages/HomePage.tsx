import React, { useEffect, useRef, useState } from 'react';
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
  CardMedia,
  Rating,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import { Search, LocationOn } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import useGeolocation from '../hooks/useGeolocation';
import { getCurrentLocationName, formatDistance } from '../utils/locationUtils';
import dealershipService from '../services/dealershipService';
import { Dealership, SearchParams } from '../types/dealership';
import DealerDetailsDialog from '../components/dealership/DealerDetailsDialog';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const [topRatedDealerships, setTopRatedDealerships] = useState<Dealership[]>([]);
  const [loadingTopRated, setLoadingTopRated] = useState(false);
  const [topRatedError, setTopRatedError] = useState<string | null>(null);
  const { position, loading, error } = useGeolocation();
  
  // Dialog state management
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogDealership, setDialogDealership] = useState<Dealership | null>(null);
  
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

  // Fetch top rated dealerships when search value changes
  useEffect(() => {
    if (searchValue && !loading) {
      fetchTopRatedDealerships(searchValue);
    }
  }, [searchValue, loading]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/dealerships?location=${encodeURIComponent(searchValue)}&radius=10`);
  };

  // Dialog event handlers
  const handleDealershipClick = (dealership: Dealership) => {
    setDialogDealership(dealership);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setDialogDealership(null);
  };

  // Fetch top rated dealerships based on user location
  const fetchTopRatedDealerships = async (location: string) => {
    setLoadingTopRated(true);
    setTopRatedError(null);
    
    try {
      const params: SearchParams = {
        location: location,
        radius: 10
      };
      
      const response = await dealershipService.searchDealerships(params);
      
      // Filter dealerships with ratings and limit to 6
      const dealershipsWithRatings = response.dealerships
        .filter(dealership => dealership.averageRating && dealership.averageRating > 0)
        .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
        .slice(0, 6);
      
      setTopRatedDealerships(dealershipsWithRatings);
    } catch (error) {
      console.error('Error fetching top rated dealerships:', error);
      setTopRatedError('Failed to load top rated dealerships');
    } finally {
      setLoadingTopRated(false);
    }
  };


  return (
    <>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #dc2626 85%, #eab308 100%)', // Added yellow accent at the end
          color: 'white',
          py: 8,
          textAlign: 'center'
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h1" component="h1" gutterBottom>
            Inaabuso tayo ng mga dealership! Ibalik ang kapangyarihan sa konsumer!
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
          
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 6 }}>
        {/* Top Rated Dealerships Section */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h2" component="h2" gutterBottom align="center">
            Top Rated Dealerships
          </Typography>
          <Typography variant="body1" align="center" sx={{ mb: 4, color: 'text.secondary' }}>
            Discover the highest-rated dealerships near {searchValue || 'you'}
          </Typography>
          
          {loadingTopRated && (
            <Box display="flex" justifyContent="center" sx={{ py: 4 }}>
              <CircularProgress />
            </Box>
          )}
          
          {topRatedError && (
            <Alert severity="error" sx={{ mb: 4 }}>
              {topRatedError}
            </Alert>
          )}
          
          <Grid container spacing={3}>
            {topRatedDealerships.map((dealership) => (
              <Grid item xs={12} md={4} key={dealership.id}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    cursor: 'pointer',
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'translateY(-2px)',
                      transition: 'all 0.3s ease-in-out',
                    }
                  }}
                  onClick={() => handleDealershipClick(dealership)}
                >
                  <CardMedia
                    component="img"
                    height="160"
                    image={dealership.photos?.[0] || '/assets/default-dealership.jpg'}
                    alt={dealership.name}
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="h3" gutterBottom>
                      {dealership.name}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Rating 
                        value={dealership.averageRating || 0} 
                        readOnly 
                        size="small" 
                        precision={0.1}
                      />
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        {dealership.averageRating ? dealership.averageRating.toFixed(1) : 'No rating'}
                      </Typography>
                      <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                        ({dealership.reviewCount || 0} review{dealership.reviewCount !== 1 ? 's' : ''})
                      </Typography>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {dealership.address}
                    </Typography>
                    
                    {dealership.distance && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {formatDistance(dealership.distance)} away
                      </Typography>
                    )}
                    
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 'auto' }}>
                      {dealership.brands.slice(0, 2).map((brand, index) => (
                        <Chip
                          key={brand}
                          label={brand}
                          size="small"
                          color={index === 0 ? "secondary" : "primary"} // First brand gets yellow accent
                          variant="outlined"
                        />
                      ))}
                      {dealership.brands.length > 2 && (
                        <Chip
                          label={`+${dealership.brands.length - 2} more`}
                          size="small"
                          color="secondary"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

      </Container>

      {/* Review Dialog */}
      <DealerDetailsDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        dealership={dialogDealership}
      />
    </>
  );
};

export default HomePage;