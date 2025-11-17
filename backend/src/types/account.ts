export interface AccountData {
  id: string;              // 사용자 ID
  nickname: string;        // 닉네임
  password: string;        // SHA-256으로 암호화된 비밀번호
  createdAt?: Date;        // 계정 생성일
  updatedAt?: Date;        // 계정 수정일
}

export interface LoginRequest {
  id: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: string;
    nickname: string;
  };
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
