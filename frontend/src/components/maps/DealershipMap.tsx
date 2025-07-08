import React, { useState, useCallback, useRef } from 'react';
import {
  GoogleMap,
  LoadScript,
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
  const mapRef = useRef<google.maps.Map | null>(null);

  const googleMapsApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  const mapContainerStyleDynamic = {
    ...mapContainerStyle,
    height,
  };

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    setMapLoaded(true);
  }, []);

  const onMapUnmount = useCallback(() => {
    mapRef.current = null;
    setMapLoaded(false);
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

  // Custom marker icon for dealerships
  const dealershipIcon = {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
      <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C24.837 0 32 7.163 32 16C32 24.837 16 40 16 40S0 24.837 0 16C0 7.163 7.163 0 16 0Z" fill="#1976d2"/>
        <circle cx="16" cy="16" r="10" fill="white"/>
        <text x="16" y="20" text-anchor="middle" fill="#1976d2" font-family="Arial" font-size="12" font-weight="bold">🚗</text>
      </svg>
    `),
    scaledSize: new google.maps.Size(32, 40),
    anchor: new google.maps.Point(16, 40),
  };

  // Current location marker icon
  const currentLocationIcon = {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
      <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="10" r="8" fill="#4285f4" stroke="white" stroke-width="3"/>
        <circle cx="10" cy="10" r="3" fill="white"/>
      </svg>
    `),
    scaledSize: new google.maps.Size(20, 20),
    anchor: new google.maps.Point(10, 10),
  };

  if (!googleMapsApiKey) {
    return (
      <Box
        sx={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'grey.100',
          borderRadius: 1,
        }}
      >
        <Typography color="error">
          Google Maps API key is not configured
        </Typography>
      </Box>
    );
  }

  return (
    <LoadScript googleMapsApiKey={googleMapsApiKey} libraries={['places']}>
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
          icon={currentLocationIcon}
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

        {/* Dealership markers */}
        {dealerships.map((dealership) => (
          <Marker
            key={dealership.id}
            position={{
              lat: dealership.latitude,
              lng: dealership.longitude,
            }}
            icon={dealershipIcon}
            title={dealership.name}
            onClick={() => handleMarkerClick(dealership)}
          />
        ))}

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
    </LoadScript>
  );
};

export default DealershipMap;