import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  status?: string;
}

export class CustomError extends Error implements AppError {
  statusCode: number;
  status: string;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;

  logger.error({
    message: err.message,
    stack: err.stack,
    statusCode,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.name || 'INTERNAL_SERVER_ERROR',
      message: process.env['NODE_ENV'] === 'production' 
        ? (statusCode >= 500 ? 'Internal server error' : err.message)
        : err.message,
      ...(process.env['NODE_ENV'] === 'development' && { stack: err.stack })
    },
    meta: {
      requestId: req.headers['x-request-id'] || 'unknown',
      timestamp: new Date().toISOString()
    }
  });
};

export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const error = new CustomError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};