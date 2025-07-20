import { Router, Request, Response } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { logger } from '../utils/logger';
import { query } from '../utils/database';
import { z } from 'zod';

const router = Router();

// Apply authentication and admin requirement to all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

// Admin Dashboard Stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE is_admin = true) as total_admins,
        (SELECT COUNT(*) FROM dealerships) as total_dealerships,
        (SELECT COUNT(*) FROM reviews) as total_reviews,
        (SELECT COUNT(*) FROM reviews WHERE created_at >= NOW() - INTERVAL '30 days') as reviews_last_30_days,
        (SELECT AVG(rating)::NUMERIC(3,2) FROM reviews) as average_rating
    `;

    const result = await query(statsQuery);
    const stats = result.rows[0];

    logger.info('Admin dashboard stats requested', { 
      adminId: req.user?.userId,
      adminEmail: req.user?.email 
    });

    res.status(200).json({
      success: true,
      data: {
        totalUsers: parseInt(stats.total_users),
        totalAdmins: parseInt(stats.total_admins),
        totalDealerships: parseInt(stats.total_dealerships),
        totalReviews: parseInt(stats.total_reviews),
        reviewsLast30Days: parseInt(stats.reviews_last_30_days),
        averageRating: parseFloat(stats.average_rating) || 0
      },
      meta: {
        requestId: req.headers['x-request-id'] || 'unknown',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Admin stats error', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.userId
    });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch admin statistics'
      }
    });
  }
});

// Get All Users with Pagination
router.get('/users', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query['page'] as string) || 1;
    const limit = parseInt(req.query['limit'] as string) || 20;
    const search = req.query['search'] as string || '';
    const offset = (page - 1) * limit;

    let whereClause = '';
    let queryParams: any[] = [limit, offset];

    if (search) {
      whereClause = 'WHERE name ILIKE $3 OR email ILIKE $3';
      queryParams.push(`%${search}%`);
    }

    const usersQuery = `
      SELECT 
        id, email, name, avatar_url, is_admin, created_at, updated_at,
        (SELECT COUNT(*) FROM reviews WHERE user_id = users.id) as review_count
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM users
      ${whereClause}
    `;

    // Fix parameter indexing for count query
    const countQueryParams = search ? [`%${search}%`] : [];
    const countQueryWithFixedParams = search ? `
      SELECT COUNT(*) as total
      FROM users
      WHERE name ILIKE $1 OR email ILIKE $1
    ` : countQuery;

    const [usersResult, countResult] = await Promise.all([
      query(usersQuery, queryParams),
      query(countQueryWithFixedParams, countQueryParams)
    ]);

    const users = usersResult.rows.map((row: any) => ({
      id: row.id,
      email: row.email,
      name: row.name,
      avatarUrl: row.avatar_url,
      isAdmin: row.is_admin,
      reviewCount: parseInt(row.review_count),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    const totalUsers = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalUsers / limit);

    logger.info('Admin users list requested', { 
      adminId: req.user?.userId,
      page,
      limit,
      search: search || 'none'
    });

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      },
      meta: {
        requestId: req.headers['x-request-id'] || 'unknown',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Admin users list error', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.userId
    });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch users'
      }
    });
  }
});

// Update User Admin Status
const updateUserSchema = z.object({
  isAdmin: z.boolean()
});

router.patch('/users/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const validatedData = updateUserSchema.parse(req.body);

    // Prevent admins from removing their own admin status
    if (userId === req.user?.userId && !validatedData.isAdmin) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'SELF_DEMOTION_NOT_ALLOWED',
          message: 'You cannot remove your own admin privileges'
        }
      });
    }

    const updateQuery = `
      UPDATE users 
      SET is_admin = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, email, name, is_admin, updated_at
    `;

    const result = await query(updateQuery, [validatedData.isAdmin, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    const updatedUser = result.rows[0];

    logger.info('User admin status updated', {
      adminId: req.user?.userId,
      targetUserId: userId,
      newAdminStatus: validatedData.isAdmin
    });

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          isAdmin: updatedUser.is_admin,
          updatedAt: updatedUser.updated_at
        }
      },
      meta: {
        requestId: req.headers['x-request-id'] || 'unknown',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.issues
        }
      });
    }

    logger.error('Update user admin status error', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.userId,
      targetUserId: req.params['userId']
    });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update user'
      }
    });
  }
});

// Get All Reviews with Pagination
router.get('/reviews', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query['page'] as string) || 1;
    const limit = parseInt(req.query['limit'] as string) || 20;
    const search = req.query['search'] as string || '';
    const offset = (page - 1) * limit;

    let whereClause = '';
    let queryParams: any[] = [limit, offset];

    if (search) {
      whereClause = `
        WHERE r.title ILIKE $3 
        OR r.content ILIKE $3 
        OR u.name ILIKE $3 
        OR d.name ILIKE $3
      `;
      queryParams.push(`%${search}%`);
    }

    const reviewsQuery = `
      SELECT 
        r.id, r.rating, r.title, r.content, r.visit_date, 
        r.helpful_votes, r.created_at, r.updated_at,
        u.id as user_id, u.name as user_name, u.email as user_email,
        d.id as dealership_id, d.name as dealership_name, d.google_place_id
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN dealerships d ON r.dealership_id = d.id
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN dealerships d ON r.dealership_id = d.id
      ${whereClause}
    `;

    // Fix parameter indexing for count query
    const countQueryParams = search ? [`%${search}%`] : [];
    const countQueryWithFixedParams = search ? `
      SELECT COUNT(*) as total
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN dealerships d ON r.dealership_id = d.id
      WHERE r.title ILIKE $1 
      OR r.content ILIKE $1 
      OR u.name ILIKE $1 
      OR d.name ILIKE $1
    ` : countQuery;

    const [reviewsResult, countResult] = await Promise.all([
      query(reviewsQuery, queryParams),
      query(countQueryWithFixedParams, countQueryParams)
    ]);

    const reviews = reviewsResult.rows.map((row: any) => ({
      id: row.id,
      rating: row.rating,
      title: row.title,
      content: row.content,
      visitDate: row.visit_date,
      helpfulVotes: row.helpful_votes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      user: {
        id: row.user_id,
        name: row.user_name,
        email: row.user_email
      },
      dealership: {
        id: row.dealership_id,
        name: row.dealership_name,
        googlePlaceId: row.google_place_id
      }
    }));

    const totalReviews = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalReviews / limit);

    logger.info('Admin reviews list requested', { 
      adminId: req.user?.userId,
      page,
      limit,
      search: search || 'none'
    });

    res.status(200).json({
      success: true,
      data: {
        reviews,
        pagination: {
          currentPage: page,
          totalPages,
          totalReviews,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      },
      meta: {
        requestId: req.headers['x-request-id'] || 'unknown',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Admin reviews list error', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.userId
    });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch reviews'
      }
    });
  }
});

// Delete Review
router.delete('/reviews/:reviewId', async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;

    const deleteQuery = `
      DELETE FROM reviews 
      WHERE id = $1
      RETURNING id, title, user_id
    `;

    const result = await query(deleteQuery, [reviewId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'REVIEW_NOT_FOUND',
          message: 'Review not found'
        }
      });
    }

    const deletedReview = result.rows[0];

    logger.info('Review deleted by admin', {
      adminId: req.user?.userId,
      reviewId: deletedReview.id,
      reviewTitle: deletedReview.title,
      originalUserId: deletedReview.user_id
    });

    res.status(200).json({
      success: true,
      data: {
        message: 'Review deleted successfully',
        reviewId: deletedReview.id
      },
      meta: {
        requestId: req.headers['x-request-id'] || 'unknown',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Delete review error', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.userId,
      reviewId: req.params['reviewId']
    });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete review'
      }
    });
  }
});

// Get All Dealerships with Pagination
router.get('/dealerships', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query['page'] as string) || 1;
    const limit = parseInt(req.query['limit'] as string) || 20;
    const search = req.query['search'] as string || '';
    const offset = (page - 1) * limit;

    let whereClause = '';
    let queryParams: any[] = [limit, offset];

    if (search) {
      whereClause = 'WHERE d.name ILIKE $3 OR d.google_place_id ILIKE $3';
      queryParams.push(`%${search}%`);
    }

    const dealershipsQuery = `
      SELECT 
        d.id, d.name, d.google_place_id, d.created_at,
        COUNT(r.id) as review_count,
        AVG(r.rating)::NUMERIC(3,2) as average_rating
      FROM dealerships d
      LEFT JOIN reviews r ON d.id = r.dealership_id
      ${whereClause}
      GROUP BY d.id, d.name, d.google_place_id, d.created_at
      ORDER BY d.created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM dealerships d
      ${whereClause}
    `;

    // Fix parameter indexing for count query
    const countQueryParams = search ? [`%${search}%`] : [];
    const countQueryWithFixedParams = search ? `
      SELECT COUNT(*) as total
      FROM dealerships d
      WHERE d.name ILIKE $1 OR d.google_place_id ILIKE $1
    ` : countQuery;

    const [dealershipsResult, countResult] = await Promise.all([
      query(dealershipsQuery, queryParams),
      query(countQueryWithFixedParams, countQueryParams)
    ]);

    const dealerships = dealershipsResult.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      googlePlaceId: row.google_place_id,
      reviewCount: parseInt(row.review_count),
      averageRating: parseFloat(row.average_rating) || 0,
      createdAt: row.created_at
    }));

    const totalDealerships = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalDealerships / limit);

    logger.info('Admin dealerships list requested', { 
      adminId: req.user?.userId,
      page,
      limit,
      search: search || 'none'
    });

    res.status(200).json({
      success: true,
      data: {
        dealerships,
        pagination: {
          currentPage: page,
          totalPages,
          totalDealerships,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      },
      meta: {
        requestId: req.headers['x-request-id'] || 'unknown',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Admin dealerships list error', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.userId
    });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch dealerships'
      }
    });
  }
});

export default router;