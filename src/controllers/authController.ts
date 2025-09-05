import bcrypt from 'bcryptjs';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { Request, Response } from 'express';
import helpers from '../utils/helpers';
import Logger from '../utils/logger';
import { sql } from '../config/database';
import JWT_CONFIG from '../config/jwt';
import type { StringValue } from 'ms';

const { generateApiKey } = helpers;

interface Structure {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  status: string;
  api_key: string;
}

const authController = {
  /** ------------------- REGISTER ------------------- **/
  async register(req: Request, res: Response) {
    try {
      const { name, email, password, address, phone } = req.body;

      // Vérifie si la structure existe déjà
      const existing = await sql`
        SELECT id, name, email, api_key
        FROM structures
        WHERE email = ${email}
      `;
      if (existing.length > 0) {
        return res.status(400).json({ error: 'Structure already exists with this email' });
      }

      // Hash du mot de passe
      const passwordHash = await bcrypt.hash(password, 12);

      // Génération de l'API key
      const apiKey = generateApiKey();

      // Insert dans la base
      const result = await sql`
        INSERT INTO structures (name, email, password_hash, address, phone, api_key)
        VALUES (${name}, ${email}, ${passwordHash}, ${address}, ${phone}, ${apiKey})
        RETURNING id, name, email, api_key
      `;

      Logger.info('Structure registered', { structureId: result[0].id, email });

      return res.status(201).json({
        message: 'Structure registered successfully',
        structure: result[0]
      });
    } catch (error: any) {
      Logger.error('Registration error', { error: error.message, email: req.body.email });
      return res.status(500).json({ error: 'Registration failed' });
    }
  },

  /** ------------------- LOGIN ------------------- **/
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const result = await sql`
        SELECT id, name, email, password_hash, status, api_key
        FROM structures
        WHERE email = ${email}
      `;

      if (result.length === 0) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      const user = result[0] as Structure;

      if (user.status !== 'active') {
        return res.status(403).json({ error: 'Account is inactive' });
      }

      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      // JWT
      const payload = { id: user.id, email: user.email };
      const secret: Secret = JWT_CONFIG.secret;
      const options: SignOptions = { expiresIn: JWT_CONFIG.expiresIn as number | StringValue | undefined };
      const token = jwt.sign(payload, secret, options);

      Logger.info('Successful login', { structureId: user.id, email });

      return res.json({
        message: 'Login successful',
        token,
        structure: {
          id: user.id,
          name: user.name,
          email: user.email,
          api_key: user.api_key
        }
      });
    } catch (error: any) {
      Logger.error('Login error', { error: error.message });
      return res.status(500).json({ error: 'Login failed' });
    }
  }
};

export default authController;
