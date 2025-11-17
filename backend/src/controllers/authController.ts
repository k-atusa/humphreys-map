import { Request, Response } from 'express';
import { getDatabase } from '../config/mongodb';
import { AccountData, LoginRequest, RegisterRequest } from '../types/account';
import crypto from 'crypto';

const ACCOUNT_COLLECTION = 'account';

/**
 * SHA-256 해시 생성
 */
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * 간단한 JWT 토큰 생성 (실제 프로덕션에서는 jsonwebtoken 라이브러리 사용 권장)
 */
function generateToken(userId: string): string {
  const payload = {
    userId,
    timestamp: Date.now()
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/**
 * 토큰 검증
 */
function verifyToken(token: string): { userId: string } | null {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    // 토큰 유효기간 체크 (24시간)
    if (Date.now() - payload.timestamp > 24 * 60 * 60 * 1000) {
      return null;
    }
    return { userId: payload.userId };
  } catch {
    return null;
  }
}

/**
 * 로그인
 * POST /api/auth/login
 */
export async function login(req: Request, res: Response) {
  try {
    const { id, password }: LoginRequest = req.body;

    if (!id || !password) {
      return res.status(400).json({
        success: false,
        message: 'ID와 비밀번호를 입력하세요.'
      });
    }

    const db = getDatabase();
    const accountCollection = db.collection(ACCOUNT_COLLECTION);

    // 사용자 조회
    const account = await accountCollection.findOne({ id }) as any;

    if (!account) {
      return res.status(401).json({
        success: false,
        message: '존재하지 않는 계정입니다.'
      });
    }

    // 비밀번호 확인
    const hashedPassword = hashPassword(password);
    if (account.password !== hashedPassword) {
      return res.status(401).json({
        success: false,
        message: '비밀번호가 일치하지 않습니다.'
      });
    }

    // 토큰 생성
    const token = generateToken(account.id);

    res.json({
      success: true,
      message: '로그인 성공',
      token,
      user: {
        id: account.id,
        nickname: account.nickname
      }
    });
  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(500).json({
      success: false,
      message: '로그인 중 오류가 발생했습니다.'
    });
  }
}

/**
 * 회원가입
 * POST /api/auth/register
 */
export async function register(req: Request, res: Response) {
  try {
    const { id, nickname, password }: RegisterRequest = req.body;

    // 필수 필드 검증
    if (!id || !nickname || !password) {
      return res.status(400).json({
        success: false,
        message: 'ID, 닉네임, 비밀번호를 모두 입력하세요.'
      });
    }

    // ID 유효성 검증 (영문, 숫자만 허용, 4-20자)
    if (!/^[a-zA-Z0-9]{4,20}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID는 영문과 숫자 4-20자로 입력하세요.'
      });
    }

    // 비밀번호 길이 검증 (최소 6자)
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: '비밀번호는 최소 6자 이상이어야 합니다.'
      });
    }

    const db = getDatabase();
    const accountCollection = db.collection(ACCOUNT_COLLECTION);

    // 중복 ID 확인
    const existingAccount = await accountCollection.findOne({ id });
    if (existingAccount) {
      return res.status(409).json({
        success: false,
        message: '이미 사용 중인 ID입니다.'
      });
    }

    // 비밀번호 해시화
    const hashedPassword = hashPassword(password);

    // 계정 생성
    const newAccount: AccountData = {
      id,
      nickname,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await accountCollection.insertOne(newAccount);

    res.status(201).json({
      success: true,
      message: '회원가입이 완료되었습니다.'
    });
  } catch (error) {
    console.error('회원가입 오류:', error);
    res.status(500).json({
      success: false,
      message: '회원가입 중 오류가 발생했습니다.'
    });
  }
}

/**
 * 토큰 검증
 * GET /api/auth/validate
 */
export async function validateToken(req: Request, res: Response) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '토큰이 없습니다.'
      });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({
        success: false,
        message: '유효하지 않은 토큰입니다.'
      });
    }

    const db = getDatabase();
    const accountCollection = db.collection(ACCOUNT_COLLECTION);

    // 사용자 정보 조회
    const account = await accountCollection.findOne({ id: payload.userId }) as any;

    if (!account) {
      return res.status(401).json({
        success: false,
        message: '존재하지 않는 계정입니다.'
      });
    }

    res.json({
      success: true,
      user: {
        id: account.id,
        nickname: account.nickname
      }
    });
  } catch (error) {
    console.error('토큰 검증 오류:', error);
    res.status(500).json({
      success: false,
      message: '토큰 검증 중 오류가 발생했습니다.'
    });
  }
}

/**
 * 로그아웃
 * POST /api/auth/logout
 */
export async function logout(req: Request, res: Response) {
  // 클라이언트에서 토큰 삭제하면 되므로 서버에서는 특별한 처리 불필요
  res.json({
    success: true,
    message: '로그아웃되었습니다.'
  });
}
