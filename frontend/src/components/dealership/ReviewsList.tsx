import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import { Dealership, DealershipReview, ReviewsPaginatedResponse } from '../../types/dealership';
import ReviewCard from './ReviewCard';
import EditReviewDialog from '../dialogs/EditReviewDialog';
import DeleteConfirmationDialog from '../dialogs/DeleteConfirmationDialog';
import reviewService from '../../services/reviewService';
import { useAuth } from '../../contexts/AuthContext';

interface ReviewsListProps {
  placeId: string;
  dealershipName: string;
  refreshTrigger?: number;
}

const ReviewsList: React.FC<ReviewsListProps> = ({ placeId, dealershipName, refreshTrigger }) => {
  const { user } = useAuth();
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

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<DealershipReview | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedDealership, setSelectedDealership] = useState<Dealership | null>(null);

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

  // Refresh reviews when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchReviews(1, false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  const handleLoadMore = () => {
    if (!loadingMore && pagination.hasNext) {
      fetchReviews(pagination.page + 1, true);
    }
  };

  const handleEdit = async (review: DealershipReview) => {
    try {
      const dealership = await reviewService.getDealershipByReview(review.id);
      setSelectedDealership(dealership);
      setSelectedReview(review);
      setEditDialogOpen(true);
    } catch (error) {
      console.error('Error fetching dealership details:', error);
      alert('Failed to fetch dealership details. Please try again.');
    }
  };

  const handleDelete = (review: DealershipReview) => {
    setSelectedReview(review);
    setDeleteDialogOpen(true);
  };

  const handleEditSuccess = () => {
    // Refresh reviews after successful edit
    fetchReviews(1, false);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedReview || deleteLoading) return; // Prevent multiple delete attempts

    setDeleteLoading(true);
    try {
      if (!user || !user.id) {
        throw new Error("User not authenticated.");
      }
      await reviewService.deleteReview(selectedReview.id);
      setDeleteDialogOpen(false);
      setSelectedReview(null);
      // Refresh reviews after successful delete
      fetchReviews(1, false);
    } catch (error) {
      console.error('Error deleting review:', error);
      
      // Handle specific error cases
      let errorMessage = 'Failed to delete review. Please try again.';
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        if (axiosError.response?.status === 404) {
          errorMessage = 'Review not found. It may have already been deleted.';
        } else if (axiosError.response?.data?.error?.message) {
          errorMessage = axiosError.response.data.error.message;
        }
      }
      
      alert(errorMessage);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDialogClose = () => {
    if (!deleteLoading) {
      setEditDialogOpen(false);
      setDeleteDialogOpen(false);
      setSelectedReview(null);
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
          {reviews.map((review) => {
            console.log('📝 ReviewsList: Rendering review card:', {
              reviewId: review.id,
              reviewUserId: review.userId,
              currentUserId: user?.id || 'NO_USER',
              hasUser: !!user,
              hasHandleEdit: typeof handleEdit === 'function',
              hasHandleDelete: typeof handleDelete === 'function'
            });
            return (
              <ReviewCard 
                key={review.id} 
                review={review} 
                currentUser={user}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            );
          })}

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

      {/* Edit Review Dialog */}
      <EditReviewDialog
        open={editDialogOpen}
        onClose={handleDialogClose}
        review={selectedReview}
        dealership={selectedDealership}
        dealershipName={dealershipName}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={handleDialogClose}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
        itemName={selectedReview?.title}
      />
    </Box>
  );
};

export default ReviewsList;