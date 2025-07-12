import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Typography,
  Chip,
  Alert,
  AlertTitle,
  CircularProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  MyLocation as MyLocationIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import useGeolocation from '../../hooks/useGeolocation';
import { getCurrentLocationName } from '../../utils/locationUtils';
import { SearchParams } from '../../types/dealership';

interface SearchFormProps {
  onSearch: (params: SearchParams) => void;
  loading?: boolean;
  initialLocation?: string;
  currentPosition?: { latitude: number; longitude: number } | null;
}

const carBrands = [
  'All Brands',
  'Acura',
  'Aprilia',
  'Audi',
  'BMW',
  'Buick',
  'Cadillac',
  'CFMOTO',
  'Chevrolet',
  'Chrysler',
  'Dodge',
  'Ford',
  'GMC',
  'Harley Davidson',
  'Hero MotoCorp',
  'Honda',
  'Hyundai',
  'Infiniti',
  'Jeep',
  'Kawasaki',
  'Keeway',
  'Kia',
  'KTM',
  'Lexus',
  'Lincoln',
  'Mazda',
  'Mercedes-Benz',
  'Mitsubishi',
  'MotorStar',
  'Nissan',
  'Ram',
  'Skygo',
  'Subaru',
  'Suzuki',
  'SYM',
  'Tesla',
  'Toyota',
  'TVS',
  'Volkswagen',
  'Volvo',
  'Yamaha',
];

