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
}

const carBrands = [
  'All Brands',
  'Acura',
  'Audi',
  'BMW',
  'Buick',
  'Cadillac',
  'Chevrolet',
  'Chrysler',
  'Dodge',
  'Ford',
  'GMC',
  'Honda',
  'Hyundai',
  'Infiniti',
  'Jeep',
  'Kia',
  'Lexus',
  'Lincoln',
  'Mazda',
  'Mercedes-Benz',
  'Mitsubishi',
  'Nissan',
  'Ram',
  'Subaru',
  'Tesla',
  'Toyota',
  'Volkswagen',
  'Volvo',
];

const SearchForm: React.FC<SearchFormProps> = ({
  onSearch,
  loading = false,
  initialLocation,
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
  } = useGeolocation();

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (locationInputRef.current && window.google) {
      autocompleteRef.current = new google.maps.places.Autocomplete(
        locationInputRef.current,
        {
          types: ['(cities)'],
          componentRestrictions: { country: 'us' },
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

  // Auto-populate location when geolocation is available
  useEffect(() => {
    const updateLocationFromPosition = async () => {
      if (position && !location) {
        setIsLoadingLocation(true);
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

    updateLocationFromPosition();
  }, [position, location]);

  const handleUseCurrentLocation = () => {
    getCurrentPosition();
  };

  const handleClearLocation = () => {
    setLocation('');
    setLocationError(null);
  };

  const handleSearch = () => {
    if (!location.trim()) {
      setLocationError('Please enter a location or use your current location');
      return;
    }

    const searchParams: SearchParams = {
      location: location.trim(),
      radius,
      brand: brand === 'All Brands' ? undefined : brand,
    };

    // If we have position coordinates, include them
    if (position) {
      searchParams.latitude = position.latitude;
      searchParams.longitude = position.longitude;
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
        <Alert severity="warning" sx={{ mt: 1 }}>
          {geoError.message}. You can still search by entering a location manually.
        </Alert>
      )}

      {/* Search Radius */}
      <Box>
        <Typography gutterBottom>
          Search Radius: {radius} km
        </Typography>
        <Slider
          value={radius}
          onChange={(_, newValue) => setRadius(newValue as number)}
          min={5}
          max={50}
          step={5}
          marks={[
            { value: 5, label: '5km' },
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
          onChange={(e) => setBrand(e.target.value)}
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