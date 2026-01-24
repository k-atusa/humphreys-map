import { useEffect, useState } from 'react';
import MapView from './components/MapView';
import Login from './components/Login';
import { validateToken, getCurrentUser, type User } from './services/authService';
import './App.css';

function App() {
  const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoginClosing, setIsLoginClosing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  const toggleDarkMode = () => {
    setIsDarkMode((prev: boolean) => {
      const newValue = !prev;
      localStorage.setItem('darkMode', JSON.stringify(newValue));
      return newValue;
    });
  };

  useEffect(() => {
    // PWA 서비스 워커 등록 확인
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        console.log('PWA 서비스 워커가 준비되었습니다.');
      });
    }

    // 인증 확인
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setIsLoading(true);
    const result = await validateToken();
    
    if (result.success && result.user) {
      setUser(result.user);
    } else {
      setUser(null);
    }
    
    setIsLoading(false);
  };

  const handleLoginSuccess = () => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    handleCloseLogin();
  };

  const handleOpenLogin = () => {
    setIsLoginClosing(false);
    setShowLoginModal(true);
  };

  const handleCloseLogin = () => {
    if (isLoginClosing) return;
    setIsLoginClosing(true);
    setTimeout(() => {
      setShowLoginModal(false);
      setIsLoginClosing(false);
    }, 200);
  };

  if (isLoading) {
    return (
      <div className="app loading-screen">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`app ${isDarkMode ? 'dark-mode' : ''}`}>
      <MapView 
        mapboxToken={mapboxToken} 
        user={user} 
        onLoginRequest={handleOpenLogin}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
      />
      {showLoginModal && (
        <div className={`login-modal-overlay ${isLoginClosing ? 'closing' : ''}`} onClick={handleCloseLogin}>
          <div className={`login-modal-content ${isLoginClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
            <button className="login-modal-close" onClick={handleCloseLogin}>✕</button>
            <Login onLoginSuccess={handleLoginSuccess} />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
