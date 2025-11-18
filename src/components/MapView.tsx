import { useState, useRef } from 'react';
import Map, { Marker, NavigationControl, GeolocateControl, MapRef } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './MapView.css';
import SearchBar from './SearchBar';
import SideMenu from './SideMenu';
import SearchResults, { SearchResult } from './SearchResults';
import AddLocationPopup from './AddLocationPopup';
import BuildingInfoPopup from './BuildingInfoPopup';
import CategoryFilter from './CategoryFilter';
import { searchPlaces } from '../services/searchService';
import { getAllBuildings, getBuildingsByCategory } from '../services/apiService';
import type { User } from '../services/authService';
import type { MapContextMenuEvent, MapLongPressEvent } from '../types/mapEvents';

interface MapViewProps {
  mapboxToken?: string;
  user: User | null;
}

// Camp Humphreys (USAG Humphreys) 정확한 좌표 (경기도 평택시)
const INITIAL_VIEW_STATE = {
  longitude: 127.0374,
  latitude: 36.9686,
  zoom: 15
};

export default function MapView({ mapboxToken, user }: MapViewProps) {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchResultsOpen, setIsSearchResultsOpen] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<SearchResult | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showBuildingInfo, setShowBuildingInfo] = useState(false);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [addLocationCoords, setAddLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<MapRef>(null);
  const longPressTimer = useRef<number | null>(null);
  const isAdmin = user?.id === 'admin';

  const handleSearch = async (query: string) => {
    console.log('검색어:', query);
    
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearchResultsOpen(false);
      return;
    }

    // spinner/UX state can be added later if needed
    
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
      // no-op for now
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
    setShowBuildingInfo(true);
    
    // 부드러운 이동 애니메이션
    mapRef.current?.flyTo({
      center: [result.longitude, result.latitude],
      zoom: 17,
      duration: 1500, // 1.5초
      essential: true
    });
    
    setIsSearchResultsOpen(false);
  };

  // 마우스 오른쪽 클릭 핸들러 (관리자용)
  const handleContextMenu = (e: MapContextMenuEvent) => {
    if (!isAdmin) return;
    
    e.preventDefault();
    const { lng, lat } = e.lngLat;
    setAddLocationCoords({ lat, lng });
    setShowAddLocation(true);
  };

  // 길게 누르기 시작 (모바일용)
  const handleTouchStart = (e: MapLongPressEvent) => {
    if (!isAdmin) return;
    
    longPressTimer.current = window.setTimeout(() => {
      const map = mapRef.current?.getMap();
      if (map && e.point) {
        const lngLat = map.unproject(e.point);
        setAddLocationCoords({ lat: lngLat.lat, lng: lngLat.lng });
        setShowAddLocation(true);
      }
    }, 500); // 500ms 길게 누르기
  };

  // 길게 누르기 취소
  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleAddLocationClose = () => {
    setShowAddLocation(false);
    setAddLocationCoords(null);
  };

  const handleAddLocationSuccess = async () => {
    // 검색 결과 새로고침
    if (searchResults.length > 0) {
      const lastQuery = searchResults[0]?.name || '';
      if (lastQuery) {
        const results = await searchPlaces(lastQuery);
        setSearchResults(results);
      }
    }
  };

  const handleCategorySelect = async (category: string | null) => {
    setSelectedCategory(category);
    setSelectedMarker(null);
    
    try {
      let buildings;
      if (category === null) {
        // 전체 건물 조회
        buildings = await getAllBuildings();
      } else {
        // 카테고리별 조회
        buildings = await getBuildingsByCategory(category);
      }
      
      const results: SearchResult[] = buildings.map((building, index) => ({
        id: building.id || building.buildingNumber || `building-${index}`,
        buildingNumber: building.buildingNumber,
        name: building.name,
        address: building.address || '',
        category: building.category,
        businessHours: building.businessHours,
        contact: building.contact,
        description: building.description,
        latitude: building.latitude,
        longitude: building.longitude
      }));
      
      setSearchResults(results);
      setIsSearchResultsOpen(true);
    } catch (error) {
      console.error('Category filter error:', error);
    }
  };



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
      <SideMenu isOpen={isMenuOpen} onClose={handleMenuClose} user={user} />
      <SearchBar onSearch={handleSearch} onMenuClick={handleMenuToggle} />
      <CategoryFilter 
        selectedCategory={selectedCategory} 
        onSelectCategory={handleCategorySelect} 
      />
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        mapStyle={mapStyle as any}
        mapboxAccessToken={mapboxToken}
        style={{ width: '100%', height: '100%' }}
        trackResize={true}
        attributionControl={true}
      >
        <NavigationControl position="top-right" />
        <GeolocateControl
          position="top-right"
          trackUserLocation
          showUserHeading
        />
        
        {/* 검색 결과 마커 */}
        {searchResults.map((result, index) => {
          const isSelected = selectedMarker?.id === result.id;
          return (
            <Marker
              key={`marker-${result.id}-${index}`}
              longitude={result.longitude}
              latitude={result.latitude}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                setSelectedMarker(result);
                setShowBuildingInfo(true);
                
                // 부드러운 이동 애니메이션
                mapRef.current?.flyTo({
                  center: [result.longitude, result.latitude],
                  zoom: 17,
                  duration: 1500,
                  essential: true
                });
              }}
            >
              <div 
                className={isSelected ? "selected-marker" : "search-marker"} 
                title={result.name}
              >
                {getCategoryIcon(result.category)}
              </div>
            </Marker>
          );
        })}
      </Map>

      {showBuildingInfo && selectedMarker && (
        <BuildingInfoPopup
          building={selectedMarker}
          onClose={() => setShowBuildingInfo(false)}
        />
      )}

      {showAddLocation && addLocationCoords && (
        <AddLocationPopup
          latitude={addLocationCoords.lat}
          longitude={addLocationCoords.lng}
          onClose={handleAddLocationClose}
          onSuccess={handleAddLocationSuccess}
        />
      )}
      
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
