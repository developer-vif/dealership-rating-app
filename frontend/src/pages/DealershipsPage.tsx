import React, { useState, useEffect, useCallback } from 'react';
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
  // Search and results state
  const [dealerships, setDealerships] = useState<Dealership[]>([]);
  const [currentSearchParams, setCurrentSearchParams] = useState<SearchParams | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null | undefined>(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDealership, setSelectedDealership] = useState<Dealership | null>(null);
  const [currentLocation, setCurrentLocation] = useState('');
  const [mapCenter, setMapCenter] = useState({ lat: 14.5995, lng: 120.9842 }); // Default to Manila
  const [searchRadius, setSearchRadius] = useState(10);
  const [initialSearchPerformed, setInitialSearchPerformed] = useState(false);

  const [searchParams] = useSearchParams();
  const { position, error: geoError } = useGeolocation();

  const executeSearch = useCallback(async (params: SearchParams, isLoadMore = false) => {
    setLoading(true);
    if (!isLoadMore) {
      setError(null);
    }

    try {
      let results: SearchResponse;
      if (params.latitude && params.longitude) {
        results = await dealershipService.searchDealershipsByLocation(
          params.latitude,
          params.longitude,
          params
        );
      } else {
        results = await dealershipService.searchDealerships(params);
      }

      setDealerships(prev => isLoadMore ? [...prev, ...results.dealerships] : results.dealerships);
      setNextPageToken(results.nextPageToken);

      // Update map center on the first page of results
      if (!isLoadMore && results.dealerships.length > 0) {
        const firstResult = results.dealerships[0];
        setMapCenter({ lat: firstResult.latitude, lng: firstResult.longitude });
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while searching';
      setError(errorMessage);
      if (!isLoadMore) {
        setDealerships([]);
        setNextPageToken(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback(async (inputParams: SearchParams) => {
    if (!inputParams.location?.trim() && !(inputParams.latitude && inputParams.longitude)) {
      setError('Please provide a location or coordinates to search');
      return;
    }

    const params: SearchParams = {
      ...inputParams,
      brand: inputParams.brand === 'All Brands' ? undefined : inputParams.brand,
    };

    setCurrentSearchParams(params);
    setSearchRadius(params.radius || 10);
    setSelectedDealership(null);
    executeSearch(params, false);
  }, [executeSearch]);

  const handleLoadMore = useCallback(() => {
    if (!loading && nextPageToken && currentSearchParams) {
      const nextParams = { ...currentSearchParams, pageToken: nextPageToken };
      executeSearch(nextParams, true);
    }
  }, [loading, nextPageToken, currentSearchParams, executeSearch]);

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
    setMapCenter({
      lat: dealership.latitude,
      lng: dealership.longitude,
    });
  };

  const hasResults = dealerships.length > 0;
  
  const searchResultsForChildren: SearchResponse | null = hasResults
    ? { 
        dealerships, 
        ...(nextPageToken && { nextPageToken }) 
      }
    : null;

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
                searchResults={searchResultsForChildren}
                mapCenter={mapCenter}
                searchRadius={searchRadius}
                selectedDealership={selectedDealership}
                onDealershipSelect={handleDealershipSelect}
                loading={loading}
              />

              {/* Search Results Section */}
              <SearchResultsSection
                searchResults={searchResultsForChildren}
                selectedDealership={selectedDealership}
                onDealershipSelect={handleDealershipSelect}
                loading={loading}
                error={error}
                onLoadMore={handleLoadMore}
                hasNextPage={!!nextPageToken}
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
