import type { Router } from 'express';
import type { Request, Response } from 'express';
import { pool } from '../db.js';
import { respondWithSchema } from '../http/respond.js';
import {
  hashPassword,
  verifyPassword,
  generateJWT,
  verifyJWT,
  extractToken
} from '../services/auth.js';
import { z } from 'zod';

// Schema definitions
const RegisterInputSchema = z.object({
  email: z.string().email(),
  handle: z.string().min(2),
  password: z.string().min(8)
});

const LoginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const AuthResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  handle: z.string(),
  token: z.string()
});

const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  handle: z.string()
});

export function registerAuthRoutes(router: Router) {
  /**
   * POST /api/auth/register
   * Create a new user account
   */
  router.post('/auth/register', async (req: Request, res: Response) => {
    try {
      const input = RegisterInputSchema.parse(req.body);

      // Check if user already exists
      const existingQ = await pool.query('select id from users where email = $1 limit 1', [
        input.email
      ]);

      if (existingQ.rows[0]) {
        return res.status(409).json({ error: 'EMAIL_ALREADY_REGISTERED' });
      }

      // Hash password
      const passwordHash = await hashPassword(input.password);

      // Insert user
      const insertQ = await pool.query(
        'insert into users (email, handle, password_hash) values ($1, $2, $3) returning id, email, handle',
        [input.email, input.handle, passwordHash]
      );

      const user = insertQ.rows[0];
      const token = generateJWT({ id: user.id, email: user.email, handle: user.handle });

      const payload = {
        id: user.id,
        email: user.email,
        handle: user.handle,
        token
      };

      return respondWithSchema(res, AuthResponseSchema, payload, 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'INVALID_INPUT', details: error.errors });
      }
      console.error('Register error:', error);
      return res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  });

  /**
   * POST /api/auth/login
   * Authenticate user and return JWT
   */
  router.post('/auth/login', async (req: Request, res: Response) => {
    try {
      const input = LoginInputSchema.parse(req.body);

      // Find user by email
      const userQ = await pool.query(
        'select id, email, handle, password_hash from users where email = $1 limit 1',
        [input.email]
      );

      if (!userQ.rows[0]) {
        return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
      }

      const user = userQ.rows[0];

      // Verify password
      const isValid = await verifyPassword(input.password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
      }

      // Generate token
      const token = generateJWT({ id: user.id, email: user.email, handle: user.handle });

      const payload = {
        id: user.id,
        email: user.email,
        handle: user.handle,
        token
      };

      return respondWithSchema(res, AuthResponseSchema, payload, 200);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'INVALID_INPUT', details: error.errors });
      }
      console.error('Login error:', error);
      return res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  });

  /**
   * GET /api/auth/me
   * Get current user from JWT token
   */
  router.get('/auth/me', async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      const cookieToken = (req.cookies as any)?.token;

      const token = extractToken(authHeader, cookieToken);
      if (!token) {
        return res.status(401).json({ error: 'UNAUTHORIZED' });
      }

      const payload = verifyJWT(token);
      if (!payload) {
        return res.status(401).json({ error: 'INVALID_TOKEN' });
      }

      return respondWithSchema(res, UserSchema, payload, 200);
    } catch (error) {
      console.error('GET /auth/me error:', error);
      return res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  });
}
