import React from 'react';
import {
  Card,
  CardContent,
  Avatar,
  Typography,
  Rating,
  Box,
  Chip,
  IconButton,
  Stack,
} from '@mui/material';
import {
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
} from '@mui/icons-material';
import { DealershipReview } from '../../types/dealership';
import { 
  generateAnonymousUsername, 
  generateAnonymousInitials, 
  generateAnonymousAvatarColor 
} from '../../utils/anonymization';
import { User } from '../../contexts/AuthContext';

interface ReviewCardProps {
  review: DealershipReview;
  currentUser?: User | null;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review, currentUser }) => {
  // Check if this review belongs to the current user
  const isCurrentUserReview = currentUser && review.userId === currentUser.id;
  
  // Generate user display information
  const displayUsername = isCurrentUserReview ? currentUser.name : generateAnonymousUsername(review.userId);
  const displayAvatarUrl = isCurrentUserReview ? currentUser.picture : null;
  const displayInitials = isCurrentUserReview 
    ? currentUser.name.charAt(0).toUpperCase() 
    : generateAnonymousInitials(review.userId);
  const displayAvatarColor = isCurrentUserReview 
    ? 'primary.main' 
    : generateAnonymousAvatarColor(review.userId);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getProcessingTimeLabel = (time: string) => {
    const labels: { [key: string]: string } = {
      'same-day': 'Same Day',
      '1-week': '< 1 Week',
      '2-weeks': '< 2 Weeks',
      '1-month': '< 1 Month',
      '2-months': '< 2 Months',
      'longer': '> 2 Months',
    };
    return labels[time] || time;
  };

  const getProcessingTimeColor = (time: string) => {
    const colors: { [key: string]: 'success' | 'warning' | 'error' | 'default' } = {
      'same-day': 'success',
      '1-week': 'success',
      '2-weeks': 'warning',
      '1-month': 'warning',
      '2-months': 'error',
      'longer': 'error',
    };
    return colors[time] || 'default';
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        {/* Header with user info and rating */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar
              {...(displayAvatarUrl ? { src: displayAvatarUrl } : {})}
              sx={{ 
                width: 48, 
                height: 48,
                bgcolor: displayAvatarColor,
                color: 'white',
                fontWeight: 'bold'
              }}
            >
              {displayInitials}
            </Avatar>
            <Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="subtitle1" fontWeight="medium">
                  {displayUsername}
                </Typography>
                {/* Verification badge removed for anonymity */}
              </Box>
              <Typography variant="caption" color="text.secondary">
                {formatDate(review.createdAt)}
              </Typography>
            </Box>
          </Box>
          <Rating value={review.rating} readOnly size="small" />
        </Box>

        {/* Review title */}
        <Typography variant="h6" gutterBottom>
          {review.title}
        </Typography>

        {/* Review content */}
        <Typography variant="body2" color="text.secondary" paragraph>
          {review.content}
        </Typography>

        {/* Processing times */}
        <Box mb={2}>
          <Typography variant="subtitle2" gutterBottom>
            Document Processing Times:
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              label={`Receipt: ${getProcessingTimeLabel(review.receiptProcessingTime)}`}
              size="small"
              color={getProcessingTimeColor(review.receiptProcessingTime)}
              variant="outlined"
            />
            <Chip
              label={`Plates: ${getProcessingTimeLabel(review.platesProcessingTime)}`}
              size="small"
              color={getProcessingTimeColor(review.platesProcessingTime)}
              variant="outlined"
            />
          </Stack>
        </Box>

        {/* Tags */}
        {review.tags.length > 0 && (
          <Box mb={2}>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              {review.tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  size="small"
                  variant="outlined"
                  color="default"
                />
              ))}
            </Stack>
          </Box>
        )}

        {/* Footer with helpful votes */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" color="text.secondary">
            Visit date: {formatDate(review.visitDate)}
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
            <Box display="flex" alignItems="center">
              <IconButton size="small" color="primary">
                <ThumbUpIcon fontSize="small" />
              </IconButton>
              <Typography variant="caption">{review.helpfulVotes}</Typography>
            </Box>
            <Box display="flex" alignItems="center">
              <IconButton size="small" color="default">
                <ThumbDownIcon fontSize="small" />
              </IconButton>
              <Typography variant="caption">{review.unhelpfulVotes}</Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ReviewCard;