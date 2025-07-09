import { query, transaction } from '../utils/database';
import { logger } from '../utils/logger';

export interface DealershipData {
  googlePlaceId: string;
  name: string;
}

export interface Dealership {
  id: string;
  googlePlaceId: string;
  name: string;
  createdAt: string;
}

class DealershipService {
  // Get dealership by Google Place ID
  async getDealershipByPlaceId(placeId: string): Promise<Dealership | null> {
    try {
      const dealershipQuery = `
        SELECT 
          id,
          google_place_id,
          name,
          created_at
        FROM dealerships 
        WHERE google_place_id = $1
      `;
      
      const result = await query(dealershipQuery, [placeId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const row = result.rows[0];
      return {
        id: row.id,
        googlePlaceId: row.google_place_id,
        name: row.name,
        createdAt: row.created_at,
      };
    } catch (error) {
      logger.error('Error fetching dealership by place ID:', error);
      throw new Error('Failed to fetch dealership');
    }
  }

  // Create a new dealership from Google Places data
  async createDealership(dealershipData: DealershipData): Promise<Dealership> {
    try {
      return await transaction(async (client) => {
        // Check if dealership already exists
        const existingQuery = `
          SELECT id FROM dealerships WHERE google_place_id = $1
        `;
        const existingResult = await client.query(existingQuery, [dealershipData.googlePlaceId]);
        
        if (existingResult.rows.length > 0) {
          // Return existing dealership
          return await this.getDealershipByPlaceId(dealershipData.googlePlaceId);
        }

        // Insert new dealership
        const insertQuery = `
          INSERT INTO dealerships (
            google_place_id,
            name
          ) VALUES ($1, $2)
          RETURNING id, created_at
        `;

        const values = [
          dealershipData.googlePlaceId,
          dealershipData.name,
        ];

        const insertResult = await client.query(insertQuery, values);
        const row = insertResult.rows[0];

        return {
          id: row.id,
          googlePlaceId: dealershipData.googlePlaceId,
          name: dealershipData.name,
          createdAt: row.created_at,
        };
      });
    } catch (error) {
      logger.error('Error creating dealership:', error);
      throw new Error('Failed to create dealership');
    }
  }

  // Get or create dealership (for reviews when dealership doesn't exist)
  async getOrCreateDealership(dealershipData: DealershipData): Promise<Dealership> {
    try {
      // First try to get existing dealership
      const existing = await this.getDealershipByPlaceId(dealershipData.googlePlaceId);
      if (existing) {
        return existing;
      }

      // If not found, create new one
      return await this.createDealership(dealershipData);
    } catch (error) {
      logger.error('Error getting or creating dealership:', error);
      throw new Error('Failed to get or create dealership');
    }
  }

  // Update dealership information (for syncing with Google Places)
  async updateDealership(placeId: string, dealershipData: Partial<DealershipData>): Promise<Dealership> {
    try {
      return await transaction(async (client) => {
        // Build update query dynamically
        const updateFields = [];
        const values = [];
        let paramCount = 1;

        if (dealershipData.name !== undefined) {
          updateFields.push(`name = $${paramCount++}`);
          values.push(dealershipData.name);
        }
        values.push(placeId);

        const updateQuery = `
          UPDATE dealerships 
          SET ${updateFields.join(', ')}
          WHERE google_place_id = $${paramCount}
          RETURNING id
        `;

        const updateResult = await client.query(updateQuery, values);
        
        if (updateResult.rows.length === 0) {
          throw new Error('Dealership not found');
        }

        // Return updated dealership
        return await this.getDealershipByPlaceId(placeId);
      });
    } catch (error) {
      logger.error('Error updating dealership:', error);
      throw new Error('Failed to update dealership');
    }
  }

  // Fetch dealership data from Google Places API (placeholder)
  async fetchFromGooglePlaces(placeId: string, fallbackData?: Partial<DealershipData>): Promise<DealershipData> {
    try {
      // TODO: Implement actual Google Places API call
      // For now, return basic data that can be extracted from the frontend
      logger.info(`Fetching dealership data for place ID: ${placeId}`);
      
      // This would be replaced with actual Google Places API call
      // For now, use fallback data if provided, otherwise use defaults
      return {
        googlePlaceId: placeId,
        name: fallbackData?.name || 'Unknown Dealership',
      };
    } catch (error) {
      logger.error('Error fetching from Google Places:', error);
      throw new Error('Failed to fetch dealership from Google Places');
    }
  }
}

export default new DealershipService();