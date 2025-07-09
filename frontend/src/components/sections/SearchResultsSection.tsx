import React from 'react';
import { Paper, Typography } from '@mui/material';
import SearchResults from '../search/SearchResults';
import { Dealership, SearchResponse } from '../../types/dealership';

interface SearchResultsSectionProps {
  searchResults: SearchResponse | null;
  selectedDealership: Dealership | null;
  onDealershipSelect: (dealership: Dealership) => void;
  loading: boolean;
  error: string | null;
  onLoadMore: () => void;
  hasNextPage: boolean;
}

const SearchResultsSection: React.FC<SearchResultsSectionProps> = ({
  searchResults,
  selectedDealership,
  onDealershipSelect,
  loading,
  error,
  onLoadMore,
  hasNextPage,
}) => {
  return (
    <Paper sx={{ p: 3, backgroundColor: 'grey.50' }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Dealerships List
      </Typography>
      <SearchResults
        loading={loading}
        error={error}
        dealerships={searchResults?.dealerships || []}
        selectedDealership={selectedDealership}
        onDealershipSelect={onDealershipSelect}
        onLoadMore={onLoadMore}
        hasNextPage={hasNextPage}
      />
    </Paper>
  );
};

export default SearchResultsSection;
