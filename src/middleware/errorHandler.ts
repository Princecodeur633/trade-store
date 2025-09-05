import { Request, Response, NextFunction } from 'express';
import Logger from '../utils/logger';

interface CustomError extends Error {
  statusCode?: number;
  code?: string;
}

const errorHandler = (err: CustomError, req: Request, res: Response, next: NextFunction) => {
  Logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query
  });

  // PostgreSQL errors
  if (err.code === '23505') { // unique violation
    return res.status(409).json({
      error: 'Resource already exists',
      details: 'A record with this information already exists'
    });
  }

  if (err.code === '23503') { // foreign key violation
    return res.status(400).json({
      error: 'Invalid reference',
      details: 'Referenced resource does not exist'
    });
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: 'File too large',
      details: 'Maximum file size exceeded'
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      error: 'Unexpected file field',
      details: 'Invalid file upload field'
    });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

export default errorHandler;
