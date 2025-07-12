import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  CardMedia,
  Typography,
  Rating,
  Button,
  Chip,
  Box,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Language as WebsiteIcon,
  Directions as DirectionsIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { Dealership } from '../../types/dealership';
import { formatDistance } from '../../utils/locationUtils';

interface DealershipCardProps {
  dealership: Dealership;
  onClick?: () => void;
  selected?: boolean;
  showDistance?: boolean;
}

const DealershipCard: React.FC<DealershipCardProps> = ({
  dealership,
  onClick,
  selected = false,
  showDistance = true,
}) => {
  const handleCallDealership = (event: React.MouseEvent) => {
    event.stopPropagation();
    window.location.href = `tel:${dealership.phone}`;
  };

  const handleVisitWebsite = (event: React.MouseEvent) => {
    event.stopPropagation();
    const url = dealership.website?.startsWith('http') 
      ? dealership.website 
      : `https://${dealership.website}`;
    window.open(url, '_blank');
  };

  const handleGetDirections = (event: React.MouseEvent) => {
    event.stopPropagation();
    const destination = `${dealership.latitude},${dealership.longitude}`;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    window.open(url, '_blank');
  };

  const isOpen = () => {
    const now = new Date();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = days[now.getDay()];
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const todayHours = dealership.hours[currentDay as keyof typeof dealership.hours];
    if (!todayHours || todayHours === 'Closed') return false;
    
    // Parse hours (e.g., "9 AM - 9 PM")
    const match = todayHours.match(/(\d{1,2})\s*(AM|PM)\s*-\s*(\d{1,2})\s*(AM|PM)/i);
    if (!match) return false;
    
    const [, openHour, openPeriod, closeHour, closePeriod] = match;
    
    let openTime = parseInt(openHour) * 60;
    if (openPeriod.toUpperCase() === 'PM' && parseInt(openHour) !== 12) {
      openTime += 12 * 60;
    }
    
    let closeTime = parseInt(closeHour) * 60;
    if (closePeriod.toUpperCase() === 'PM' && parseInt(closeHour) !== 12) {
      closeTime += 12 * 60;
    }
    
    return currentTime >= openTime && currentTime <= closeTime;
  };

  const getStatusColor = () => {
    return isOpen() ? 'success' : 'error';
  };

  const getStatusText = () => {
    return isOpen() ? 'Open' : 'Closed';
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: onClick ? 'pointer' : 'default',
        border: selected ? '2px solid' : '1px solid',
        borderColor: selected ? 'primary.main' : 'divider',
        '&:hover': onClick ? {
          boxShadow: 4,
          transform: 'translateY(-2px)',
          transition: 'all 0.3s ease-in-out',
        } : {},
      }}
      onClick={onClick}
    >
      <CardMedia
        component="img"
        height="160"
        image={dealership.photos?.[0] || '/assets/default-dealership.jpg'}
        alt={dealership.name}
        sx={{ objectFit: 'cover' }}
      />
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        {/* Header */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" component="h3" gutterBottom>
            {dealership.name}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Rating
              value={dealership.averageRating || 0}
              precision={0.1}
              readOnly
              size="small"
            />
            <Typography variant="body2" color="text.secondary">
              {dealership.averageRating ? dealership.averageRating.toFixed(1) : 'No rating'} 
              ({dealership.reviewCount || 0} review{dealership.reviewCount !== 1 ? 's' : ''})
            </Typography>
          </Box>

          {/* Distance and Status */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {showDistance && dealership.distance && (
              <Typography variant="body2" color="text.secondary">
                {formatDistance(dealership.distance)} away
              </Typography>
            )}
            <Chip
              label={getStatusText()}
              color={getStatusColor()}
              size="small"
              icon={<ScheduleIcon />}
            />
          </Box>
        </Box>

        {/* Address */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
          <LocationIcon fontSize="small" color="action" sx={{ mt: 0.5 }} />
          <Typography variant="body2" color="text.secondary">
            {dealership.address}
          </Typography>
        </Box>

        {/* Brands */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          {dealership.brands.slice(0, 3).map((brand) => (
            <Chip
              key={brand}
              label={brand}
              size="small"
              variant="outlined"
            />
          ))}
          {dealership.brands.length > 3 && (
            <Chip
              label={`+${dealership.brands.length - 3} more`}
              size="small"
              variant="outlined"
              color="primary"
            />
          )}
        </Box>

        {/* Description */}
        {dealership.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {dealership.description}
          </Typography>
        )}
      </CardContent>

      <Divider />

      {/* Actions */}
      <CardActions sx={{ justifyContent: 'space-between', px: 2, py: 1 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {dealership.phone && (
            <IconButton
              size="small"
              onClick={handleCallDealership}
              title="Call dealership"
              color="primary"
            >
              <PhoneIcon />
            </IconButton>
          )}
          
          {dealership.website && (
            <IconButton
              size="small"
              onClick={handleVisitWebsite}
              title="Visit website"
              color="primary"
            >
              <WebsiteIcon />
            </IconButton>
          )}
        </Box>

        <Button
          size="small"
          startIcon={<DirectionsIcon />}
          onClick={handleGetDirections}
          variant="outlined"
        >
          Directions
        </Button>
      </CardActions>
    </Card>
  );
};

export default DealershipCard;