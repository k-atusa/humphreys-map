import { SearchResult } from '../components/SearchResults';
import { searchLocalBuildings } from './localBuildingService';

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

export interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  class: string;
  name?: string; // 추가: 실제 장소 이름
  address?: {
    road?: string;
    suburb?: string;
    city?: string;
    county?: string;
    state?: string;
    country?: string;
    amenity?: string;
    shop?: string;
    building?: string;
    leisure?: string;
    tourism?: string;
  };
}

// Camp Humphreys 근처 검색을 위한 바운딩 박스
const HUMPHREYS_BOUNDS = {
  minLat: 36.95,
  maxLat: 37.00,
  minLon: 127.00,
  maxLon: 127.08
};

export async function searchPlaces(query: string): Promise<SearchResult[]> {
  if (!query.trim()) {
    return [];
  }

  try {
    // 1. 로컬 건물 데이터베이스에서 먼저 검색
    const localBuildings = searchLocalBuildings(query);
    const localResults: SearchResult[] = localBuildings.map(building => ({
      id: `local-${building.buildingNumber}`,
      name: `${building.buildingNumber} - ${building.name}`,
      address: building.description || building.name,
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

    // 2. Nominatim API 호출 - 더 넓은 범위에서 검색
    const params = new URLSearchParams({
      q: `${query} Pyeongtaek`, // 평택 지역 포함하여 검색
      format: 'json',
      addressdetails: '1',
      limit: '50', // 더 많은 결과 가져오기
      // Camp Humphreys 근처로 검색 우선
      viewbox: `${HUMPHREYS_BOUNDS.minLon},${HUMPHREYS_BOUNDS.minLat},${HUMPHREYS_BOUNDS.maxLon},${HUMPHREYS_BOUNDS.maxLat}`,
      bounded: '0' // bounded를 0으로 변경하여 더 넓은 범위 검색
    });

    const response = await fetch(
      `${NOMINATIM_BASE_URL}/search?${params.toString()}`,
      {
        headers: {
          'Accept': 'application/json',
          // Nominatim은 User-Agent를 요구합니다
          'User-Agent': 'HumphreysMapApp/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Search failed');
    }

    const data: NominatimResult[] = await response.json();

    // Nominatim 결과를 앱의 SearchResult 형식으로 변환
    const nominatimResults = data.map((item) => ({
      id: `osm-${item.place_id}`,
      name: extractName(item),
      address: item.display_name,
      category: mapCategory(item.type, item.class),
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      distance: calculateDistance(
        36.9686, // Camp Humphreys 중심 좌표
        127.0374,
        parseFloat(item.lat),
        parseFloat(item.lon)
      )
    }));

    // 3. 로컬 결과와 OSM 결과 병합
    const allResults = [...localResults, ...nominatimResults];

    // 거리순으로 정렬하고 가까운 결과 20개만 반환
    return allResults
      .sort((a, b) => {
        const distA = parseFloat(a.distance?.replace('km', '').replace('m', '') || '0') || 0;
        const distB = parseFloat(b.distance?.replace('km', '').replace('m', '') || '0') || 0;
        return distA - distB;
      })
      .slice(0, 20);
  } catch (error) {
    console.error('Search error:', error);
    // 에러 발생 시에도 로컬 검색 결과는 반환
    const localBuildings = searchLocalBuildings(query);
    return localBuildings.map(building => ({
      id: `local-${building.buildingNumber}`,
      name: `${building.buildingNumber} - ${building.name}`,
      address: building.description || building.name,
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
  }
}

// 장소 이름 추출 (주소에서 가장 구체적인 부분)
function extractName(item: NominatimResult): string {
  // 1순위: OSM에서 제공하는 실제 장소 이름
  if (item.name && item.name.trim()) {
    return item.name.trim();
  }
  
  // 2순위: 주소 정보에서 특정 시설 이름 추출
  if (item.address) {
    const specificFields = ['amenity', 'shop', 'building', 'leisure', 'tourism'];
    for (const field of specificFields) {
      const value = item.address[field as keyof typeof item.address];
      if (value && typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
  }
  
  // 3순위: display_name의 첫 번째 부분 (가장 구체적인 정보)
  const parts = item.display_name.split(',');
  const firstPart = parts[0].trim();
  
  // 숫자로만 된 경우는 건물 번호일 가능성이 높으므로 다음 부분 사용
  if (firstPart && !/^\d+$/.test(firstPart)) {
    return firstPart;
  }
  
  // 4순위: 두 번째 부분 시도
  if (parts.length > 1) {
    const secondPart = parts[1].trim();
    if (secondPart && !/^\d+$/.test(secondPart)) {
      return secondPart;
    }
  }
  
  // 5순위: 도로명
  if (item.address?.road) {
    return item.address.road;
  }
  
  return firstPart || '알 수 없는 장소';
}

// OSM 타입을 앱의 카테고리로 매핑
function mapCategory(type: string, osmClass: string): string {
  const categoryMap: { [key: string]: string } = {
    'cafe': '카페',
    'restaurant': '음식점',
    'fast_food': '음식점',
    'food_court': '음식점',
    'convenience': '편의점',
    'supermarket': '쇼핑',
    'hospital': '병원',
    'clinic': '병원',
    'doctors': '병원',
    'pharmacy': '약국',
    'bank': '은행',
    'atm': '은행',
    'fuel': '주유소',
    'parking': '주차장',
    'parking_space': '주차장',
    'school': '학교',
    'university': '학교',
    'college': '학교',
    'kindergarten': '학교',
    'hotel': '숙박',
    'motel': '숙박',
    'guest_house': '숙박',
    'theatre': '문화시설',
    'cinema': '문화시설',
    'museum': '문화시설',
    'library': '문화시설',
    'sports_centre': '체육시설',
    'stadium': '체육시설',
    'pitch': '체육시설',
    'gym': '체육시설',
    'fitness_centre': '체육시설',
    'shop': '쇼핑',
    'mall': '쇼핑',
    'department_store': '쇼핑',
    'post_office': '우체국',
    'police': '경찰서',
    'fire_station': '소방서',
    'townhall': '관공서',
    'community_centre': '관공서',
    'place_of_worship': '종교시설',
    'church': '종교시설',
    'temple': '종교시설',
    'park': '공원',
    'playground': '공원'
  };

  // amenity, shop, building 등 클래스별 처리
  if (osmClass === 'amenity' || osmClass === 'shop' || osmClass === 'leisure') {
    return categoryMap[type] || '편의시설';
  }
  
  if (osmClass === 'building') {
    return categoryMap[type] || '건물';
  }

  if (osmClass === 'place') {
    return '지역';
  }

  if (osmClass === 'highway') {
    return '도로';
  }

  return categoryMap[type] || '장소';
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

// 역 지오코딩 (좌표 -> 주소)
export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lon.toString(),
      format: 'json',
      addressdetails: '1'
    });

    const response = await fetch(
      `${NOMINATIM_BASE_URL}/reverse?${params.toString()}`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'HumphreysMapApp/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Reverse geocoding failed');
    }

    const data = await response.json();
    return data.display_name || '주소를 찾을 수 없습니다';
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return '주소를 찾을 수 없습니다';
  }
}
