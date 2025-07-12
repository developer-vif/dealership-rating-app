import React from 'react';
import { 
  Box, 
  Typography, 
  Slider, 
  FormControl, 
  FormHelperText,
  Rating,
  Paper
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';

interface DualTimeSliderRatingProps {
  receiptTime: number;
  platesTime: number;
  onReceiptTimeChange: (value: number) => void;
  onPlatesTimeChange: (value: number) => void;
  disabled?: boolean;
  receiptError?: string | undefined;
  platesError?: string | undefined;
  showCalculatedRating?: boolean;
}

const sliderMarks = [
  { value: 0, label: '> 2 Months' },
  { value: 1, label: '< 2 Months' },
  { value: 2, label: '< 1 Month' },
  { value: 3, label: '< 2 Weeks' },
  { value: 4, label: '< 1 Week' },
];

const getTimeDescription = (score: number): string => {
  const descriptions = {
    0: '60+ days',
    1: '31-60 days',
    2: '15-30 days',
    3: '8-14 days',
    4: '1-7 days'
  };
  return descriptions[score as keyof typeof descriptions] || '';
};

const calculateRating = (receiptTime: number, platesTime: number): number => {
  const receiptScore = receiptTime;
  const platesScore = platesTime;
  
  // Convert 0-4 scale to 1-5 star rating (same logic as original)
  const averageScore = (receiptScore + platesScore) / 2;
  const starRating = Math.max(1, Math.round((averageScore / 4) * 4) + 1);
  
  return starRating;
};

const ratingDescriptions = {
  5: 'Excellent - Very Fast Processing',
  4: 'Good - Fast Processing',
  3: 'Average - Standard Processing',
  2: 'Below Average - Slow Processing',
  1: 'Poor - Very Slow Processing',
};

const DualTimeSliderRating: React.FC<DualTimeSliderRatingProps> = ({
  receiptTime,
  platesTime,
  onReceiptTimeChange,
  onPlatesTimeChange,
  disabled = false,
  receiptError,
  platesError,
  showCalculatedRating = true
}) => {
  const handleReceiptSliderChange = (_: Event, newValue: number | number[]) => {
    if (typeof newValue === 'number') {
      onReceiptTimeChange(newValue);
    }
  };

  const handlePlatesSliderChange = (_: Event, newValue: number | number[]) => {
    if (typeof newValue === 'number') {
      onPlatesTimeChange(newValue);
    }
  };

  const calculatedRating = calculateRating(receiptTime, platesTime);
  const formatValueLabel = (value: number) => {
    const mark = sliderMarks.find(m => m.value === value);
    return mark ? mark.label : '';
  };

  return (
    <FormControl sx={{ width: '100%' }}>
      <Box sx={{ mb: 4 }}>
        {/* Calculated Rating Display - Moved to Top */}
        {showCalculatedRating && (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              bgcolor: 'grey.50',
              borderRadius: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              mb: 4
            }}
          >
            <Typography variant="h6" fontWeight="bold" color="text.primary">
              Calculated Rating
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <Rating
                value={calculatedRating}
                readOnly
                size="large"
                icon={<StarIcon fontSize="inherit" />}
                sx={{
                  fontSize: '2.5rem',
                  '& .MuiRating-iconFilled': {
                    color: '#ffa726',
                  }
                }}
              />
              
              <Typography variant="h5" color="primary" fontWeight="bold">
                {calculatedRating}/5
              </Typography>
              
              <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center' }}>
                {ratingDescriptions[calculatedRating as keyof typeof ratingDescriptions]}
              </Typography>
              
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', mt: 1 }}>
                Based on average processing times for both receipt and plates
              </Typography>
            </Box>
          </Paper>
        )}

        {/* Receipt Processing Time Slider */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" component="legend" sx={{ mb: 2, textAlign: 'center' }}>
            Official Receipt & Certificate of Registration Release Time *
          </Typography>
          
          <Box sx={{ px: 2, mb: 2 }}>
            <Slider
              value={receiptTime}
              onChange={handleReceiptSliderChange}
              disabled={disabled}
              min={0}
              max={4}
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
                  fontSize: '0.75rem',
                  color: 'text.secondary',
                  fontWeight: 500,
                },
                '& .MuiSlider-valueLabel': {
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                }
              }}
              aria-label="Receipt processing time"
              aria-describedby={receiptError ? 'receipt-error' : undefined}
              aria-valuetext={formatValueLabel(receiptTime)}
            />
          </Box>
          
          <Typography variant="body2" color="primary" sx={{ textAlign: 'center', fontWeight: 'medium', mb: 1 }}>
            {sliderMarks.find(mark => mark.value === receiptTime)?.label} ({getTimeDescription(receiptTime)})
          </Typography>
          
          {receiptError && (
            <FormHelperText error id="receipt-error" sx={{ textAlign: 'center', mt: 1 }}>
              {receiptError}
            </FormHelperText>
          )}
        </Box>

        {/* Plates Processing Time Slider */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" component="legend" sx={{ mb: 2, textAlign: 'center' }}>
            Registration Plates Release Time *
          </Typography>
          
          <Box sx={{ px: 2, mb: 2 }}>
            <Slider
              value={platesTime}
              onChange={handlePlatesSliderChange}
              disabled={disabled}
              min={0}
              max={4}
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
                  fontSize: '0.75rem',
                  color: 'text.secondary',
                  fontWeight: 500,
                },
                '& .MuiSlider-valueLabel': {
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                }
              }}
              aria-label="Plates processing time"
              aria-describedby={platesError ? 'plates-error' : undefined}
              aria-valuetext={formatValueLabel(platesTime)}
            />
          </Box>
          
          <Typography variant="body2" color="primary" sx={{ textAlign: 'center', fontWeight: 'medium', mb: 1 }}>
            {sliderMarks.find(mark => mark.value === platesTime)?.label} ({getTimeDescription(platesTime)})
          </Typography>
          
          {platesError && (
            <FormHelperText error id="plates-error" sx={{ textAlign: 'center', mt: 1 }}>
              {platesError}
            </FormHelperText>
          )}
        </Box>
      </Box>
    </FormControl>
  );
};

export default DualTimeSliderRating;