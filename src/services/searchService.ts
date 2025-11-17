import { SearchResult } from '../components/SearchResults';
import { searchBuildings } from './apiService';

// Camp Humphreys 기본 위치 (현재 위치를 얻지 못했을 때 사용)
const DEFAULT_LOCATION = {
  latitude: 36.9686,
  longitude: 127.0374
};

/**
 * 현재 위치 가져오기
 */
function getCurrentLocation(): Promise<{latitude: number, longitude: number}> {
  return new Promise((resolve) => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        () => {
          // 위치 정보를 가져올 수 없으면 기본 위치 사용
          resolve(DEFAULT_LOCATION);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      resolve(DEFAULT_LOCATION);
    }
  });
}

// 백엔드 API를 통해 장소 검색
export async function searchPlaces(query: string): Promise<SearchResult[]> {
  if (!query.trim()) {
    return [];
  }

  try {
    // 현재 위치 가져오기
    const currentLocation = await getCurrentLocation();
    
    // 백엔드 API에서 검색
    const buildings = await searchBuildings(query);
    
    const results: SearchResult[] = buildings.map(building => ({
      id: building.buildingNumber,
      name: building.name,
      address: building.address || '',
      category: building.category,
      latitude: building.latitude,
      longitude: building.longitude,
      distance: calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        building.latitude,
        building.longitude
      )
    }));

    // 거리순으로 정렬
    return results.sort((a, b) => {
      const distA = parseFloat(a.distance?.replace('km', '').replace('m', '') || '0') || 0;
      const distB = parseFloat(b.distance?.replace('km', '').replace('m', '') || '0') || 0;
      return distA - distB;
    });
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

// 두 좌표 사이의 거리 계산 (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const R = 6371; // 지구 반지름 (km)
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // km 단위

  // 1km 미만은 m로 표시
  if (distance < 1) {
    const meters = Math.round(distance * 1000);
    return `${meters}m`;
  }
  // 1km 이상은 km로 표시 (소수점 둘째 자리까지)
  return `${distance.toFixed(2)}km`;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
