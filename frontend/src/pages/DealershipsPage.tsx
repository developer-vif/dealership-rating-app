import React, { useState, useEffect, useCallback, startTransition } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Alert,
} from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import SearchForm from '../components/search/SearchForm';
import MapViewSection from '../components/sections/MapViewSection';
import SearchResultsSection from '../components/sections/SearchResultsSection';
import useGeolocation from '../hooks/useGeolocation';
import dealershipService from '../services/dealershipService';
import { getCurrentLocationName } from '../utils/locationUtils';
import { Dealership, SearchParams, SearchResponse } from '../types/dealership';


const DealershipsPage: React.FC = () => {
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDealership, setSelectedDealership] = useState<Dealership | null>(null);
  const [currentLocation, setCurrentLocation] = useState('');
  const [mapCenter, setMapCenter] = useState({ lat: 14.5995, lng: 120.9842 }); // Default to Manila
  const [searchRadius, setSearchRadius] = useState(10);
  const [initialSearchPerformed, setInitialSearchPerformed] = useState(false);

  const [searchParams] = useSearchParams();
  const { position, error: geoError } = useGeolocation();

  const handleSearch = useCallback(async (inputParams: SearchParams) => {
    // Validate input - require either location string or coordinates (same as SearchForm logic)
    if (!inputParams.location?.trim() && !(inputParams.latitude && inputParams.longitude)) {
      setError('Please provide a location or coordinates to search');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Normalize parameters similar to SearchForm logic
      const searchParams: SearchParams = {
        radius: inputParams.radius || 10,
        brand: inputParams.brand === 'All Brands' ? undefined : inputParams.brand,
        page: inputParams.page || 1,
        limit: inputParams.limit || 10,
      };

      // Prioritize location string over coordinates (same as SearchForm)
      if (inputParams.location?.trim()) {
        searchParams.location = inputParams.location.trim();
      } else if (inputParams.latitude && inputParams.longitude) {
        searchParams.latitude = inputParams.latitude;
        searchParams.longitude = inputParams.longitude;
      }

      let results: SearchResponse;
      
      if (searchParams.latitude && searchParams.longitude) {
        // Search by coordinates
        results = await dealershipService.searchDealershipsByLocation(
          searchParams.latitude,
          searchParams.longitude,
          {
            radius: searchParams.radius,
            brand: searchParams.brand,
            page: searchParams.page,
            limit: searchParams.limit,
          }
        );
        
        setMapCenter({
          lat: searchParams.latitude,
          lng: searchParams.longitude,
        });
      } else {
        // Search by location string
        results = await dealershipService.searchDealerships(searchParams);
        
        // Calculate map center from search results
        if (results.dealerships.length > 0) {
          const dealershipsForCenter = results.dealerships.slice(0, 5);
          const avgLat = dealershipsForCenter.reduce((sum, d) => sum + d.latitude, 0) / dealershipsForCenter.length;
          const avgLng = dealershipsForCenter.reduce((sum, d) => sum + d.longitude, 0) / dealershipsForCenter.length;
          
          // Update map center for location-based searches
          setMapCenter({
            lat: avgLat,
            lng: avgLng,
          });
        }
      }
      
      // Update search results after map center is set
      setSearchResults(results);
      setSearchRadius(searchParams.radius);
      setSelectedDealership(null);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while searching';
      setError(errorMessage);
      setSearchResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle URL parameters for initial search
  useEffect(() => {
    const locationParam = searchParams.get('location');
    const radiusParam = searchParams.get('radius');
    if (locationParam && !initialSearchPerformed) {
      const urlSearchParams = { 
        location: locationParam,
        radius: radiusParam ? parseInt(radiusParam) : 10
      };
      setCurrentLocation(locationParam);
      handleSearch(urlSearchParams);
      setInitialSearchPerformed(true);
    }
  }, [searchParams, initialSearchPerformed, handleSearch]);

  // Update map center and current location when geolocation is available
  useEffect(() => {
    const updateLocation = async () => {
      if (position && !currentLocation) {
        setMapCenter({
          lat: position.latitude,
          lng: position.longitude,
        });

        try {
          const locationName = await getCurrentLocationName(
            position.latitude,
            position.longitude
          );
          setCurrentLocation(locationName);
        } catch (error) {
          console.error('Error getting location name:', error);
          setCurrentLocation('Philippines'); // Fallback
        }
      }
    };

    updateLocation();
  }, [position, currentLocation]);

  const handleDealershipSelect = (dealership: Dealership) => {
    setSelectedDealership(dealership);
    
    // Update map center to selected dealership
    setMapCenter({
      lat: dealership.latitude,
      lng: dealership.longitude,
    });
  };

  const hasResults = searchResults && searchResults.dealerships.length > 0;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h1" component="h1" gutterBottom>
        Find Dealerships
      </Typography>
      
      <Typography variant="subtitle1" color="text.secondary" gutterBottom sx={{ mb: 4 }}>
        Search for car dealerships near you, view them on a map, and read reviews
      </Typography>

      <Grid container spacing={4}>
        {/* Search Form */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ position: 'sticky', top: 24 }}>
            <SearchForm
              onSearch={handleSearch}
              loading={loading}
              initialLocation={currentLocation}
              currentPosition={position}
            />
            
            {geoError && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Location access denied. You can still search by entering a location manually.
              </Alert>
            )}
          </Box>
        </Grid>

        {/* Results */}
        <Grid item xs={12} lg={8}>
          {hasResults ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Map View Section */}
              <MapViewSection
                searchResults={searchResults}
                mapCenter={mapCenter}
                searchRadius={searchRadius}
                selectedDealership={selectedDealership}
                onDealershipSelect={handleDealershipSelect}
                loading={loading}
              />

              {/* Search Results Section */}
              <SearchResultsSection
                searchResults={searchResults}
                selectedDealership={selectedDealership}
                onDealershipSelect={handleDealershipSelect}
                loading={loading}
                error={error}
              />
            </Box>
          ) : (
            <>
              {/* Show loading, error, or empty state */}
              {loading && (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="h6" gutterBottom>
                    Searching for dealerships...
                  </Typography>
                </Paper>
              )}
              
              {error && (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="h6" gutterBottom color="error">
                    Search Error
                  </Typography>
                  <Typography color="text.secondary">
                    {error}
                  </Typography>
                </Paper>
              )}
              
              {!loading && !error && (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="h6" gutterBottom>
                    Ready to find dealerships?
                  </Typography>
                  <Typography color="text.secondary">
                    Enter your location or use your current location to start searching for nearby dealerships.
                  </Typography>
                </Paper>
              )}
            </>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default DealershipsPage;
