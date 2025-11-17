import { useEffect, useState } from 'react';
import MapView from './components/MapView';
import Login from './components/Login';
import { validateToken, getCurrentUser, type User } from './services/authService';
import './App.css';

function App() {
  const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

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
      setIsAuthenticated(true);
      setUser(result.user);
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
    
    setIsLoading(false);
  };

  const handleLoginSuccess = () => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setIsAuthenticated(true);
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

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app">
      <MapView mapboxToken={mapboxToken} user={user} />
    </div>
  );
}

export default App;
