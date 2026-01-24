import { useState, useEffect } from 'react';
import { 
  getRoute, 
  formatDistance, 
  formatDuration, 
  getTransportIcon, 
  getTransportName,
  type TransportMode,
  type RouteCoordinate,
  type RouteResult,
  type RouteStep
} from '../services/routingService';
import './DirectionsPanel.css';

interface DirectionsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  origin: RouteCoordinate | null;
  destination: RouteCoordinate | null;
  onRouteCalculated: (route: RouteResult | null) => void;
  onSetOrigin: () => void;
  onSetDestination: () => void;
  onSwapLocations: () => void;
  onClearRoute: () => void;
}

export default function DirectionsPanel({
  isOpen,
  onClose,
  origin,
  destination,
  onRouteCalculated,
  onSetOrigin,
  onSetDestination,
  onSwapLocations,
  onClearRoute
}: DirectionsPanelProps) {
  const [selectedMode, setSelectedMode] = useState<TransportMode>('driving');
  const [routes, setRoutes] = useState<RouteResult[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSteps, setShowSteps] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // 출발지/도착지가 변경되면 경로 재계산
  useEffect(() => {
    if (origin && destination) {
      calculateRoute();
    } else {
      setRoutes([]);
      onRouteCalculated(null);
    }
  }, [origin, destination, selectedMode]);

  const calculateRoute = async () => {
    if (!origin || !destination) return;

    setIsLoading(true);
    setError(null);

    const result = await getRoute(origin, destination, selectedMode);

    if (result.success && result.routes && result.routes.length > 0) {
      setRoutes(result.routes);
      setSelectedRouteIndex(0);
      onRouteCalculated(result.routes[0]);
    } else {
      setRoutes([]);
      setError(result.error || '경로를 찾을 수 없습니다.');
      onRouteCalculated(null);
    }

    setIsLoading(false);
  };

  const handleModeChange = (mode: TransportMode) => {
    setSelectedMode(mode);
    setSelectedRouteIndex(0);
  };

  const handleRouteSelect = (index: number) => {
    setSelectedRouteIndex(index);
    onRouteCalculated(routes[index]);
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };

  const handleClear = () => {
    setRoutes([]);
    setError(null);
    onClearRoute();
  };

  const selectedRoute = routes[selectedRouteIndex];

  if (!isOpen) return null;

  return (
    <div className={`directions-panel ${isClosing ? 'closing' : ''}`}>
      <div className="directions-header">
        <h2>🧭 길안내</h2>
        <button className="close-btn" onClick={handleClose}>✕</button>
      </div>

      {/* 교통수단 선택 */}
      <div className="transport-modes">
        {(['driving', 'cycling', 'walking'] as TransportMode[]).map((mode) => (
          <button
            key={mode}
            className={`mode-btn ${selectedMode === mode ? 'active' : ''}`}
            onClick={() => handleModeChange(mode)}
            title={getTransportName(mode)}
          >
            <span className="mode-icon">{getTransportIcon(mode)}</span>
            <span className="mode-name">{getTransportName(mode)}</span>
          </button>
        ))}
      </div>

      {/* 출발지/도착지 입력 */}
      <div className="location-inputs">
        <div className="location-row">
          <div className="location-marker origin">출발</div>
          <div 
            className={`location-input ${origin ? 'filled' : ''}`}
            onClick={onSetOrigin}
          >
            {origin?.name || '출발지를 선택하세요'}
          </div>
        </div>
        
        <button className="swap-btn" onClick={onSwapLocations} title="출발지/도착지 바꾸기">
          ⇅
        </button>
        
        <div className="location-row">
          <div className="location-marker destination">도착</div>
          <div 
            className={`location-input ${destination ? 'filled' : ''}`}
            onClick={onSetDestination}
          >
            {destination?.name || '도착지를 선택하세요'}
          </div>
        </div>
      </div>

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="directions-loading">
          <div className="loading-spinner"></div>
          <span>경로 검색 중...</span>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="directions-error">
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* 경로 결과 */}
      {!isLoading && selectedRoute && (
        <div className="route-results">
          {/* 경로 요약 */}
          <div className="route-summary">
            <div className="route-info">
              <span className="route-duration">{formatDuration(selectedRoute.duration)}</span>
              <span className="route-distance">{formatDistance(selectedRoute.distance)}</span>
            </div>
            {routes.length > 1 && (
              <div className="route-alternatives">
                {routes.map((_, index) => (
                  <button
                    key={index}
                    className={`alt-route-btn ${selectedRouteIndex === index ? 'active' : ''}`}
                    onClick={() => handleRouteSelect(index)}
                  >
                    {index === 0 ? '추천' : `대안 ${index}`}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 단계별 안내 토글 */}
          <button 
            className="toggle-steps-btn"
            onClick={() => setShowSteps(!showSteps)}
          >
            {showSteps ? '안내 숨기기 ▲' : '상세 안내 보기 ▼'}
          </button>

          {/* 단계별 안내 */}
          {showSteps && selectedRoute.legs[0]?.steps && (
            <div className="route-steps">
              {selectedRoute.legs[0].steps.map((step, index) => (
                <div key={index} className="step-item">
                  <div className="step-icon">
                    {getStepIcon(step)}
                  </div>
                  <div className="step-content">
                    <div className="step-instruction">{step.instruction}</div>
                    <div className="step-distance">{formatDistance(step.distance)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 경로 초기화 버튼 */}
          <button className="clear-route-btn" onClick={handleClear}>
            경로 지우기
          </button>
        </div>
      )}
    </div>
  );
}

function getStepIcon(step: RouteStep): string {
  const type = step.maneuver.type;
  const modifier = step.maneuver.modifier;

  if (type === 'depart') return '🚩';
  if (type === 'arrive') return '🏁';
  
  if (modifier?.includes('right')) return '➡️';
  if (modifier?.includes('left')) return '⬅️';
  if (modifier === 'straight') return '⬆️';
  if (modifier === 'uturn') return '↩️';
  
  if (type === 'roundabout' || type === 'rotary') return '🔄';
  if (type === 'merge') return '↗️';
  if (type === 'fork') return '🔀';
  
  return '➡️';
}
