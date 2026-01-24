import { useState, useRef } from 'react';
import Map, { Marker, NavigationControl, GeolocateControl, MapRef, Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './MapView.css';
import SearchBar, { SearchResultItem } from './SearchBar';
import SideMenu from './SideMenu';
import SearchResults, { SearchResult } from './SearchResults';
import AddLocationPopup from './AddLocationPopup';
import BuildingInfoPopup from './BuildingInfoPopup';
import CategoryFilter from './CategoryFilter';
import DirectionsPanel from './DirectionsPanel';
import { searchPlaces } from '../services/searchService';
import { getAllBuildings, getBuildingsByCategory } from '../services/apiService';
import type { User } from '../services/authService';
import type { MapContextMenuEvent, MapLongPressEvent } from '../types/mapEvents';
import type { RouteCoordinate, RouteResult } from '../services/routingService';

interface MapViewProps {
  mapboxToken?: string;
  user: User | null;
  onLoginRequest?: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

// Camp Humphreys (USAG Humphreys) 정확한 좌표 (경기도 평택시)
const INITIAL_VIEW_STATE = {
  longitude: 127.0374,
  latitude: 36.9686,
  zoom: 15
};

export default function MapView({ mapboxToken, user, onLoginRequest, isDarkMode, onToggleDarkMode }: MapViewProps) {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]); // 검색창 결과
  const [categoryResults, setCategoryResults] = useState<SearchResult[]>([]); // 카테고리 결과
  const [isCategoryResultsOpen, setIsCategoryResultsOpen] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<SearchResult | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showBuildingInfo, setShowBuildingInfo] = useState(false);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [addLocationCoords, setAddLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  
  // 길안내 관련 상태
  const [showDirections, setShowDirections] = useState(false);
  const [directionsOrigin, setDirectionsOrigin] = useState<RouteCoordinate | null>(null);
  const [directionsDestination, setDirectionsDestination] = useState<RouteCoordinate | null>(null);
  const [currentRoute, setCurrentRoute] = useState<RouteResult | null>(null);
  const [isSelectingLocation, setIsSelectingLocation] = useState<'origin' | 'destination' | null>(null);
  
  const mapRef = useRef<MapRef>(null);
  const longPressTimer = useRef<number | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const isAdmin = user?.id === 'admin';

  // 지도에 표시할 마커 (검색 결과 + 카테고리 결과)
  const displayMarkers = categoryResults.length > 0 ? categoryResults : searchResults;

  // 경로 GeoJSON 데이터
  const routeGeoJSON: GeoJSON.Feature<GeoJSON.LineString> | null = currentRoute?.geometry ? {
    type: 'Feature',
    properties: {},
    geometry: currentRoute.geometry
  } : null;

  const handleSearch = async (query: string) => {
    console.log('검색어:', query);
    
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    // spinner/UX state can be added later if needed
    
    try {
      // 실제 API 호출
      const results = await searchPlaces(query);
      setSearchResults(results);
    } catch (error) {
      console.error('검색 오류:', error);
      setSearchResults([]);
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

  const handleSelectResult = (result: SearchResult | SearchResultItem) => {
    // SearchResultItem을 SearchResult로 변환 (필요한 경우)
    const allResults = [...searchResults, ...categoryResults];
    const fullResult = allResults.find(r => r.id === result.id) || result as SearchResult;
    setSelectedMarker(fullResult);
    setShowBuildingInfo(true);
    setIsCategoryResultsOpen(false); // 팝업 닫기
    
    // 부드러운 이동 애니메이션
    mapRef.current?.flyTo({
      center: [result.longitude, result.latitude],
      zoom: 17,
      duration: 1500, // 1.5초
      essential: true
    });
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
    
    // 터치 시작 위치 기록
    if (e.point) {
      touchStartPos.current = { x: e.point.x, y: e.point.y };
    }
    
    longPressTimer.current = window.setTimeout(() => {
      const map = mapRef.current?.getMap();
      if (map && e.point) {
        const lngLat = map.unproject(e.point);
        setAddLocationCoords({ lat: lngLat.lat, lng: lngLat.lng });
        setShowAddLocation(true);
      }
    }, 500); // 500ms 길게 누르기
  };

  // 터치 이동 감지 (지도 pan 중에는 타이머 취소)
  const handleTouchMove = (e: MapLongPressEvent) => {
    if (!isAdmin || !touchStartPos.current || !e.point) return;
    
    // 이동 거리 계산 (5px 이상 이동하면 pan으로 간주)
    const dx = e.point.x - touchStartPos.current.x;
    const dy = e.point.y - touchStartPos.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 5) {
      // 지도 이동 중이므로 타이머 취소
      if (longPressTimer.current) {
        window.clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      touchStartPos.current = null;
    }
  };

  // 길게 누르기 취소
  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    touchStartPos.current = null;
  };

  const handleAddLocationClose = () => {
    setShowAddLocation(false);
    setAddLocationCoords(null);
  };

  const handleAddLocationSuccess = async () => {
    // 선택된 카테고리가 있으면 해당 카테고리의 결과를 다시 조회
    if (selectedCategory) {
      await handleCategorySelect(selectedCategory);
    } else if (searchResults.length > 0) {
      // 검색 결과가 있으면 검색 결과 새로고침
      const lastQuery = searchResults[0]?.name || '';
      if (lastQuery) {
        const results = await searchPlaces(lastQuery);
        setSearchResults(results);
      }
    }
  };

  const handleCategorySelect = async (category: string | null | undefined) => {
    // undefined는 선택 해제 시그널
    if (category === undefined) {
      setSelectedCategory(null);
      setSelectedMarker(null);
      setCategoryResults([]);
      setIsCategoryResultsOpen(false);
      return;
    }

    setSelectedCategory(category);
    setSelectedMarker(null);
    
    try {
      let buildings: any[] = [];
      if (category === 'all') {
        // 전체 건물 조회
        buildings = await getAllBuildings();
      } else if (category) {
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
      
      setCategoryResults(results);
      setIsCategoryResultsOpen(true); // 팝업 열기
    } catch (error) {
      console.error('Category filter error:', error);
    }
  };

  // 길안내 관련 핸들러
  const handleToggleDirections = () => {
    setShowDirections(!showDirections);
    if (showDirections) {
      // 닫을 때 초기화
      setDirectionsOrigin(null);
      setDirectionsDestination(null);
      setCurrentRoute(null);
      setIsSelectingLocation(null);
    }
  };

  const handleSetOrigin = () => {
    setIsSelectingLocation('origin');
  };

  const handleSetDestination = () => {
    setIsSelectingLocation('destination');
  };

  const handleSwapLocations = () => {
    const temp = directionsOrigin;
    setDirectionsOrigin(directionsDestination);
    setDirectionsDestination(temp);
  };

  const handleClearRoute = () => {
    setDirectionsOrigin(null);
    setDirectionsDestination(null);
    setCurrentRoute(null);
    setIsSelectingLocation(null);
  };

  const handleMapClick = (e: any) => {
    if (isSelectingLocation && e.lngLat) {
      const coord: RouteCoordinate = {
        latitude: e.lngLat.lat,
        longitude: e.lngLat.lng,
        name: `${e.lngLat.lat.toFixed(5)}, ${e.lngLat.lng.toFixed(5)}`
      };

      if (isSelectingLocation === 'origin') {
        setDirectionsOrigin(coord);
      } else {
        setDirectionsDestination(coord);
      }
      setIsSelectingLocation(null);
    }
  };

  // 건물을 출발지/도착지로 설정
  const handleSetBuildingAsOrigin = (building: SearchResult) => {
    setDirectionsOrigin({
      latitude: building.latitude,
      longitude: building.longitude,
      name: building.name
    });
    setShowDirections(true);
    setShowBuildingInfo(false);
  };

  const handleSetBuildingAsDestination = (building: SearchResult) => {
    setDirectionsDestination({
      latitude: building.latitude,
      longitude: building.longitude,
      name: building.name
    });
    setShowDirections(true);
    setShowBuildingInfo(false);
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
    <div className={`map-container ${isDarkMode ? 'dark-mode' : ''}`}>
      <SideMenu 
        isOpen={isMenuOpen} 
        onClose={handleMenuClose} 
        user={user} 
        onLoginRequest={onLoginRequest}
        onDirectionsClick={handleToggleDirections}
        isDarkMode={isDarkMode}
        onToggleDarkMode={onToggleDarkMode}
      />
      <SearchBar 
        onSearch={handleSearch} 
        onMenuClick={handleMenuToggle}
        searchResults={searchResults}
        onSelectResult={handleSelectResult}
      />
      <CategoryFilter 
        selectedCategory={selectedCategory} 
        onSelectCategory={handleCategorySelect} 
      />
      
      {/* 위치 선택 모드 안내 */}
      {isSelectingLocation && (
        <div className="location-select-hint">
          <span>
            {isSelectingLocation === 'origin' ? '🔵 출발지' : '🔴 도착지'}를 지도에서 선택하세요
          </span>
          <button onClick={() => setIsSelectingLocation(null)}>취소</button>
        </div>
      )}
      
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onClick={handleMapClick}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        mapStyle={mapStyle as any}
        mapboxAccessToken={mapboxToken}
        style={{ width: '100%', height: '100%', cursor: isSelectingLocation ? 'crosshair' : 'grab' }}
        trackResize={true}
        attributionControl={true}
      >
        <NavigationControl position="top-right" />
        <GeolocateControl
          position="top-right"
          trackUserLocation
          showUserHeading
        />
        
        {/* 경로 표시 레이어 */}
        {routeGeoJSON && (
          <Source id="route" type="geojson" data={routeGeoJSON}>
            <Layer
              id="route-line-bg"
              type="line"
              paint={{
                'line-color': '#1a73e8',
                'line-width': 8,
                'line-opacity': 0.4
              }}
            />
            <Layer
              id="route-line"
              type="line"
              paint={{
                'line-color': '#1a73e8',
                'line-width': 4,
                'line-opacity': 1
              }}
            />
          </Source>
        )}
        
        {/* 출발지 마커 */}
        {directionsOrigin && (
          <Marker
            longitude={directionsOrigin.longitude}
            latitude={directionsOrigin.latitude}
            anchor="bottom"
          >
            <div className="directions-marker origin-marker" title="출발지">
              🔵
            </div>
          </Marker>
        )}
        
        {/* 도착지 마커 */}
        {directionsDestination && (
          <Marker
            longitude={directionsDestination.longitude}
            latitude={directionsDestination.latitude}
            anchor="bottom"
          >
            <div className="directions-marker destination-marker" title="도착지">
              🔴
            </div>
          </Marker>
        )}
        
        {/* 검색 결과 마커 */}
        {displayMarkers.map((result, index) => {
          const isSelected = selectedMarker?.id === result.id;
          return (
            <Marker
              key={`marker-${result.id}-${index}`}
              longitude={result.longitude}
              latitude={result.latitude}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                
                // 위치 선택 모드일 때
                if (isSelectingLocation) {
                  const coord: RouteCoordinate = {
                    latitude: result.latitude,
                    longitude: result.longitude,
                    name: result.name
                  };
                  if (isSelectingLocation === 'origin') {
                    setDirectionsOrigin(coord);
                  } else {
                    setDirectionsDestination(coord);
                  }
                  setIsSelectingLocation(null);
                  return;
                }
                
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

      {/* 길안내 패널 */}
      <DirectionsPanel
        isOpen={showDirections}
        onClose={handleToggleDirections}
        origin={directionsOrigin}
        destination={directionsDestination}
        onRouteCalculated={setCurrentRoute}
        onSetOrigin={handleSetOrigin}
        onSetDestination={handleSetDestination}
        onSwapLocations={handleSwapLocations}
        onClearRoute={handleClearRoute}
      />

      {showBuildingInfo && selectedMarker && (
        <BuildingInfoPopup
          building={selectedMarker}
          onClose={() => setShowBuildingInfo(false)}
          onSetAsOrigin={() => handleSetBuildingAsOrigin(selectedMarker)}
          onSetAsDestination={() => handleSetBuildingAsDestination(selectedMarker)}
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

      {/* 카테고리 선택 시 검색 결과 팝업 */}
      <SearchResults
        results={categoryResults}
        isOpen={isCategoryResultsOpen}
        onClose={() => setIsCategoryResultsOpen(false)}
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
