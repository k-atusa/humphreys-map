import { useEffect } from 'react';
import MapView from './components/MapView';
import './App.css';

function App() {
  const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

  useEffect(() => {
    // PWA 서비스 워커 등록 확인
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        console.log('PWA 서비스 워커가 준비되었습니다.');
      });
    }
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>🗺️ Humphreys Map</h1>
        <div className="status-bar">
          <span className="status-online">● 온라인</span>
        </div>
      </header>
      <main className="app-main">
        <MapView mapboxToken={mapboxToken} />
      </main>
    </div>
  );
}

export default App;
