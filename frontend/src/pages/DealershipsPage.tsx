import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Tabs,
  Tab,
  Alert,
  Fade,
} from '@mui/material';
import {
  ViewList as ListIcon,
  Map as MapIcon,
} from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
import SearchForm from '../components/search/SearchForm';
import SearchResults from '../components/search/SearchResults';
import DealershipMap from '../components/maps/DealershipMap';
import useGeolocation from '../hooks/useGeolocation';
import dealershipService from '../services/dealershipService';
import { getCurrentLocationName } from '../utils/locationUtils';
import { Dealership, SearchParams, SearchResponse } from '../types/dealership';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`view-tabpanel-${index}`}
      aria-labelledby={`view-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const DealershipsPage: React.FC = () => {
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDealership, setSelectedDealership] = useState<Dealership | null>(null);
  const [currentView, setCurrentView] = useState(0); // 0 = list, 1 = map
  const [currentLocation, setCurrentLocation] = useState('');
  const [mapCenter, setMapCenter] = useState({ lat: 34.0522, lng: -118.2437 }); // Default to LA
  const [searchRadius, setSearchRadius] = useState(10);
  const [initialSearchPerformed, setInitialSearchPerformed] = useState(false);

  const [searchParams] = useSearchParams();
  const { position, error: geoError } = useGeolocation();

  // Handle URL parameters for initial search
  useEffect(() => {
    const locationParam = searchParams.get('location');
    if (locationParam && !initialSearchPerformed) {
      setCurrentLocation(locationParam);
      handleSearch({ location: locationParam });
      setInitialSearchPerformed(true);
    }
  }, [searchParams, initialSearchPerformed]);

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

  const handleSearch = async (params: SearchParams) => {
    setLoading(true);
    setError(null);
    
    try {
      let results: SearchResponse;
      
      if (params.latitude && params.longitude) {
        // Search by coordinates
        results = await dealershipService.searchDealershipsByLocation(
          params.latitude,
          params.longitude,
          {
            radius: params.radius || 10,
            brand: params.brand,
            page: params.page || 1,
            limit: params.limit || 20,
          }
        );
        
        setMapCenter({
          lat: params.latitude,
          lng: params.longitude,
        });
      } else {
        // Search by location string
        results = await dealershipService.searchDealerships(params);
      }
      
      setSearchResults(results);
      setSearchRadius(params.radius || 10);
      
      // Clear selected dealership when new search is performed
      setSelectedDealership(null);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while searching');
      setSearchResults(null);
    } finally {
      setLoading(false);
    }
  };

  const handleViewChange = (_: React.SyntheticEvent, newValue: number) => {
    setCurrentView(newValue);
  };

  const handleDealershipSelect = (dealership: Dealership) => {
    setSelectedDealership(dealership);
    
    // Update map center to selected dealership
    setMapCenter({
      lat: dealership.latitude,
      lng: dealership.longitude,
    });
    
    // Switch to map view if not already there
    if (currentView === 0) {
      setCurrentView(1);
    }
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
          {hasResults && (
            <Paper sx={{ mb: 2 }}>
              <Tabs
                value={currentView}
                onChange={handleViewChange}
                aria-label="view tabs"
                sx={{ borderBottom: 1, borderColor: 'divider' }}
              >
                <Tab
                  icon={<ListIcon />}
                  label="List View"
                  id="view-tab-0"
                  aria-controls="view-tabpanel-0"
                />
                <Tab
                  icon={<MapIcon />}
                  label="Map View"
                  id="view-tab-1"
                  aria-controls="view-tabpanel-1"
                />
              </Tabs>
            </Paper>
          )}

          <TabPanel value={currentView} index={0}>
            <Fade in={currentView === 0}>
              <Box>
                <SearchResults
                  results={searchResults}
                  loading={loading}
                  error={error}
                  onDealershipSelect={handleDealershipSelect}
                  selectedDealership={selectedDealership}
                />
              </Box>
            </Fade>
          </TabPanel>

          <TabPanel value={currentView} index={1}>
            <Fade in={currentView === 1}>
              <Box>
                {hasResults ? (
                  <DealershipMap
                    dealerships={searchResults.dealerships}
                    center={mapCenter}
                    radius={searchRadius}
                    onDealershipSelect={handleDealershipSelect}
                    selectedDealership={selectedDealership}
                    showRadius={true}
                    height="600px"
                    zoom={12}
                  />
                ) : (
                  <Box
                    sx={{
                      height: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'grey.100',
                      borderRadius: 1,
                    }}
                  >
                    <Typography color="text.secondary">
                      Search for dealerships to view them on the map
                    </Typography>
                  </Box>
                )}
              </Box>
            </Fade>
          </TabPanel>

          {/* No search performed yet */}
          {!hasResults && !loading && !error && (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Ready to find dealerships?
              </Typography>
              <Typography color="text.secondary">
                Enter your location or use your current location to start searching for nearby dealerships.
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default DealershipsPage;
