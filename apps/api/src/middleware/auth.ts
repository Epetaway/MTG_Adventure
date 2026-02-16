import type { Request, Response, NextFunction } from 'express';
import { verifyJWT, extractToken } from '../services/auth.js';
import { pool } from '../db.js';

/**
 * Extend Express Request to include user
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        handle: string;
      };
    }
  }
}

/**
 * Middleware: Require valid JWT token
 * Sets req.user if token is valid
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
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

  req.user = payload;
  next();
}

/**
 * Middleware: Require that the character belongs to the current user
 * Must be used after requireAuth
 */
export async function requireCharacterOwner(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }

  const characterId = req.params.id || req.body?.characterId;
  if (!characterId) {
    return res.status(400).json({ error: 'CHARACTER_ID_REQUIRED' });
  }

  const charQ = await pool.query(
    'select user_id as "userId" from characters where id = $1 limit 1',
    [characterId]
  );

  if (!charQ.rows[0]) {
    return res.status(404).json({ error: 'CHARACTER_NOT_FOUND' });
  }

  if (charQ.rows[0].userId !== req.user.id) {
    return res.status(403).json({ error: 'FORBIDDEN' });
  }

  next();
}
