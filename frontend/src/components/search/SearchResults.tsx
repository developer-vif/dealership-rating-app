import React from 'react';
import {
  Box,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
} from '@mui/material';
import { Dealership, SearchResponse } from '../../types/dealership';
import DealershipCard from '../dealership/DealershipCard';

interface SearchResultsProps {
  results: SearchResponse | null;
  loading: boolean;
  error: string | null;
  onDealershipSelect?: (dealership: Dealership) => void;
  selectedDealership?: Dealership | null;
  onPageChange?: (page: number) => void;
  onSortChange?: (sortBy: string) => void;
  sortBy?: string;
}

const sortOptions = [
  { value: 'distance', label: 'Distance' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'reviews', label: 'Most Reviews' },
  { value: 'name', label: 'Name (A-Z)' },
];

const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  loading,
  error,
  onDealershipSelect,
  selectedDealership,
  onPageChange,
  onSortChange,
  sortBy = 'distance',
}) => {
  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    if (onPageChange) {
      onPageChange(page);
    }
  };

  const handleSortChange = (event: any) => {
    if (onSortChange) {
      onSortChange(event.target.value);
    }
  };

  if (loading) {
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

  if (!results || results.dealerships.length === 0) {
    return (
      <Alert severity="info" sx={{ my: 2 }}>
        <Typography variant="h6" gutterBottom>
          No dealerships found
        </Typography>
        Try expanding your search radius or removing some filters.
      </Alert>
    );
  }

  const { dealerships, pagination } = results;

  return (
    <Box>
      {/* Results Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Typography variant="h6">
          {pagination.total} dealership{pagination.total !== 1 ? 's' : ''} found
        </Typography>

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Sort by</InputLabel>
          <Select
            value={sortBy}
            onChange={handleSortChange}
            label="Sort by"
          >
            {sortOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Dealership Cards Grid */}
      <Grid container spacing={3}>
        {dealerships.map((dealership) => (
          <Grid item xs={12} sm={6} lg={4} key={dealership.id}>
            <DealershipCard
              dealership={dealership}
              onClick={() => onDealershipSelect?.(dealership)}
              selected={selectedDealership?.id === dealership.id}
            />
          </Grid>
        ))}
      </Grid>

      {/* Pagination */}
      {pagination.total > pagination.limit && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mt: 4,
          }}
        >
          <Pagination
            count={Math.ceil(pagination.total / pagination.limit)}
            page={pagination.page}
            onChange={handlePageChange}
            color="primary"
            size="large"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* Results Summary */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Showing {dealerships.length} of {pagination.total} results
          {pagination.page > 1 && ` (Page ${pagination.page})`}
        </Typography>
      </Box>
    </Box>
  );
};

export default SearchResults;