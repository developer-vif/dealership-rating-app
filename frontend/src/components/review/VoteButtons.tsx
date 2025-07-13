import React, { useState } from 'react';
import { 
  Box, 
  IconButton, 
  Typography, 
  Tooltip,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import { 
  ThumbUp as ThumbUpIcon, 
  ThumbDown as ThumbDownIcon,
  ThumbUpOutlined as ThumbUpOutlinedIcon,
  ThumbDownOutlined as ThumbDownOutlinedIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import reviewService from '../../services/reviewService';

export interface VoteButtonsProps {
  reviewId: string;
  helpfulVotes: number;
  unhelpfulVotes: number;
  userVote: 'helpful' | 'unhelpful' | null;
  onVoteUpdate: (newCounts: { helpfulVotes: number; unhelpfulVotes: number }, newUserVote: 'helpful' | 'unhelpful' | null) => void;
  disabled?: boolean;
}

const VoteButtons: React.FC<VoteButtonsProps> = ({
  reviewId,
  helpfulVotes,
  unhelpfulVotes,
  userVote,
  onVoteUpdate,
  disabled = false
}) => {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVote = async (voteType: 'helpful' | 'unhelpful') => {
    if (!isAuthenticated) {
      setError('Please sign in to vote on reviews');
      return;
    }

    if (loading || disabled) return;

    setLoading(true);
    setError(null);

    try {
      let result;
      
      // If clicking the same vote type, remove the vote
      if (userVote === voteType) {
        result = await reviewService.removeVote(reviewId);
      } else {
        // Submit new vote or change existing vote
        result = await reviewService.voteOnReview(reviewId, voteType);
      }
      
      onVoteUpdate(
        {
          helpfulVotes: result.voteSummary.helpfulVotes,
          unhelpfulVotes: result.voteSummary.unhelpfulVotes
        },
        result.userVote
      );
    } catch (error) {
      console.error('Vote error:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit vote');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseError = () => {
    setError(null);
  };

  const getVoteTooltip = (voteType: 'helpful' | 'unhelpful') => {
    if (!isAuthenticated) {
      return 'Sign in to vote';
    }
    
    if (userVote === voteType) {
      return `Remove ${voteType} vote`;
    }
    
    return `Mark as ${voteType}`;
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {/* Helpful Vote Button */}
      <Tooltip title={getVoteTooltip('helpful')} arrow>
        <span>
          <IconButton
            onClick={() => handleVote('helpful')}
            disabled={loading || disabled}
            size="small"
            sx={{
              color: userVote === 'helpful' ? 'success.main' : 'text.secondary',
              '&:hover': {
                color: 'success.main',
                backgroundColor: 'success.light',
                opacity: 0.1
              },
              '&.Mui-disabled': {
                color: 'text.disabled'
              }
            }}
            aria-label={`Mark review as helpful (${helpfulVotes} helpful votes)`}
          >
            {loading && userVote === 'helpful' ? (
              <CircularProgress size={20} color="inherit" />
            ) : userVote === 'helpful' ? (
              <ThumbUpIcon fontSize="small" />
            ) : (
              <ThumbUpOutlinedIcon fontSize="small" />
            )}
          </IconButton>
        </span>
      </Tooltip>
      
      <Typography 
        variant="body2" 
        color="text.secondary"
        sx={{ 
          minWidth: '16px', 
          textAlign: 'center',
          fontWeight: userVote === 'helpful' ? 'bold' : 'normal'
        }}
      >
        {helpfulVotes}
      </Typography>

      {/* Unhelpful Vote Button */}
      <Tooltip title={getVoteTooltip('unhelpful')} arrow>
        <span>
          <IconButton
            onClick={() => handleVote('unhelpful')}
            disabled={loading || disabled}
            size="small"
            sx={{
              color: userVote === 'unhelpful' ? 'error.main' : 'text.secondary',
              '&:hover': {
                color: 'error.main',
                backgroundColor: 'error.light',
                opacity: 0.1
              },
              '&.Mui-disabled': {
                color: 'text.disabled'
              }
            }}
            aria-label={`Mark review as unhelpful (${unhelpfulVotes} unhelpful votes)`}
          >
            {loading && userVote === 'unhelpful' ? (
              <CircularProgress size={20} color="inherit" />
            ) : userVote === 'unhelpful' ? (
              <ThumbDownIcon fontSize="small" />
            ) : (
              <ThumbDownOutlinedIcon fontSize="small" />
            )}
          </IconButton>
        </span>
      </Tooltip>
      
      <Typography 
        variant="body2" 
        color="text.secondary"
        sx={{ 
          minWidth: '16px', 
          textAlign: 'center',
          fontWeight: userVote === 'unhelpful' ? 'bold' : 'normal'
        }}
      >
        {unhelpfulVotes}
      </Typography>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseError} 
          severity="error" 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default VoteButtons;