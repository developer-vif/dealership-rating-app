import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  AdminPanelSettings as AdminIcon,
  People as PeopleIcon,
  RateReview as ReviewIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { useAuthContext } from '../contexts/AuthContext';

// Types
interface AdminStats {
  totalUsers: number;
  totalAdmins: number;
  totalDealerships: number;
  totalReviews: number;
  reviewsLast30Days: number;
  averageRating: number;
}

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  isAdmin: boolean;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Review {
  id: string;
  rating: number;
  title: string;
  content: string;
  visitDate?: string;
  helpfulVotes: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  dealership: {
    id: string;
    name: string;
    googlePlaceId: string;
  };
}

interface Dealership {
  id: string;
  name: string;
  googlePlaceId: string;
  reviewCount: number;
  averageRating: number;
  createdAt: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AdminPage: React.FC = () => {
  const { user: currentUser, token } = useAuthContext();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Stats
  const [stats, setStats] = useState<AdminStats | null>(null);
  
  // Users
  const [users, setUsers] = useState<User[]>([]);
  const [usersPage, setUsersPage] = useState(0);
  const [usersRowsPerPage, setUsersRowsPerPage] = useState(10);
  const [usersSearch, setUsersSearch] = useState('');
  const [usersPagination, setUsersPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    hasNextPage: false,
    hasPreviousPage: false
  });
  
  // Reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsPage, setReviewsPage] = useState(0);
  const [reviewsRowsPerPage, setReviewsRowsPerPage] = useState(10);
  const [reviewsSearch, setReviewsSearch] = useState('');
  const [reviewsPagination, setReviewsPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalReviews: 0,
    hasNextPage: false,
    hasPreviousPage: false
  });
  
  // Dealerships
  const [dealerships, setDealerships] = useState<Dealership[]>([]);
  const [dealershipsPage, setDealershipsPage] = useState(0);
  const [dealershipsRowsPerPage, setDealershipsRowsPerPage] = useState(10);
  const [dealershipsSearch, setDealershipsSearch] = useState('');
  const [dealershipsPagination, setDealershipsPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalDealerships: 0,
    hasNextPage: false,
    hasPreviousPage: false
  });

  // Dialogs
  const [deleteReviewDialog, setDeleteReviewDialog] = useState<{ open: boolean; review: Review | null }>({
    open: false,
    review: null
  });

  const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
    const response = await fetch(`http://localhost:3002/api/admin${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'API request failed');
    }

    return response.json();
  };

  const fetchStats = async () => {
    try {
      const response = await apiRequest('/stats');
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      setError('Failed to fetch statistics');
    }
  };

  const fetchUsers = async (page = 1, search = '') => {
    try {
      const response = await apiRequest(`/users?page=${page}&limit=${usersRowsPerPage}&search=${search}`);
      setUsers(response.data.users);
      setUsersPagination(response.data.pagination);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to fetch users');
    }
  };

  const fetchReviews = async (page = 1, search = '') => {
    try {
      const response = await apiRequest(`/reviews?page=${page}&limit=${reviewsRowsPerPage}&search=${search}`);
      setReviews(response.data.reviews);
      setReviewsPagination(response.data.pagination);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
      setError('Failed to fetch reviews');
    }
  };

  const fetchDealerships = async (page = 1, search = '') => {
    try {
      const response = await apiRequest(`/dealerships?page=${page}&limit=${dealershipsRowsPerPage}&search=${search}`);
      setDealerships(response.data.dealerships);
      setDealershipsPagination(response.data.pagination);
    } catch (err) {
      console.error('Failed to fetch dealerships:', err);
      setError('Failed to fetch dealerships');
    }
  };

  const updateUserAdminStatus = async (userId: string, isAdmin: boolean) => {
    try {
      await apiRequest(`/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isAdmin }),
      });
      await fetchUsers(usersPagination.currentPage, usersSearch);
      await fetchStats(); // Refresh stats
    } catch (err) {
      console.error('Failed to update user:', err);
      setError('Failed to update user admin status');
    }
  };

  const deleteReview = async (reviewId: string) => {
    try {
      await apiRequest(`/reviews/${reviewId}`, {
        method: 'DELETE',
      });
      await fetchReviews(reviewsPagination.currentPage, reviewsSearch);
      await fetchStats(); // Refresh stats
      setDeleteReviewDialog({ open: false, review: null });
    } catch (err) {
      console.error('Failed to delete review:', err);
      setError('Failed to delete review');
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchStats(),
          fetchUsers(),
          fetchReviews(),
          fetchDealerships()
        ]);
      } catch (err) {
        console.error('Failed to initialize admin data:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleUsersPageChange = (_event: unknown, newPage: number) => {
    setUsersPage(newPage);
    fetchUsers(newPage + 1, usersSearch);
  };

  const handleReviewsPageChange = (_event: unknown, newPage: number) => {
    setReviewsPage(newPage);
    fetchReviews(newPage + 1, reviewsSearch);
  };

  const handleDealershipsPageChange = (_event: unknown, newPage: number) => {
    setDealershipsPage(newPage);
    fetchDealerships(newPage + 1, dealershipsSearch);
  };

  const handleUsersSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setUsersSearch(value);
    setUsersPage(0);
    fetchUsers(1, value);
  };

  const handleReviewsSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setReviewsSearch(value);
    setReviewsPage(0);
    fetchReviews(1, value);
  };

  const handleDealershipsSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setDealershipsSearch(value);
    setDealershipsPage(0);
    fetchDealerships(1, value);
  };

  // Check if user is admin
  if (!currentUser?.isAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Access denied. Administrator privileges required.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AdminIcon color="primary" />
        Admin Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={2}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Users
                </Typography>
                <Typography variant="h4">
                  {stats.totalUsers}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={2}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Admins
                </Typography>
                <Typography variant="h4">
                  {stats.totalAdmins}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={2}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Dealerships
                </Typography>
                <Typography variant="h4">
                  {stats.totalDealerships}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={2}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Reviews
                </Typography>
                <Typography variant="h4">
                  {stats.totalReviews}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={2}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Reviews (30d)
                </Typography>
                <Typography variant="h4">
                  {stats.reviewsLast30Days}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={2}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Avg Rating
                </Typography>
                <Typography variant="h4">
                  {stats.averageRating.toFixed(1)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab icon={<PeopleIcon />} label="Users" />
            <Tab icon={<ReviewIcon />} label="Reviews" />
            <Tab icon={<BusinessIcon />} label="Dealerships" />
          </Tabs>
        </Box>

        {/* Users Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <TextField
              placeholder="Search users..."
              value={usersSearch}
              onChange={handleUsersSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 300 }}
            />
            <IconButton onClick={() => fetchUsers(usersPagination.currentPage, usersSearch)}>
              <RefreshIcon />
            </IconButton>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Reviews</TableCell>
                  <TableCell>Admin</TableCell>
                  <TableCell>Created</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.reviewCount}</TableCell>
                    <TableCell>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={user.isAdmin}
                            onChange={(e) => updateUserAdminStatus(user.id, e.target.checked)}
                            disabled={user.id === currentUser?.id} // Prevent self-demotion
                          />
                        }
                        label={user.isAdmin ? 'Admin' : 'User'}
                      />
                    </TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={usersPagination.totalUsers}
            page={usersPage}
            onPageChange={handleUsersPageChange}
            rowsPerPage={usersRowsPerPage}
            onRowsPerPageChange={(e) => setUsersRowsPerPage(parseInt(e.target.value, 10))}
          />
        </TabPanel>

        {/* Reviews Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <TextField
              placeholder="Search reviews..."
              value={reviewsSearch}
              onChange={handleReviewsSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 300 }}
            />
            <IconButton onClick={() => fetchReviews(reviewsPagination.currentPage, reviewsSearch)}>
              <RefreshIcon />
            </IconButton>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Content</TableCell>
                  <TableCell>Rating</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Dealership</TableCell>
                  <TableCell>Helpful Votes</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell>{review.title}</TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '250px',
                        }}
                      >
                        {review.content}
                      </Typography>
                    </TableCell>
                    <TableCell>{review.rating}/5</TableCell>
                    <TableCell>{review.user.name}</TableCell>
                    <TableCell>{review.dealership.name}</TableCell>
                    <TableCell>{review.helpfulVotes}</TableCell>
                    <TableCell>{new Date(review.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <IconButton
                        color="error"
                        onClick={() => setDeleteReviewDialog({ open: true, review })}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={reviewsPagination.totalReviews}
            page={reviewsPage}
            onPageChange={handleReviewsPageChange}
            rowsPerPage={reviewsRowsPerPage}
            onRowsPerPageChange={(e) => setReviewsRowsPerPage(parseInt(e.target.value, 10))}
          />
        </TabPanel>

        {/* Dealerships Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <TextField
              placeholder="Search dealerships..."
              value={dealershipsSearch}
              onChange={handleDealershipsSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 300 }}
            />
            <IconButton onClick={() => fetchDealerships(dealershipsPagination.currentPage, dealershipsSearch)}>
              <RefreshIcon />
            </IconButton>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Google Place ID</TableCell>
                  <TableCell>Reviews</TableCell>
                  <TableCell>Avg Rating</TableCell>
                  <TableCell>Created</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dealerships.map((dealership) => (
                  <TableRow key={dealership.id}>
                    <TableCell>{dealership.name}</TableCell>
                    <TableCell>{dealership.googlePlaceId}</TableCell>
                    <TableCell>{dealership.reviewCount}</TableCell>
                    <TableCell>{dealership.averageRating.toFixed(1)}/5</TableCell>
                    <TableCell>{new Date(dealership.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={dealershipsPagination.totalDealerships}
            page={dealershipsPage}
            onPageChange={handleDealershipsPageChange}
            rowsPerPage={dealershipsRowsPerPage}
            onRowsPerPageChange={(e) => setDealershipsRowsPerPage(parseInt(e.target.value, 10))}
          />
        </TabPanel>
      </Paper>

      {/* Delete Review Dialog */}
      <Dialog
        open={deleteReviewDialog.open}
        onClose={() => setDeleteReviewDialog({ open: false, review: null })}
      >
        <DialogTitle>Delete Review</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the review "{deleteReviewDialog.review?.title}" by {deleteReviewDialog.review?.user.name}?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteReviewDialog({ open: false, review: null })}>
            Cancel
          </Button>
          <Button
            color="error"
            onClick={() => deleteReviewDialog.review && deleteReview(deleteReviewDialog.review.id)}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminPage;