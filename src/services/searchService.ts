import { SearchResult } from '../components/SearchResults';
import { searchBuildings } from './apiService';

// 백엔드 API를 통해 장소 검색
export async function searchPlaces(query: string): Promise<SearchResult[]> {
  if (!query.trim()) {
    return [];
  }

  try {
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
        36.9686,
        127.0374,
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
  const distance = R * c;

  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(1)}km`;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
