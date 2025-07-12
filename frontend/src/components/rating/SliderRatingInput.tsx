import React from 'react';
import { 
  Box, 
  Typography, 
  Slider, 
  FormControl, 
  FormHelperText,
  Rating 
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';

interface SliderRatingInputProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  label?: string;
  error?: string;
  required?: boolean;
  showStars?: boolean;
}

const ratingLabels: { [index: string]: string } = {
  1: 'Poor',
  2: 'Fair', 
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
};

const sliderMarks = [
  { value: 1, label: 'Poor' },
  { value: 2, label: 'Fair' },
  { value: 3, label: 'Good' },
  { value: 4, label: 'Very Good' },
  { value: 5, label: 'Excellent' },
];

const SliderRatingInput: React.FC<SliderRatingInputProps> = ({
  value,
  onChange,
  disabled = false,
  label = 'Overall Rating',
  error,
  required = false,
  showStars = true
}) => {
  const handleSliderChange = (_: Event, newValue: number | number[]) => {
    if (typeof newValue === 'number') {
      onChange(newValue);
    }
  };

  const formatValueLabel = (value: number) => {
    return `${value} - ${ratingLabels[value]}`;
  };

  return (
    <FormControl error={!!error} sx={{ width: '100%' }}>
      <Box sx={{ px: 2 }}>
        <Typography variant="h6" component="legend" sx={{ mb: 3, textAlign: 'center' }}>
          {label} {required && '*'}
        </Typography>
        
        {showStars && value > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Rating
              value={value}
              readOnly
              size="large"
              icon={<StarIcon fontSize="inherit" />}
              sx={{
                fontSize: '2rem',
                '& .MuiRating-iconFilled': {
                  color: '#ffa726',
                }
              }}
            />
          </Box>
        )}
        
        <Box sx={{ px: 1, mb: 2 }}>
          <Slider
            value={value || 1}
            onChange={handleSliderChange}
            disabled={disabled}
            min={1}
            max={5}
            step={1}
            marks={sliderMarks}
            valueLabelDisplay="auto"
            valueLabelFormat={formatValueLabel}
            track="inverted"
            sx={{
              height: 8,
              '& .MuiSlider-track': {
                background: 'linear-gradient(90deg, #f44336 0%, #ff9800 25%, #ffc107 50%, #8bc34a 75%, #4caf50 100%)',
                border: 'none',
              },
              '& .MuiSlider-rail': {
                backgroundColor: '#e0e0e0',
                height: 8,
              },
              '& .MuiSlider-thumb': {
                height: 24,
                width: 24,
                backgroundColor: '#fff',
                border: '2px solid currentColor',
                '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
                  boxShadow: 'inherit',
                },
                '&:before': {
                  display: 'none',
                },
              },
              '& .MuiSlider-mark': {
                backgroundColor: '#bfbfbf',
                height: 8,
                width: 2,
                '&.MuiSlider-markActive': {
                  opacity: 1,
                  backgroundColor: 'currentColor',
                },
              },
              '& .MuiSlider-markLabel': {
                fontSize: '0.875rem',
                color: 'text.secondary',
                fontWeight: 500,
              },
              '& .MuiSlider-valueLabel': {
                fontSize: '0.875rem',
                fontWeight: 600,
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
              }
            }}
            aria-label={`${label} slider`}
            aria-describedby={error ? 'slider-error' : undefined}
            aria-valuetext={value > 0 ? formatValueLabel(value) : 'No rating selected'}
          />
        </Box>
        
        {value > 0 && (
          <Typography 
            variant="h6" 
            color="primary"
            sx={{ 
              textAlign: 'center',
              fontWeight: 600,
              mt: 1
            }}
          >
            {ratingLabels[value]}
          </Typography>
        )}
      </Box>
      
      {error && (
        <FormHelperText id="slider-error" sx={{ textAlign: 'center', mt: 1 }}>
          {error}
        </FormHelperText>
      )}
    </FormControl>
  );
};

export default SliderRatingInput;