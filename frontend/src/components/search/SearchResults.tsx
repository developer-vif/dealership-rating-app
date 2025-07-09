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
  onPageSizeChange?: (pageSize: number) => void;
  sortBy?: string;
  pageSize?: number;
}

const sortOptions = [
  { value: 'distance', label: 'Distance' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'reviews', label: 'Most Reviews' },
  { value: 'name', label: 'Name (A-Z)' },
];

const pageSizeOptions = [
  { value: 10, label: '10 per page' },
  { value: 20, label: '20 per page' },
  { value: 50, label: '50 per page' },
  { value: 100, label: '100 per page' },
];

const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  loading,
  error,
  onDealershipSelect,
  selectedDealership,
  onPageChange,
  onSortChange,
  onPageSizeChange,
  sortBy = 'distance',
  pageSize = 10,
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

  const handlePageSizeChange = (event: any) => {
    if (onPageSizeChange) {
      onPageSizeChange(Number(event.target.value));
    }
  };

  // Reusable pagination component
  const PaginationComponent = ({ showResultsInfo = true }: { showResultsInfo?: boolean }) => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
      }}
    >
      {/* Standard Pagination */}
      <Pagination
        count={Math.ceil(pagination.total / pagination.limit)}
        page={pagination.page}
        onChange={handlePageChange}
        color="primary"
        size="large"
        showFirstButton
        showLastButton
        siblingCount={1}
        boundaryCount={1}
      />
      
      {/* Results Info */}
      {showResultsInfo && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Showing {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
          </Typography>
        </Box>
      )}
    </Box>
  );

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

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
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

          {onPageSizeChange && (
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Show</InputLabel>
              <Select
                value={pageSize}
                onChange={handlePageSizeChange}
                label="Show"
              >
                {pageSizeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Top Pagination */}
      {pagination.total > pagination.limit && (
        <Box sx={{ mb: 3 }}>
          <PaginationComponent showResultsInfo={false} />
        </Box>
      )}

      {/* Dealership Cards Grid */}
      <Grid container spacing={3}>
        {dealerships.map((dealership, index) => (
          <Grid item xs={12} sm={6} lg={4} key={`${dealership.id}-${index}`}>
            <DealershipCard
              dealership={dealership}
              onClick={() => onDealershipSelect?.(dealership)}
              selected={selectedDealership?.id === dealership.id}
            />
          </Grid>
        ))}
      </Grid>

      {/* Bottom Pagination */}
      {pagination.total > pagination.limit && (
        <Box sx={{ mt: 4 }}>
          <PaginationComponent showResultsInfo={true} />
        </Box>
      )}

      {/* Results Summary for single page */}
      {pagination.total <= pagination.limit && (
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Showing all {pagination.total} results
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default SearchResults;