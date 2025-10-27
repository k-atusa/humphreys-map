import { useState, useEffect } from 'react';
import Map, { Marker, NavigationControl, GeolocateControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './MapView.css';
import SearchBar from './SearchBar';
import SideMenu from './SideMenu';
import SearchResults, { SearchResult } from './SearchResults';
import { searchPlaces } from '../services/searchService';

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
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchResultsOpen, setIsSearchResultsOpen] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (query: string) => {
    console.log('검색어:', query);
    
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearchResultsOpen(false);
      return;
    }

    setIsSearching(true);
    
    try {
      // 실제 API 호출
      const results = await searchPlaces(query);
      setSearchResults(results);
      setIsSearchResultsOpen(true);
    } catch (error) {
      console.error('검색 오류:', error);
      setSearchResults([]);
      setIsSearchResultsOpen(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuClose = () => {
    setIsMenuOpen(false);
  };

  const handleSearchResultsClose = () => {
    setIsSearchResultsOpen(false);
  };

  const handleSelectResult = (result: SearchResult) => {
    setSelectedMarker(result);
    setViewState({
      longitude: result.longitude,
      latitude: result.latitude,
      zoom: 17
    });
    setIsSearchResultsOpen(false);
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
        
        {/* 검색 결과 마커 */}
        {searchResults.map((result) => (
          <Marker
            key={result.id}
            longitude={result.longitude}
            latitude={result.latitude}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              handleSelectResult(result);
            }}
          >
            <div className="search-marker" title={result.name}>
              {getCategoryIcon(result.category)}
            </div>
          </Marker>
        ))}
        
        {/* 선택된 마커 강조 */}
        {selectedMarker && (
          <Marker
            longitude={selectedMarker.longitude}
            latitude={selectedMarker.latitude}
            anchor="bottom"
          >
            <div className="selected-marker">
              {getCategoryIcon(selectedMarker.category)}
            </div>
          </Marker>
        )}
      </Map>
      
      <SearchResults
        results={searchResults}
        isOpen={isSearchResultsOpen}
        onClose={handleSearchResultsClose}
        onSelectResult={handleSelectResult}
      />
    </div>
  );
}

function getCategoryIcon(category: string): string {
  const iconMap: { [key: string]: string } = {
    '카페': '☕',
    '음식점': '🍴',
    '편의점': '🏪',
    '병원': '🏥',
    '약국': '💊',
    '은행': '🏦',
    '주유소': '⛽',
    '주차장': '🅿️',
    '학교': '🏫',
    '관공서': '🏛️',
    '숙박': '🏨',
    '문화시설': '🎭',
    '체육시설': '⚽',
    '쇼핑': '🛍️',
    'default': '📍'
  };
  
  return iconMap[category] || iconMap['default'];
}
