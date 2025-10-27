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
      <MapView mapboxToken={mapboxToken} />
    </div>
  );
}

export default App;
