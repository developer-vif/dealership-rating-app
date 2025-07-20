import { createClient, RedisClientType } from 'redis';
import { logger } from './logger';

class RedisClient {
  private client: RedisClientType;
  private isConnected: boolean = false;

  constructor() {
    this.client = createClient({
      url: process.env['REDIS_URL'] || 'redis://localhost:6379'
    });

    this.client.on('error', (err) => {
      logger.error('Redis Client Error', err);
    });

    this.client.on('connect', () => {
      logger.info('Redis client connected');
      this.isConnected = true;
    });

    this.client.on('disconnect', () => {
      logger.warn('Redis client disconnected');
      this.isConnected = false;
    });
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      try {
        await this.client.connect();
        logger.info('Redis client connection established');
      } catch (error) {
        logger.error('Failed to connect to Redis:', error);
        throw error;
      }
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect();
      logger.info('Redis client disconnected');
    }
  }

  async blacklistToken(jti: string, expiresIn: number): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      
      // Store the blacklisted token with expiration equal to token's remaining lifetime
      await this.client.setEx(`blacklist:${jti}`, expiresIn, 'blacklisted');
      logger.debug('Token blacklisted', { jti, expiresIn });
    } catch (error) {
      logger.error('Error blacklisting token', { error, jti });
      throw error;
    }
  }

  async isTokenBlacklisted(jti: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      
      const result = await this.client.get(`blacklist:${jti}`);
      return result !== null;
    } catch (error) {
      logger.error('Error checking token blacklist', { error, jti });
      // In case of Redis failure, allow the request to proceed
      // This prevents Redis outages from breaking authentication
      return false;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      
      if (ttl) {
        await this.client.setEx(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      logger.error('Error setting Redis key', { error, key });
      throw error;
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      
      return await this.client.get(key);
    } catch (error) {
      logger.error('Error getting Redis key', { error, key });
      throw error;
    }
  }

  async del(key: string): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      
      await this.client.del(key);
    } catch (error) {
      logger.error('Error deleting Redis key', { error, key });
      throw error;
    }
  }

  getClient(): RedisClientType {
    return this.client;
  }
}

// Export singleton instance
export const redisClient = new RedisClient();

// Initialize connection
redisClient.connect().catch((error) => {
  logger.error('Failed to initialize Redis connection:', error);
});

export default redisClient;