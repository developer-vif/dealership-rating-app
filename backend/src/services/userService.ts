import { query } from '../utils/database';
import { logger } from '../utils/logger';

export interface User {
  id: string;
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserData {
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

class UserService {
  // Get user by ID
  async getUserById(userId: string): Promise<User | null> {
    try {
      const selectQuery = `
        SELECT id, google_id, email, name, avatar_url, created_at, updated_at
        FROM users
        WHERE id = $1
      `;
      
      const result = await query(selectQuery, [userId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        googleId: row.google_id,
        email: row.email,
        name: row.name,
        avatarUrl: row.avatar_url,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } catch (error) {
      logger.error('Error fetching user by ID:', error);
      throw new Error('Failed to fetch user');
    }
  }

  // Get user by Google ID
  async getUserByGoogleId(googleId: string): Promise<User | null> {
    try {
      const selectQuery = `
        SELECT id, google_id, email, name, avatar_url, created_at, updated_at
        FROM users
        WHERE google_id = $1
      `;
      
      const result = await query(selectQuery, [googleId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        googleId: row.google_id,
        email: row.email,
        name: row.name,
        avatarUrl: row.avatar_url,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } catch (error) {
      logger.error('Error fetching user by Google ID:', error);
      throw new Error('Failed to fetch user');
    }
  }

  // Get user by email
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const selectQuery = `
        SELECT id, google_id, email, name, avatar_url, created_at, updated_at
        FROM users
        WHERE email = $1
      `;
      
      const result = await query(selectQuery, [email]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        googleId: row.google_id,
        email: row.email,
        name: row.name,
        avatarUrl: row.avatar_url,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } catch (error) {
      logger.error('Error fetching user by email:', error);
      throw new Error('Failed to fetch user');
    }
  }

  // Create a new user
  async createUser(userData: CreateUserData): Promise<User> {
    try {
      const insertQuery = `
        INSERT INTO users (google_id, email, name, avatar_url)
        VALUES ($1, $2, $3, $4)
        RETURNING id, google_id, email, name, avatar_url, created_at, updated_at
      `;
      
      const values = [
        userData.googleId,
        userData.email,
        userData.name,
        userData.avatarUrl
      ];

      const result = await query(insertQuery, values);
      const row = result.rows[0];

      return {
        id: row.id,
        googleId: row.google_id,
        email: row.email,
        name: row.name,
        avatarUrl: row.avatar_url,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } catch (error) {
      logger.error('Error creating user:', error);
      if (error instanceof Error && error.message.includes('duplicate key')) {
        throw new Error('User already exists');
      }
      throw new Error('Failed to create user');
    }
  }

  // Update user
  async updateUser(userId: string, updateData: Partial<CreateUserData>): Promise<User> {
    try {
      const updateFields = [];
      const values = [];
      let paramCount = 1;

      if (updateData.email !== undefined) {
        updateFields.push(`email = $${paramCount++}`);
        values.push(updateData.email);
      }
      if (updateData.name !== undefined) {
        updateFields.push(`name = $${paramCount++}`);
        values.push(updateData.name);
      }
      if (updateData.avatarUrl !== undefined) {
        updateFields.push(`avatar_url = $${paramCount++}`);
        values.push(updateData.avatarUrl);
      }

      updateFields.push(`updated_at = NOW()`);
      values.push(userId);

      const updateQuery = `
        UPDATE users 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id, google_id, email, name, avatar_url, created_at, updated_at
      `;

      const result = await query(updateQuery, values);
      
      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const row = result.rows[0];
      return {
        id: row.id,
        googleId: row.google_id,
        email: row.email,
        name: row.name,
        avatarUrl: row.avatar_url,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } catch (error) {
      logger.error('Error updating user:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to update user');
    }
  }

  // Get or create user (upsert for OAuth)
  async getOrCreateUser(userData: CreateUserData): Promise<User> {
    try {
      // First try to find existing user
      let user = await this.getUserByGoogleId(userData.googleId);
      
      if (user) {
        // Update user info if it has changed
        const needsUpdate = 
          user.email !== userData.email ||
          user.name !== userData.name ||
          user.avatarUrl !== userData.avatarUrl;

        if (needsUpdate) {
          user = await this.updateUser(user.id, {
            email: userData.email,
            name: userData.name,
            avatarUrl: userData.avatarUrl,
          });
        }
        
        return user;
      }

      // Create new user if not found
      return await this.createUser(userData);
    } catch (error) {
      logger.error('Error in getOrCreateUser:', error);
      throw new Error('Failed to get or create user');
    }
  }
}

export default new UserService();