import React from 'react';
import { 
  Box, 
  Typography, 
  ToggleButtonGroup,
  ToggleButton,
  FormControl, 
  FormHelperText,
  Rating,
  useTheme,
  useMediaQuery
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import SentimentNeutralIcon from '@mui/icons-material/SentimentNeutral';
import SentimentSatisfiedIcon from '@mui/icons-material/SentimentSatisfied';
import SentimentVerySatisfiedIcon from '@mui/icons-material/SentimentVerySatisfied';

interface ButtonRatingInputProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  label?: string;
  error?: string;
  required?: boolean;
  showStars?: boolean;
  variant?: 'text' | 'emoji' | 'mixed';
}

const ratingOptions = [
  { 
    value: 1, 
    label: 'Poor', 
    emoji: '😞', 
    icon: <SentimentVeryDissatisfiedIcon />,
    color: '#f44336' 
  },
  { 
    value: 2, 
    label: 'Fair', 
    emoji: '😐', 
    icon: <SentimentDissatisfiedIcon />,
    color: '#ff9800' 
  },
  { 
    value: 3, 
    label: 'Good', 
    emoji: '🙂', 
    icon: <SentimentNeutralIcon />,
    color: '#ffc107' 
  },
  { 
    value: 4, 
    label: 'Very Good', 
    emoji: '😊', 
    icon: <SentimentSatisfiedIcon />,
    color: '#8bc34a' 
  },
  { 
    value: 5, 
    label: 'Excellent', 
    emoji: '😍', 
    icon: <SentimentVerySatisfiedIcon />,
    color: '#4caf50' 
  },
];

const ButtonRatingInput: React.FC<ButtonRatingInputProps> = ({
  value,
  onChange,
  disabled = false,
  label = 'Rate Your Experience',
  error,
  required = false,
  showStars = true,
  variant = 'mixed'
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleChange = (_: React.MouseEvent<HTMLElement>, newValue: string | null) => {
    if (newValue !== null) {
      onChange(parseInt(newValue, 10));
    }
  };

  const selectedOption = ratingOptions.find(option => option.value === value);

  return (
    <FormControl error={!!error} sx={{ width: '100%' }}>
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h6" component="legend" sx={{ mb: 2 }}>
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
                  color: selectedOption?.color || '#ffa726',
                }
              }}
            />
          </Box>
        )}
        
        <ToggleButtonGroup
          value={value.toString()}
          exclusive
          onChange={handleChange}
          disabled={disabled}
          orientation={isMobile ? 'vertical' : 'horizontal'}
          sx={{
            display: 'flex',
            flexWrap: isMobile ? 'nowrap' : 'wrap',
            justifyContent: 'center',
            gap: 1,
            '& .MuiToggleButton-root': {
              border: '2px solid',
              borderRadius: 2,
              minWidth: isMobile ? '100%' : '120px',
              height: isMobile ? '60px' : '80px',
              display: 'flex',
              flexDirection: 'column',
              gap: 0.5,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: theme.shadows[4],
              },
              '&.Mui-selected': {
                backgroundColor: 'rgba(25, 118, 210, 0.1)',
                borderColor: 'primary.main',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.15)',
                },
              },
            }
          }}
          aria-label={`${label} button group`}
        >
          {ratingOptions.map((option) => (
            <ToggleButton
              key={option.value}
              value={option.value.toString()}
              aria-label={`Rate as ${option.label} (${option.value} star${option.value !== 1 ? 's' : ''})`}
              sx={{
                borderColor: option.color,
                '&.Mui-selected': {
                  borderColor: option.color,
                  backgroundColor: `${option.color}15`,
                  '&:hover': {
                    backgroundColor: `${option.color}25`,
                  },
                },
              }}
            >
              {variant === 'emoji' && (
                <Box sx={{ fontSize: '1.5rem' }}>{option.emoji}</Box>
              )}
              {variant === 'text' && (
                <Typography variant="body2" fontWeight="bold">
                  {option.label}
                </Typography>
              )}
              {variant === 'mixed' && (
                <>
                  <Box sx={{ fontSize: '1.5rem' }}>{option.emoji}</Box>
                  <Typography variant="body2" fontWeight="bold">
                    {option.label}
                  </Typography>
                </>
              )}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        
        {value > 0 && selectedOption && (
          <Typography 
            variant="h6" 
            sx={{ 
              mt: 2,
              color: selectedOption.color,
              fontWeight: 600
            }}
          >
            {selectedOption.label} Experience
          </Typography>
        )}
      </Box>
      
      {error && (
        <FormHelperText id="button-rating-error" sx={{ textAlign: 'center', mt: 1 }}>
          {error}
        </FormHelperText>
      )}
    </FormControl>
  );
};

export default ButtonRatingInput;