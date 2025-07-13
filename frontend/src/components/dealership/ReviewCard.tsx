import React, { useState } from 'react';
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
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { DealershipReview } from '../../types/dealership';
import { 
  generateAnonymousUsername, 
  generateAnonymousInitials, 
  generateAnonymousAvatarColor 
} from '../../utils/anonymization';
import { User } from '../../contexts/AuthContext';
import VoteButtons from '../review/VoteButtons';

interface ReviewCardProps {
  review: DealershipReview;
  currentUser?: User | null;
  onEdit?: (review: DealershipReview) => void;
  onDelete?: (review: DealershipReview) => void;
  userVote?: 'helpful' | 'unhelpful' | null;
  onVoteUpdate?: (reviewId: string, newCounts: { helpfulVotes: number; unhelpfulVotes: number }, newUserVote: 'helpful' | 'unhelpful' | null) => void;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ 
  review, 
  currentUser, 
  onEdit, 
  onDelete, 
  userVote, 
  onVoteUpdate 
}) => {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [localVoteCounts, setLocalVoteCounts] = useState({
    helpfulVotes: review.helpfulVotes,
    unhelpfulVotes: review.unhelpfulVotes
  });
  const [localUserVote, setLocalUserVote] = useState<'helpful' | 'unhelpful' | null>(userVote || null);
  
  // DEBUG: Log all relevant values for troubleshooting
  console.log('🔍 ReviewCard Debug Info:', {
    reviewId: review.id,
    reviewTitle: review.title,
    reviewUserId: review.userId,
    currentUserId: currentUser?.id || 'NO_USER',
    currentUserName: currentUser?.name || 'NO_USER',
    hasOnEdit: typeof onEdit === 'function',
    hasOnDelete: typeof onDelete === 'function',
    userIdMatch: currentUser && review.userId === currentUser.id,
    userIdTypes: {
      reviewUserId: typeof review.userId,
      currentUserId: typeof currentUser?.id
    }
  });

  // TEMPORARY: Add visible indicator for owned reviews
  if (currentUser && review.userId === currentUser.id) {
    console.log('🎯 THIS IS YOUR REVIEW!', review.title);
  }
  
  // Check if this review belongs to the current user
  const isCurrentUserReview = currentUser && review.userId === currentUser.id;
  
  // DEBUG: Log final result
  console.log('🎯 Review ownership check result:', {
    reviewId: review.id,
    isCurrentUserReview,
    willShowMenu: isCurrentUserReview && (onEdit || onDelete)
  });
  
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

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleEdit = () => {
    handleMenuClose();
    onEdit?.(review);
  };

  const handleDelete = () => {
    handleMenuClose();
    onDelete?.(review);
  };

  const handleVoteUpdate = (newCounts: { helpfulVotes: number; unhelpfulVotes: number }, newUserVote: 'helpful' | 'unhelpful' | null) => {
    // Update local state for immediate UI feedback
    setLocalVoteCounts(newCounts);
    setLocalUserVote(newUserVote);
    
    // Notify parent component of vote change
    onVoteUpdate?.(review.id, newCounts, newUserVote);
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
          <Box display="flex" alignItems="center" gap={1}>
            <Rating value={review.rating} readOnly size="small" />
            {/* Edit/Delete menu for current user's reviews */}
            {(() => {
              const showMenu = isCurrentUserReview && (onEdit || onDelete);
              console.log('🎛️ Menu render check:', {
                reviewId: review.id,
                isCurrentUserReview,
                hasCallbacks: !!(onEdit || onDelete),
                showMenu,
                renderingMenu: showMenu
              });
              
              // TEMPORARY: Add visual indicator for debugging
              if (isCurrentUserReview) {
                console.log('⚠️ OWNED REVIEW BUT CHECKING MENU:', { 
                  hasOnEdit: !!onEdit, 
                  hasOnDelete: !!onDelete,
                  showMenu 
                });
              }
              
              return showMenu;
            })() && (
              <IconButton
                size="small"
                onClick={handleMenuOpen}
                aria-label="review options"
                sx={{ color: 'text.secondary' }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
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

        {/* Footer */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" color="text.secondary">
            Visit date: {formatDate(review.visitDate)}
          </Typography>
          
          {/* Vote Buttons */}
          <VoteButtons
            reviewId={review.id}
            helpfulVotes={localVoteCounts.helpfulVotes}
            unhelpfulVotes={localVoteCounts.unhelpfulVotes}
            userVote={localUserVote}
            onVoteUpdate={handleVoteUpdate}
          />
        </Box>
      </CardContent>

      {/* Edit/Delete Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {onEdit && (
          <MenuItem onClick={handleEdit}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Review</ListItemText>
          </MenuItem>
        )}
        {onDelete && (
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <ListItemIcon sx={{ color: 'error.main' }}>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete Review</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Card>
  );
};

export default ReviewCard;