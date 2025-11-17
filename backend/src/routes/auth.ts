import { Router } from 'express';
import {
  login,
  register,
  validateToken,
  logout
} from '../controllers/authController';

const router = Router();

/**
 * 로그인
 * POST /api/auth/login
 */
router.post('/login', login);

/**
 * 회원가입
 * POST /api/auth/register
 */
router.post('/register', register);

/**
 * 토큰 검증
 * GET /api/auth/validate
 */
router.get('/validate', validateToken);

/**
 * 로그아웃
 * POST /api/auth/logout
 */
router.post('/logout', logout);

export default router;
