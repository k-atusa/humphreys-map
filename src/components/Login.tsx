import { useState } from 'react';
import { login, register } from '../services/authService';
import './Login.css';

interface LoginProps {
  onLoginSuccess: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [id, setId] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isRegisterMode) {
        // 회원가입
        const result = await register(id, nickname, password);
        
        if (result.success) {
          alert('회원가입이 완료되었습니다. 로그인해주세요.');
          setIsRegisterMode(false);
          setPassword('');
        } else {
          setError(result.message);
        }
      } else {
        // 로그인
        const result = await login(id, password);
        
        if (result.success) {
          onLoginSuccess();
        } else {
          setError(result.message);
        }
      }
    } catch (error) {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setError('');
    setPassword('');
    setNickname('');
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>🗺️ Humphreys Map</h1>
          <p>군부대 내비게이션 시스템</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="id">아이디</label>
            <input
              type="text"
              id="id"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="영문, 숫자 4-20자"
              required
              disabled={isLoading}
            />
          </div>

          {isRegisterMode && (
            <div className="form-group">
              <label htmlFor="nickname">닉네임</label>
              <input
                type="text"
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="닉네임을 입력하세요"
                required
                disabled={isLoading}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isRegisterMode ? '최소 6자 이상' : '비밀번호를 입력하세요'}
              required
              disabled={isLoading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? '처리 중...' : (isRegisterMode ? '회원가입' : '로그인')}
          </button>

          <button
            type="button"
            className="toggle-button"
            onClick={toggleMode}
            disabled={isLoading}
          >
            {isRegisterMode ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
          </button>
        </form>
      </div>
    </div>
  );
}
