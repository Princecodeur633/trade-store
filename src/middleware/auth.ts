import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { sql } from '../config/database';
import JWT_CONFIG from '../config/jwt';
import Logger from '../utils/logger';

interface DecodedToken {
  id: number;
  email?: string;
  iat?: number;
  exp?: number;
}

// Extend Request to include `structure`
declare module 'express-serve-static-core' {
  interface Request {
    structure?: {
      id: number;
      name: string;
      email: string;
      status: string;
    };
  }
}

const authenticateStructure = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No valid token provided.' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_CONFIG.secret) as DecodedToken;

    const structure = await sql`
      SELECT id, name, email, status 
      FROM structures 
      WHERE id = ${decoded.id} AND status = 'active'
    `;

    if (structure.length === 0) {
      return res.status(401).json({ error: 'Invalid token or inactive structure.' });
    }

    req.structure = structure[0]as {
        id: number;
        name: string;
        email: string;
        status: string;
    };
    next();
  } catch (error: any) {
    Logger.error('Authentication error', { error: error.message });

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired.' });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    res.status(500).json({ error: 'Authentication service error.' });
  }
};

export default authenticateStructure;
