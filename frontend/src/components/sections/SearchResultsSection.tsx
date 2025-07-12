import React from 'react';
import { Paper, Typography } from '@mui/material';
import SearchResults from '../search/SearchResults';
import { Dealership, SearchResponse } from '../../types/dealership';
import { SortOption } from '../search/SortControls';

interface SearchResultsSectionProps {
  searchResults: SearchResponse | null;
  selectedDealership: Dealership | null;
  onDealershipSelect: (dealership: Dealership) => void;
  onDealershipClick?: (dealership: Dealership) => void;
  loading: boolean;
  error: string | null;
  onLoadMore: () => void;
  hasNextPage: boolean;
  sortBy: SortOption;
  onSortChange: (sortBy: SortOption) => void;
}

const SearchResultsSection: React.FC<SearchResultsSectionProps> = ({
  searchResults,
  selectedDealership,
  onDealershipSelect,
  onDealershipClick,
  loading,
  error,
  onLoadMore,
  hasNextPage,
  sortBy,
  onSortChange,
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
        {...(onDealershipClick && { onDealershipClick })}
        onLoadMore={onLoadMore}
        hasNextPage={hasNextPage}
        sortBy={sortBy}
        onSortChange={onSortChange}
      />
    </Paper>
  );
};

export default SearchResultsSection;
