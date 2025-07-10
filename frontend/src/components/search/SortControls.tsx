import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  SelectChangeEvent,
} from '@mui/material';

export type SortOption = 'distance' | 'rating';

interface SortControlsProps {
  sortBy: SortOption;
  onSortChange: (sortBy: SortOption) => void;
  totalResults: number;
}

const SortControls: React.FC<SortControlsProps> = ({
  sortBy,
  onSortChange,
  totalResults,
}) => {
  const handleSortChange = (event: SelectChangeEvent<SortOption>) => {
    onSortChange(event.target.value as SortOption);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3,
        flexWrap: 'wrap',
        gap: 2,
        p: 2,
        backgroundColor: 'grey.100',
        borderRadius: 1,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {totalResults} {totalResults === 1 ? 'dealership' : 'dealerships'} found
      </Typography>

      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel id="sort-by-label">Sort by</InputLabel>
        <Select
          labelId="sort-by-label"
          id="sort-by-select"
          value={sortBy}
          label="Sort by"
          onChange={handleSortChange}
        >
          <MenuItem value="distance">Distance (closest first)</MenuItem>
          <MenuItem value="rating">Rating (highest first)</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
};

export default SortControls;