import React from 'react';
import { Paper, Typography } from '@mui/material';
import SearchResults from '../search/SearchResults';
import { Dealership, SearchResponse } from '../../types/dealership';

interface SearchResultsSectionProps {
  searchResults: SearchResponse | null;
  selectedDealership: Dealership | null;
  onDealershipSelect: (dealership: Dealership) => void;
  loading?: boolean;
  error?: string | null;
  onPageChange?: (page: number) => void;
  onSortChange?: (sortBy: string) => void;
  onPageSizeChange?: (pageSize: number) => void;
  sortBy?: string;
  pageSize?: number;
}

const SearchResultsSection: React.FC<SearchResultsSectionProps> = ({
  searchResults,
  selectedDealership,
  onDealershipSelect,
  loading = false,
  error = null,
  onPageChange,
  onSortChange,
  onPageSizeChange,
  sortBy = 'distance',
  pageSize = 10,
}) => {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Search Results
        {searchResults && searchResults.dealerships.length > 0 && (
          <Typography component="span" variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>
            ({searchResults.pagination.total} dealerships found)
          </Typography>
        )}
      </Typography>
      <SearchResults
        results={searchResults}
        loading={loading}
        error={error}
        onDealershipSelect={onDealershipSelect}
        selectedDealership={selectedDealership}
        {...(onPageChange && { onPageChange })}
        {...(onSortChange && { onSortChange })}
        {...(onPageSizeChange && { onPageSizeChange })}
        sortBy={sortBy}
        pageSize={pageSize}
      />
    </Paper>
  );
};

export default SearchResultsSection;