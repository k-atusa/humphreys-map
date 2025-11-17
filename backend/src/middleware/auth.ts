import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../config/mongodb';

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        nickname: string;
      };
    }
  }
}

/**
 * Middleware to validate authentication token
 */
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '인증 토큰이 필요합니다' });
    }

    const token = authHeader.substring(7);
    
    // Decode base64 token
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [id, timestampStr] = decoded.split(':');
    const timestamp = parseInt(timestampStr, 10);

    // Check token expiry (24 hours)
    const now = Date.now();
    const tokenAge = now - timestamp;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    if (tokenAge > maxAge) {
      return res.status(401).json({ error: '토큰이 만료되었습니다' });
    }

    // Verify user exists in database
    const db = getDatabase();
    const accountCollection = db.collection('account');
    const account = await accountCollection.findOne({ id });

    if (!account) {
      return res.status(401).json({ error: '유효하지 않은 토큰입니다' });
    }

    // Attach user info to request
    req.user = {
      id: account.id as string,
      nickname: account.nickname as string
    };

    next();
  } catch (error) {
    console.error('인증 오류:', error);
    return res.status(401).json({ error: '인증에 실패했습니다' });
  }
}

/**
 * Middleware to check if authenticated user is admin
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: '인증이 필요합니다' });
  }

  if (req.user.id !== 'admin') {
    return res.status(403).json({ error: '관리자 권한이 필요합니다' });
  }

  next();
}
