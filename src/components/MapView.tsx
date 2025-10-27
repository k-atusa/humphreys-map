import { useState, useEffect } from 'react';
import Map, { Marker, NavigationControl, GeolocateControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './MapView.css';
import SearchBar from './SearchBar';
import SideMenu from './SideMenu';

interface MapViewProps {
  mapboxToken?: string;
}

// Camp Humphreys (USAG Humphreys) 정확한 좌표 (경기도 평택시)
const INITIAL_VIEW_STATE = {
  longitude: 127.0374,
  latitude: 36.9686,
  zoom: 15
};

export default function MapView({ mapboxToken }: MapViewProps) {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [userLocation, setUserLocation] = useState<{ lng: number; lat: number } | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSearch = (query: string) => {
    console.log('검색어:', query);
    // TODO: 검색 기능 구현
  };

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuClose = () => {
    setIsMenuOpen(false);
  };

  useEffect(() => {
    // 사용자 위치 가져오기 (선택적)
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { longitude, latitude } = position.coords;
          setUserLocation({ lng: longitude, lat: latitude });
          // 위치를 가져왔지만 지도는 Camp Humphreys에 유지
          // 필요시 사용자 위치로 이동하려면 아래 주석을 해제하세요
          // setViewState({
          //   longitude,
          //   latitude,
          //   zoom: 16
          // });
        },
        (error) => {
          console.warn('위치 정보를 가져올 수 없습니다:', error);
        }
      );
    }
  }, []);

  // OpenStreetMap 타일 사용 (Mapbox 토큰 없이도 작동)
  const mapStyle = mapboxToken 
    ? 'mapbox://styles/mapbox/streets-v12'
    : {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap Contributors',
            maxzoom: 19
          }
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm',
            minzoom: 0,
            maxzoom: 22
          }
        ]
      };

  return (
    <div className="map-container">
      <SideMenu isOpen={isMenuOpen} onClose={handleMenuClose} />
      <SearchBar onSearch={handleSearch} onMenuClick={handleMenuToggle} />
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle={mapStyle as any}
        mapboxAccessToken={mapboxToken}
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="top-right" />
        <GeolocateControl
          position="top-right"
          trackUserLocation
          showUserHeading
        />
        
        {userLocation && (
          <Marker
            longitude={userLocation.lng}
            latitude={userLocation.lat}
            anchor="bottom"
          >
            <div className="user-marker">📍</div>
          </Marker>
        )}
      </Map>
    </div>
  );
}
