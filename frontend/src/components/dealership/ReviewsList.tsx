import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import { DealershipReview, ReviewsPaginatedResponse } from '../../types/dealership';
import ReviewCard from './ReviewCard';
import reviewService from '../../services/reviewService';

interface ReviewsListProps {
  placeId: string;
}

const ReviewsList: React.FC<ReviewsListProps> = ({ placeId }) => {
  const [reviews, setReviews] = useState<DealershipReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 3,
    total: 0,
    hasNext: false,
  });

  const fetchReviews = async (page: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }

      const response: ReviewsPaginatedResponse = await reviewService.getReviews(
        placeId,
        page,
        pagination.limit
      );

      if (append) {
        setReviews(prev => [...prev, ...response.reviews]);
      } else {
        setReviews(response.reviews);
      }

      setPagination(response.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load reviews';
      setError(errorMessage);
      if (!append) {
        setReviews([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchReviews(1, false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeId]);

  const handleLoadMore = () => {
    if (!loadingMore && pagination.hasNext) {
      fetchReviews(pagination.page + 1, true);
    }
  };

  if (loading && reviews.length === 0) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Customer Reviews
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (error && reviews.length === 0) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Customer Reviews
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Customer Reviews ({pagination.total})
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {reviews.length === 0 ? (
        <Alert severity="info">
          No reviews yet. Be the first to review this dealership!
        </Alert>
      ) : (
        <>
          {/* Reviews list */}
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}

          {/* Load more button */}
          {pagination.hasNext && (
            <Box display="flex" justifyContent="center" mt={3}>
              <Button
                variant="outlined"
                onClick={handleLoadMore}
                disabled={loadingMore}
                size="large"
              >
                {loadingMore ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Loading...
                  </>
                ) : (
                  'Load More Reviews'
                )}
              </Button>
            </Box>
          )}

          {/* Show total count if all loaded */}
          {!pagination.hasNext && reviews.length > 3 && (
            <Box textAlign="center" mt={2}>
              <Typography variant="body2" color="text.secondary">
                Showing all {reviews.length} reviews
              </Typography>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default ReviewsList;