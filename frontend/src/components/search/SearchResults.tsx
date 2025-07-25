import React, { useMemo } from 'react';
import {
  Box,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Divider,
} from '@mui/material';
import { Dealership } from '../../types/dealership';
import DealershipCard from '../dealership/DealershipCard';
import SortControls, { SortOption } from './SortControls';
import { sortDealerships } from '../../utils/sortingUtils';

interface SearchResultsProps {
  dealerships: Dealership[];
  loading: boolean;
  error: string | null;
  hasNextPage: boolean;
  onLoadMore: () => void;
  onDealershipSelect?: (dealership: Dealership) => void;
  onDealershipClick?: (dealership: Dealership) => void;
  selectedDealership?: Dealership | null;
  sortBy: SortOption;
  onSortChange: (sortBy: SortOption) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  dealerships,
  loading,
  error,
  hasNextPage,
  onLoadMore,
  onDealershipSelect,
  onDealershipClick,
  selectedDealership,
  sortBy,
  onSortChange,
}) => {
  // Apply sorting to dealerships using useMemo for performance
  const sortedDealerships = useMemo(() => {
    return sortDealerships(dealerships, sortBy);
  }, [dealerships, sortBy]);

  if (loading && dealerships.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 8,
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Searching for dealerships...
        </Typography>
        <Typography variant="body2" color="text.secondary">
          This may take a few seconds
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        <Typography variant="h6" gutterBottom>
          Search Error
        </Typography>
        {error}
      </Alert>
    );
  }

  if (dealerships.length === 0) {
    return (
      <Alert severity="info" sx={{ my: 2 }}>
        <Typography variant="h6" gutterBottom>
          No dealerships found
        </Typography>
        Try expanding your search radius or changing your search location.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Search Results
      </Typography>

      {/* Sort Controls */}
      <SortControls
        sortBy={sortBy}
        onSortChange={onSortChange}
        totalResults={dealerships.length}
      />

      <Divider sx={{ mb: 3 }} />

      {/* Dealership Cards Grid */}
      <Grid container spacing={3}>
        {sortedDealerships.map((dealership, index) => (
          <Grid item xs={12} sm={6} lg={4} key={`${dealership.id}-${index}`}>
            <DealershipCard
              dealership={dealership}
              onClick={() => {
                // Handle map selection (hover effect)
                onDealershipSelect?.(dealership);
                // Handle dialog opening (click effect)
                onDealershipClick?.(dealership);
              }}
              selected={selectedDealership?.id === dealership.id}
            />
          </Grid>
        ))}
      </Grid>

      {/* Load More Button */}
      {hasNextPage && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Button 
            variant="contained" 
            onClick={onLoadMore} 
            disabled={loading}
            size="large"
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Load More'}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default SearchResults;
