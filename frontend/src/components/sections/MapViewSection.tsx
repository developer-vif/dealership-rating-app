import React from 'react';
import { Paper, Typography } from '@mui/material';
import DealershipMap from '../maps/DealershipMap';
import { Dealership, SearchResponse } from '../../types/dealership';

interface MapViewSectionProps {
  searchResults: SearchResponse | null;
  mapCenter: {
    lat: number;
    lng: number;
  };
  searchRadius: number;
  selectedDealership: Dealership | null;
  onDealershipSelect: (dealership: Dealership) => void;
  loading?: boolean;
}

const MapViewSection: React.FC<MapViewSectionProps> = ({
  searchResults,
  mapCenter,
  searchRadius,
  selectedDealership,
  onDealershipSelect,
  loading = false,
}) => {
  const hasResults = searchResults && searchResults.dealerships.length > 0;
  
  console.log('🗺️ MapViewSection render:', {
    loading,
    hasResults,
    dealershipsCount: searchResults?.dealerships?.length || 0,
    mapCenter
  });

  if (loading) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Map View
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Loading map...
        </Typography>
      </Paper>
    );
  }

  if (!hasResults) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Map View
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No dealerships to display on map
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Map View ({searchResults.dealerships.length} dealerships)
      </Typography>
      <DealershipMap
        dealerships={searchResults.dealerships}
        center={mapCenter}
        radius={searchRadius}
        onDealershipSelect={onDealershipSelect}
        selectedDealership={selectedDealership}
        showRadius={true}
        height="500px"
        zoom={12}
      />
    </Paper>
  );
};

export default MapViewSection;