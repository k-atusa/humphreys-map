// OSRM 라우팅 서비스
// 백엔드 프록시를 통해 OSRM API 호출

export type TransportMode = 'driving' | 'cycling' | 'walking';

export interface RouteCoordinate {
  latitude: number;
  longitude: number;
  name?: string;
}

export interface RouteStep {
  distance: number; // meters
  duration: number; // seconds
  instruction: string;
  name: string;
  maneuver: {
    type: string;
    modifier?: string;
    location: [number, number]; // [longitude, latitude]
  };
}

export interface RouteLeg {
  distance: number; // meters
  duration: number; // seconds
  steps: RouteStep[];
  summary: string;
}

export interface RouteResult {
  distance: number; // meters
  duration: number; // seconds
  geometry: GeoJSON.LineString;
  legs: RouteLeg[];
}

export interface RoutingResponse {
  success: boolean;
  routes?: RouteResult[];
  error?: string;
}

// 백엔드 API 서버
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * 백엔드 프록시를 통해 OSRM API로 경로를 계산합니다
 */
export async function getRoute(
  origin: RouteCoordinate,
  destination: RouteCoordinate,
  mode: TransportMode = 'driving'
): Promise<RoutingResponse> {
  try {
    const originCoord = `${origin.longitude},${origin.latitude}`;
    const destCoord = `${destination.longitude},${destination.latitude}`;
    
    const url = `${API_BASE_URL}/routing/route?origin=${originCoord}&destination=${destCoord}&mode=${mode}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.code !== 'Ok') {
      return {
        success: false,
        error: getErrorMessage(data.code) || data.error
      };
    }
    
    const routes: RouteResult[] = data.routes.map((route: any) => ({
      distance: route.distance,
      duration: route.duration,
      geometry: route.geometry,
      legs: route.legs.map((leg: any) => ({
        distance: leg.distance,
        duration: leg.duration,
        summary: leg.summary || '',
        steps: leg.steps?.map((step: any) => ({
          distance: step.distance,
          duration: step.duration,
          instruction: generateInstruction(step),
          name: step.name || '',
          maneuver: {
            type: step.maneuver.type,
            modifier: step.maneuver.modifier,
            location: step.maneuver.location
          }
        })) || []
      }))
    }));
    
    return {
      success: true,
      routes
    };
  } catch (error) {
    console.error('Routing error:', error);
    return {
      success: false,
      error: '경로를 계산하는 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 에러 코드를 사용자 친화적 메시지로 변환
 */
function getErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    'NoRoute': '경로를 찾을 수 없습니다.',
    'NoSegment': '출발지 또는 도착지가 도로와 연결되지 않았습니다.',
    'TooBig': '요청이 너무 큽니다.',
    'InvalidUrl': '잘못된 요청입니다.',
    'InvalidService': '서비스를 사용할 수 없습니다.',
    'InvalidVersion': '지원하지 않는 버전입니다.',
    'InvalidOptions': '잘못된 옵션입니다.',
    'InvalidQuery': '잘못된 쿼리입니다.',
    'InvalidValue': '잘못된 값입니다.'
  };
  return messages[code] || '알 수 없는 오류가 발생했습니다.';
}

/**
 * 한국어 안내 문구 생성
 */
function generateInstruction(step: any): string {
  const { type, modifier } = step.maneuver;
  const name = step.name || '도로';
  
  const modifierText: Record<string, string> = {
    'uturn': 'U턴',
    'sharp right': '크게 우회전',
    'right': '우회전',
    'slight right': '살짝 우회전',
    'straight': '직진',
    'slight left': '살짝 좌회전',
    'left': '좌회전',
    'sharp left': '크게 좌회전'
  };
  
  const typeText: Record<string, string> = {
    'depart': '출발',
    'arrive': '도착',
    'turn': modifier ? modifierText[modifier] || '회전' : '회전',
    'merge': '합류',
    'on ramp': '진입로로 진입',
    'off ramp': '진출로로 나감',
    'fork': modifier?.includes('right') ? '오른쪽 갈림길' : '왼쪽 갈림길',
    'end of road': '도로 끝',
    'continue': '계속 직진',
    'roundabout': '회전교차로',
    'rotary': '로터리',
    'roundabout turn': '회전교차로에서 회전',
    'notification': '안내',
    'exit roundabout': '회전교차로 나감',
    'exit rotary': '로터리 나감'
  };
  
  if (type === 'depart') {
    return `${name}에서 출발`;
  }
  
  if (type === 'arrive') {
    return '목적지 도착';
  }
  
  const action = typeText[type] || modifierText[modifier || ''] || '진행';
  
  if (name && name !== '') {
    return `${action}하여 ${name}(으)로 진입`;
  }
  
  return action;
}

/**
 * 거리를 사람이 읽기 쉬운 형식으로 변환
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * 시간을 사람이 읽기 쉬운 형식으로 변환
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}초`;
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}분`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}시간`;
  }
  
  return `${hours}시간 ${remainingMinutes}분`;
}

/**
 * 교통수단별 아이콘
 */
export function getTransportIcon(mode: TransportMode): string {
  const icons: Record<TransportMode, string> = {
    driving: '🚗',
    cycling: '🚴',
    walking: '🚶'
  };
  return icons[mode];
}

/**
 * 교통수단별 한국어 이름
 */
export function getTransportName(mode: TransportMode): string {
  const names: Record<TransportMode, string> = {
    driving: '자동차',
    cycling: '자전거',
    walking: '도보'
  };
  return names[mode];
}