const SearchForm: React.FC<SearchFormProps> = ({
  onSearch,
  loading = false,
  initialLocation,
  currentPosition,
}) => {
  const [location, setLocation] = useState(initialLocation || '');
  const [brand, setBrand] = useState('All Brands');
  const [radius, setRadius] = useState(10);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  
  const locationInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  
  const {
    position,
    error: geoError,
    loading: geoLoading,
    getCurrentPosition,
    retry: retryGeolocation,
  } = useGeolocation();

  // Update location when initialLocation prop changes
  useEffect(() => {
    if (initialLocation) {
      setLocation(initialLocation);
    }
  }, [initialLocation]);

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
          setLocation(place.formatted_address);
          setLocationError(null);
        }
      });
    }

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, []);

  // Auto-populate location when geolocation is available (only if no initial location was provided)
  useEffect(() => {
    const updateLocationFromPosition = async () => {
      if (currentPosition && !location && !initialLocation) {
        setIsLoadingLocation(true);
        try {
          const locationName = await getCurrentLocationName(
            currentPosition.latitude,
            currentPosition.longitude
          );
          setLocation(locationName);
          setLocationError(null);
        } catch (error) {
          console.error('Error getting location name:', error);
          setLocationError('Failed to get current location name');
        } finally {
          setIsLoadingLocation(false);
        }
      }
    };

    updateLocationFromPosition();
  }, [currentPosition, location, initialLocation]);

  const handleUseCurrentLocation = async () => {
    if (currentPosition) {
      setIsLoadingLocation(true);
      try {
        const locationName = await getCurrentLocationName(
          currentPosition.latitude,
          currentPosition.longitude
        );
        setLocation(locationName);
        setLocationError(null);
      } catch (error) {
        console.error('Error getting location name:', error);
        setLocationError('Failed to get current location name');
      } finally {
        setIsLoadingLocation(false);
      }
    } else {
      setIsLoadingLocation(true);
      getCurrentPosition();
    }
  };

  // Effect to handle updating location when position changes after user requests it
  useEffect(() => {
    const updateLocationAfterUserRequest = async () => {
      if (position && isLoadingLocation && !currentPosition) {
        try {
          const locationName = await getCurrentLocationName(
            position.latitude,
            position.longitude
          );
          setLocation(locationName);
          setLocationError(null);
        } catch (error) {
          console.error('Error getting location name:', error);
          setLocationError('Failed to get current location name');
        } finally {
          setIsLoadingLocation(false);
        }
      }
    };

    updateLocationAfterUserRequest();
  }, [position, isLoadingLocation, currentPosition]);

  const handleClearLocation = () => {
    setLocation('');
    setLocationError(null);
  };

  const handleSearch = () => {
    if (!location.trim() && !currentPosition) {
      setLocationError('Please enter a location or use your current location');
      return;
    }

    const searchParams: SearchParams = {
      radius,
      brand: brand === 'All Brands' ? undefined : brand,
    };

    // If user has entered a location manually, use that instead of coordinates
    // This allows users to search for locations different from their current position
    if (location.trim()) {
      searchParams.location = location.trim();
    } else if (currentPosition) {
      searchParams.latitude = currentPosition.latitude;
      searchParams.longitude = currentPosition.longitude;
    }
    
    
    onSearch(searchParams);
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Box
      component="form"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        p: 3,
        backgroundColor: 'background.paper',
        borderRadius: 2,
        boxShadow: 2,
      }}
      onSubmit={(e) => {
        e.preventDefault();
        handleSearch();
      }}
    >
      <Typography variant="h6" component="h2">
        Find Dealerships Near You
      </Typography>

      {/* Location Input */}
      <TextField
        inputRef={locationInputRef}
        label="Location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Enter city, state or address"
        fullWidth
        error={!!locationError}
        helperText={locationError}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              {isLoadingLocation || geoLoading ? (
                <CircularProgress size={20} />
              ) : (
                <>
                  {location && (
                    <IconButton
                      onClick={handleClearLocation}
                      edge="end"
                      size="small"
                    >
                      <ClearIcon />
                    </IconButton>
                  )}
                  <IconButton
                    onClick={handleUseCurrentLocation}
                    edge="end"
                    title="Use current location"
                    color="primary"
                  >
                    <MyLocationIcon />
                  </IconButton>
                </>
              )}
            </InputAdornment>
          ),
        }}
      />

      {/* Geolocation Error */}
      {geoError && (
        <Alert 
          severity="warning" 
          sx={{ mt: 1 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={retryGeolocation}
            >
              Retry
            </Button>
          }
        >
          <AlertTitle>Location Access Issue</AlertTitle>
          {geoError.message}. You can still search by entering a location manually.
          <br />
          <strong>To fix this:</strong>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
            <li>Enable location services in your browser settings</li>
            <li>Check your internet connection</li>
            <li>Try refreshing the page</li>
          </ul>
        </Alert>
      )}

      {/* Search Radius */}
      <Box>
        <Typography gutterBottom>
          Search Radius: {radius} km
        </Typography>
        <Slider
          value={radius}
          onChange={(_, newValue) => {
            console.log('📏 Radius changed from', radius, 'to', newValue);
            console.log('⚠️ Note: Radius change does NOT trigger automatic search');
            setRadius(newValue as number);
          }}
          min={1}
          max={50}
          step={1}
          marks={[
            { value: 1, label: '1km' },
            { value: 5, label: '5km' },
            { value: 10, label: '10km' },
            { value: 25, label: '25km' },
            { value: 50, label: '50km' },
          ]}
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => `${value}km`}
        />
      </Box>

      {/* Brand Filter */}
      <FormControl fullWidth>
        <InputLabel>Car Brand</InputLabel>
        <Select
          value={brand}
          onChange={(e) => {
            console.log('🏷️ Brand changed from', brand, 'to', e.target.value);
            setBrand(e.target.value);
          }}
          label="Car Brand"
        >
          {carBrands.map((brandOption) => (
            <MenuItem key={brandOption} value={brandOption}>
              {brandOption}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Active Filters */}
      {(brand !== 'All Brands' || radius !== 10) && (
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Active Filters:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {brand !== 'All Brands' && (
              <Chip
                label={`Brand: ${brand}`}
                onDelete={() => setBrand('All Brands')}
                size="small"
                variant="outlined"
              />
            )}
            {radius !== 10 && (
              <Chip
                label={`Radius: ${radius}km`}
                onDelete={() => setRadius(10)}
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        </Box>
      )}

      {/* Search Button */}
      <Button
        type="submit"
        variant="contained"
        size="large"
        startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
        disabled={loading || !location.trim()}
        onClick={handleSearch}
        sx={{ py: 1.5 }}
      >
        {loading ? 'Searching...' : 'Search Dealerships'}
      </Button>
    </Box>
  );
};

export default SearchForm;
