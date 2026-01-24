import { useEffect } from 'react';
import { logout, type User } from '../services/authService';
import './SideMenu.css';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onLoginRequest?: () => void;
  onDirectionsClick?: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export default function SideMenu({ isOpen, onClose, user, onLoginRequest, onDirectionsClick, isDarkMode, onToggleDarkMode }: SideMenuProps) {
  const isLoggedIn = !!user;

  const handleLogout = () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      logout();
      window.location.reload();
    }
  };

  const handleLogin = () => {
    onClose();
    onLoginRequest?.();
  };
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* 배경 오버레이 */}
      <div 
        className={`side-menu-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      />
      
      {/* 사이드 메뉴 */}
      <div className={`side-menu ${isOpen ? 'open' : ''}`}>
        <div className="side-menu-header">
          <div className="user-profile">
            <div className="user-avatar">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="10" r="3"></circle>
                <path d="M6.168 18.849A4 4 0 0 1 10 16h4a4 4 0 0 1 3.834 2.855"></path>
              </svg>
            </div>
            <div className="user-info">
              {isLoggedIn ? (
                <>
                  <div className="user-name">{user?.nickname || '사용자'}</div>
                  <div className="user-email">{user?.id || 'user@example.com'}</div>
                </>
              ) : (
                <>
                  <div className="user-name">게스트</div>
                  <div className="user-email">로그인이 필요합니다</div>
                </>
              )}
            </div>
          </div>
          <button className="close-button" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>

        <div className="side-menu-content">
          {/* 즐겨찾기 */}
          <div className="menu-section">
            <div className="menu-section-title">즐겨찾기</div>
            <div className="menu-item">
              <span className="menu-icon">🏠</span>
              <span className="menu-text">집</span>
              <button className="menu-action">설정</button>
            </div>
            <div className="menu-item">
              <span className="menu-icon">💼</span>
              <span className="menu-text">직장</span>
              <button className="menu-action">설정</button>
            </div>
          </div>

          {/* 구분선 */}
          <div className="menu-divider"></div>

          {/* 메뉴 항목 */}
          <div className="menu-section">
            <div className="menu-item" onClick={() => { onClose(); onDirectionsClick?.(); }}>
              <span className="menu-icon">🧭</span>
              <span className="menu-text">길안내</span>
            </div>
            <div className="menu-item">
              <span className="menu-icon">⭐</span>
              <span className="menu-text">즐겨찾는 장소</span>
            </div>
            <div className="menu-item">
              <span className="menu-icon">🕐</span>
              <span className="menu-text">최근 검색</span>
            </div>
            <div className="menu-item">
              <span className="menu-icon">📍</span>
              <span className="menu-text">저장된 장소</span>
            </div>
          </div>

          <div className="menu-divider"></div>

          {/* 설정 */}
          <div className="menu-section">
            <div className="menu-item dark-mode-toggle" onClick={onToggleDarkMode}>
              <span className="menu-icon">{isDarkMode ? '🌙' : '☀️'}</span>
              <span className="menu-text">다크 모드</span>
              <div className={`toggle-switch ${isDarkMode ? 'active' : ''}`}>
                <div className="toggle-knob"></div>
              </div>
            </div>
            <div className="menu-item">
              <span className="menu-icon">⚙️</span>
              <span className="menu-text">설정</span>
            </div>
            <div className="menu-item">
              <span className="menu-icon">ℹ️</span>
              <span className="menu-text">도움말</span>
            </div>
            <div className="menu-item">
              <span className="menu-icon">🔔</span>
              <span className="menu-text">알림 설정</span>
            </div>
          </div>

          <div className="menu-divider"></div>

          {/* 계정 관리 */}
          <div className="menu-section">
            {isLoggedIn ? (
              <>
                <div className="menu-item">
                  <span className="menu-icon">👤</span>
                  <span className="menu-text">계정 관리</span>
                </div>
                <div className="menu-item logout" onClick={handleLogout}>
                  <span className="menu-icon">🚪</span>
                  <span className="menu-text">로그아웃</span>
                </div>
              </>
            ) : (
              <div className="menu-item login" onClick={handleLogin}>
                <span className="menu-icon">🔑</span>
                <span className="menu-text">로그인</span>
              </div>
            )}
          </div>
        </div>

        <div className="side-menu-footer">
          <div className="app-version">Humphreys Map v1.0</div>
        </div>
      </div>
    </>
  );
}
