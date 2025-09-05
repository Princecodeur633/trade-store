import dotenv from 'dotenv';

dotenv.config();

interface JwtConfig {
  secret: string;
  expiresIn: string | number |undefined;
  algorithm: 'HS256' | 'HS384' | 'HS512';
}

const JWT_CONFIG: JwtConfig = {
  secret: process.env.JWT_SECRET || 'fallback_secret_for_development_only',
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  algorithm: 'HS256'
};

// Sécurité : empêcher l'utilisation du fallback en production
if (process.env.NODE_ENV === 'production' && JWT_CONFIG.secret === 'fallback_secret_for_development_only') {
  throw new Error('JWT_SECRET must be set in production');
}

export default JWT_CONFIG;
