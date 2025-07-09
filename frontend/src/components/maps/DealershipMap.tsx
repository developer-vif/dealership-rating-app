import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  GoogleMap,
  Marker,
  InfoWindow,
  Circle,
} from '@react-google-maps/api';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Rating,
  Button,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Language as WebsiteIcon,
  Directions as DirectionsIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { Dealership } from '../../types/dealership';

interface DealershipMapProps {
  dealerships: Dealership[];
  center: {
    lat: number;
    lng: number;
  };
  radius?: number;
  onDealershipSelect?: (dealership: Dealership) => void;
  selectedDealership?: Dealership | null;
  showRadius?: boolean;
  height?: string;
  zoom?: number;
}

const mapContainerStyle = {
  width: '100%',
  height: '500px',
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
};

const DealershipMap: React.FC<DealershipMapProps> = ({
  dealerships,
  center,
  radius = 10,
  onDealershipSelect,
  showRadius = true,
  height = '500px',
  zoom = 12,
}) => {
  const [selectedMarker, setSelectedMarker] = useState<Dealership | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [googleMapsReady, setGoogleMapsReady] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  const mapContainerStyleDynamic = {
    ...mapContainerStyle,
    height,
  };

  // Check if Google Maps API is fully ready (only once)
  useEffect(() => {
    const checkGoogleMapsReady = () => {
      if (typeof google !== 'undefined' && google.maps && google.maps.Marker) {
        setGoogleMapsReady(true);
        return true;
      }
      return false;
    };

    // Check immediately
    if (checkGoogleMapsReady()) return;

    // Only retry once with delay
    const timer = setTimeout(() => {
      checkGoogleMapsReady();
    }, 200);
    
    return () => clearTimeout(timer);
  }, []); // Empty dependency array - only run once

  // Removed excessive re-checking to reduce API calls

  // Create markers directly using Google Maps API (debounced)
  useEffect(() => {
    if (!mapLoaded || !googleMapsReady || !mapRef.current || dealerships.length === 0) {
      return;
    }

    // Debounce marker creation to prevent excessive API calls
    const timer = setTimeout(() => {
      console.log('🎯 Creating markers for', dealerships.length, 'dealerships');

      // Clear existing markers
      markersRef.current.forEach(marker => {
        if (marker.setMap) {
          marker.setMap(null);
        }
      });
      markersRef.current = [];

      // Create new markers
      dealerships.forEach((dealership) => {
        try {
          const marker = new google.maps.Marker({
            position: {
              lat: dealership.latitude,
              lng: dealership.longitude,
            },
            map: mapRef.current,
            title: dealership.name,
          });

          marker.addListener('click', () => {
            handleMarkerClick(dealership);
          });

          markersRef.current.push(marker);
        } catch (error) {
          console.error('❌ Failed to create marker for:', dealership.name, error);
        }
      });

      console.log('✅ Created', markersRef.current.length, 'markers');
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [dealerships, mapLoaded, googleMapsReady]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    setMapLoaded(true);
    
    // Double-check Google Maps API is ready when map loads
    if (typeof google !== 'undefined' && google.maps && google.maps.Marker) {
      setGoogleMapsReady(true);
    } else {
      console.warn('⚠️ Map loaded but Google Maps API not ready');
    }
  }, []);

  const onMapUnmount = useCallback(() => {
    // Clean up markers
    markersRef.current.forEach(marker => {
      if (marker.setMap) {
        marker.setMap(null);
      }
    });
    markersRef.current = [];
    
    mapRef.current = null;
    setMapLoaded(false);
    setGoogleMapsReady(false);
  }, []);

  const handleMarkerClick = (dealership: Dealership) => {
    setSelectedMarker(dealership);
    if (onDealershipSelect) {
      onDealershipSelect(dealership);
    }
  };

  const handleInfoWindowClose = () => {
    setSelectedMarker(null);
  };

  const handleGetDirections = (dealership: Dealership) => {
    const destination = `${dealership.latitude},${dealership.longitude}`;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    window.open(url, '_blank');
  };

  const handleCallDealership = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleVisitWebsite = (website: string) => {
    const url = website.startsWith('http') ? website : `https://${website}`;
    window.open(url, '_blank');
  };


  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyleDynamic}
      center={center}
      zoom={zoom}
      options={mapOptions}
      onLoad={onMapLoad}
      onUnmount={onMapUnmount}
    >
        {/* Current location marker */}
        <Marker
          position={center}
          title="Your Location"
        />

        {/* Search radius circle */}
        {showRadius && mapLoaded && (
          <Circle
            center={center}
            radius={radius * 1000} // Convert km to meters
            options={{
              fillColor: '#1976d2',
              fillOpacity: 0.1,
              strokeColor: '#1976d2',
              strokeOpacity: 0.3,
              strokeWeight: 2,
            }}
          />
        )}

        {/* Dealership markers - rendered using native Google Maps API */}

        {/* Info window for selected marker */}
        {selectedMarker && (
          <InfoWindow
            position={{
              lat: selectedMarker.latitude,
              lng: selectedMarker.longitude,
            }}
            onCloseClick={handleInfoWindowClose}
          >
            <Card sx={{ minWidth: 300, maxWidth: 400 }}>
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 2,
                  }}
                >
                  <Typography variant="h6" component="h3">
                    {selectedMarker.name}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={handleInfoWindowClose}
                    sx={{ mt: -1, mr: -1 }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  gutterBottom
                >
                  {selectedMarker.address}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Rating
                    value={selectedMarker.googleRating}
                    precision={0.1}
                    readOnly
                    size="small"
                  />
                  <Typography variant="body2" sx={{ ml: 1 }}>
                    {selectedMarker.googleRating} ({selectedMarker.googleReviewCount} reviews)
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  {selectedMarker.brands.map((brand) => (
                    <Chip key={brand} label={brand} size="small" />
                  ))}
                </Box>

                {selectedMarker.distance && (
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {selectedMarker.distance}km away
                  </Typography>
                )}

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    size="small"
                    startIcon={<DirectionsIcon />}
                    onClick={() => handleGetDirections(selectedMarker)}
                    variant="outlined"
                  >
                    Directions
                  </Button>
                  
                  {selectedMarker.phone && (
                    <Button
                      size="small"
                      startIcon={<PhoneIcon />}
                      onClick={() => handleCallDealership(selectedMarker.phone)}
                      variant="outlined"
                    >
                      Call
                    </Button>
                  )}
                  
                  {selectedMarker.website && (
                    <Button
                      size="small"
                      startIcon={<WebsiteIcon />}
                      onClick={() => handleVisitWebsite(selectedMarker.website!)}
                      variant="outlined"
                    >
                      Website
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          </InfoWindow>
        )}
    </GoogleMap>
  );
};

export default DealershipMap;