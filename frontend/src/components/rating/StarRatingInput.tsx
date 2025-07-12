import React from 'react';
import { 
  Box, 
  Typography, 
  Rating, 
  FormControl, 
  FormHelperText 
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';

interface StarRatingInputProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  label?: string;
  error?: string;
  required?: boolean;
  showValueText?: boolean;
}

const ratingLabels: { [index: string]: string } = {
  1: 'Poor',
  2: 'Fair', 
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
};

const StarRatingInput: React.FC<StarRatingInputProps> = ({
  value,
  onChange,
  disabled = false,
  size = 'large',
  label = 'Overall Rating',
  error,
  required = false,
  showValueText = true
}) => {
  const [hover, setHover] = React.useState(-1);

  const getLabelText = (value: number) => {
    return `${value} Star${value !== 1 ? 's' : ''} - ${ratingLabels[value] || 'Unknown'}`;
  };

  const currentLabel = hover !== -1 ? ratingLabels[hover] : ratingLabels[value];

  return (
    <FormControl error={!!error} sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
        <Typography variant="h6" component="legend" sx={{ mb: 1 }}>
          {label} {required && '*'}
        </Typography>
        
        <Rating
          value={value}
          onChange={(_, newValue) => {
            if (newValue !== null) {
              onChange(newValue);
            }
          }}
          onChangeActive={(_, newHover) => {
            setHover(newHover);
          }}
          disabled={disabled}
          size={size}
          icon={<StarIcon fontSize="inherit" />}
          emptyIcon={<StarBorderIcon fontSize="inherit" />}
          getLabelText={getLabelText}
          sx={{
            fontSize: size === 'large' ? '3rem' : size === 'medium' ? '2rem' : '1.5rem',
            '& .MuiRating-iconFilled': {
              color: '#ffa726',
            },
            '& .MuiRating-iconHover': {
              color: '#ff9800',
            },
            '& .MuiRating-iconEmpty': {
              color: '#e0e0e0',
            }
          }}
          aria-label={`${label} rating`}
          aria-describedby={error ? 'rating-error' : undefined}
        />
        
        {showValueText && (value > 0 || hover > 0) && (
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ 
              fontWeight: 500,
              minHeight: '1.5rem',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {currentLabel || 'Select a rating'}
          </Typography>
        )}
        
        {!showValueText && value === 0 && (
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ minHeight: '1.5rem' }}
          >
            Click to rate
          </Typography>
        )}
      </Box>
      
      {error && (
        <FormHelperText id="rating-error" sx={{ textAlign: 'center', mt: 1 }}>
          {error}
        </FormHelperText>
      )}
    </FormControl>
  );
};

export default StarRatingInput;