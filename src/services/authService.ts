const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface User {
  id: string;
  nickname: string;
}

export interface LoginRequest {
  id: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
}

export interface RegisterRequest {
  id: string;
  nickname: string;
  password: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
}

// 로컬 스토리지 키
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

/**
 * SHA-256 해시 생성 (브라우저)
 */
async function hashPassword(password: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 로그인
 */
export async function login(id: string, password: string): Promise<LoginResponse> {
  try {
    // 비밀번호 해시화
    const hashedPassword = await hashPassword(password);

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, password: hashedPassword }),
    });

    const data: LoginResponse = await response.json();

    if (data.success && data.token && data.user) {
      // 토큰과 사용자 정보 저장
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }

    return data;
  } catch (error) {
    console.error('로그인 오류:', error);
    return {
      success: false,
      message: '로그인 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 회원가입
 */
export async function register(id: string, nickname: string, password: string): Promise<RegisterResponse> {
  try {
    // 비밀번호 해시화
    const hashedPassword = await hashPassword(password);

    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, nickname, password: hashedPassword }),
    });

    const data: RegisterResponse = await response.json();
    return data;
  } catch (error) {
    console.error('회원가입 오류:', error);
    return {
      success: false,
      message: '회원가입 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 토큰 검증
 */
export async function validateToken(): Promise<{ success: boolean; user?: User }> {
  try {
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
      return { success: false };
    }

    const response = await fetch(`${API_BASE_URL}/auth/validate`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (data.success && data.user) {
      // 사용자 정보 업데이트
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      return { success: true, user: data.user };
    }

    // 토큰이 유효하지 않으면 삭제
    logout();
    return { success: false };
  } catch (error) {
    console.error('토큰 검증 오류:', error);
    logout();
    return { success: false };
  }
}

/**
 * 로그아웃
 */
export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * 현재 로그인한 사용자 정보 가져오기
 */
export function getCurrentUser(): User | null {
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

/**
 * 로그인 여부 확인
 */
export function isAuthenticated(): boolean {
  return !!localStorage.getItem(TOKEN_KEY);
}

/**
 * 토큰 가져오기
 */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
