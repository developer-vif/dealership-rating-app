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
  // Cache state
  const [cachedDealerships, setCachedDealerships] = useState<Dealership[]>([]);
  
  // UI state
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDealership, setSelectedDealership] = useState<Dealership | null>(null);
  const [currentLocation, setCurrentLocation] = useState('');
  const [mapCenter, setMapCenter] = useState({ lat: 14.5995, lng: 120.9842 }); // Default to Manila
  const [searchRadius, setSearchRadius] = useState(10);
  const [initialSearchPerformed, setInitialSearchPerformed] = useState(false);
  
  // Local filtering/sorting state
  const [currentSortBy, setCurrentSortBy] = useState('distance');
  const [currentPageSize, setCurrentPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [searchParams] = useSearchParams();
  const { position, error: geoError } = useGeolocation();

  // Local sorting function
  const sortDealerships = useCallback((dealerships: Dealership[], sortBy: string): Dealership[] => {
    const sorted = [...dealerships];
    switch (sortBy) {
      case 'distance':
        return sorted.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      case 'rating':
        return sorted.sort((a, b) => (b.googleRating || 0) - (a.googleRating || 0));
      case 'reviews':
        return sorted.sort((a, b) => (b.googleReviewCount || 0) - (a.googleReviewCount || 0));
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return sorted;
    }
  }, []);

  // Local pagination function
  const paginateDealerships = useCallback((dealerships: Dealership[], page: number, pageSize: number) => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedDealerships = dealerships.slice(startIndex, endIndex);
    
    return {
      dealerships: paginatedDealerships,
      pagination: {
        page,
        limit: pageSize,
        total: dealerships.length,
        hasNext: endIndex < dealerships.length,
      },
    };
  }, []);

  // Update displayed results based on cached data
  const updateDisplayedResults = useCallback(() => {
    if (cachedDealerships.length === 0) {
      setSearchResults(null);
      return;
    }

    const sortedDealerships = sortDealerships(cachedDealerships, currentSortBy);
    const paginatedResults = paginateDealerships(sortedDealerships, currentPage, currentPageSize);
    
    setSearchResults(paginatedResults);
  }, [cachedDealerships, currentSortBy, currentPage, currentPageSize, sortDealerships, paginateDealerships]);

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
        page: 1, // Always start at page 1 for new searches
        limit: 100, // Always fetch all results for caching
        sortBy: 'distance', // Default sort for API call
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
            radius: searchParams.radius || 10,
            brand: searchParams.brand,
            page: 1,
            limit: 100,
            sortBy: 'distance',
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
      
      // Cache all results
      setCachedDealerships(results.dealerships);
      
      // Reset pagination and sorting state for new search
      setCurrentPage(1);
      setCurrentSortBy('distance');
      
      setSearchRadius(searchParams.radius || 10);
      setSelectedDealership(null);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while searching';
      setError(errorMessage);
      setSearchResults(null);
      setCachedDealerships([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update displayed results when cache or display settings change
  useEffect(() => {
    updateDisplayedResults();
  }, [updateDisplayedResults]);

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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Display will update automatically via useEffect
  };

  const handleSortChange = (sortBy: string) => {
    setCurrentSortBy(sortBy);
    setCurrentPage(1); // Reset to first page when sorting changes
    // Display will update automatically via useEffect
  };

  const handlePageSizeChange = (pageSize: number) => {
    setCurrentPageSize(pageSize);
    setCurrentPage(1); // Reset to first page when page size changes
    // Display will update automatically via useEffect
  };

  const hasResults = searchResults && searchResults.dealerships.length > 0;
  
  // Create map results with all cached dealerships (not paginated)
  const mapResults = cachedDealerships.length > 0 ? {
    dealerships: cachedDealerships,
    pagination: {
      page: 1,
      limit: cachedDealerships.length,
      total: cachedDealerships.length,
      hasNext: false,
    },
  } : null;

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
                searchResults={mapResults}
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
                onPageChange={handlePageChange}
                onSortChange={handleSortChange}
                onPageSizeChange={handlePageSizeChange}
                sortBy={currentSortBy}
                pageSize={currentPageSize}
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
