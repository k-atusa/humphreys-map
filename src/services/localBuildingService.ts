// 군부대 내부 건물 데이터베이스
// 실제 데이터는 군부대에서 제공받거나 직접 수집해야 합니다

export interface BuildingData {
  buildingNumber: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  description?: string;
}

// Camp Humphreys 건물 데이터 (예시)
// 실제로는 데이터베이스나 API에서 가져와야 합니다
export const CAMP_HUMPHREYS_BUILDINGS: BuildingData[] = [
  // 예시 데이터 - 실제 좌표와 건물 정보로 교체 필요
  {
    buildingNumber: '6400',
    name: 'PX (Post Exchange)',
    category: '쇼핑',
    latitude: 36.9700,
    longitude: 127.0380,
    description: '군 매점'
  },
  {
    buildingNumber: '6401',
    name: 'Commissary',
    category: '쇼핑',
    latitude: 36.9690,
    longitude: 127.0390,
    description: '군 식료품점'
  },
  {
    buildingNumber: '6500',
    name: 'Brian Allgood Army Community Hospital',
    category: '병원',
    latitude: 36.9710,
    longitude: 127.0360,
    description: '종합병원'
  },
  {
    buildingNumber: '6600',
    name: 'Warrior Fitness Center',
    category: '체육시설',
    latitude: 36.9680,
    longitude: 127.0400,
    description: '체력단련장'
  },
  {
    buildingNumber: '6700',
    name: 'Humphreys Elementary School',
    category: '학교',
    latitude: 36.9720,
    longitude: 127.0370,
    description: '초등학교'
  },
  {
    buildingNumber: '6800',
    name: 'Dining Facility',
    category: '음식점',
    latitude: 36.9695,
    longitude: 127.0385,
    description: '식당'
  },
  {
    buildingNumber: '6900',
    name: 'Barracks',
    category: '숙소',
    latitude: 36.9705,
    longitude: 127.0395,
    description: '병영'
  },
  // 더 많은 건물 데이터 추가...
];

// 건물 번호나 이름으로 검색
export function searchLocalBuildings(query: string): BuildingData[] {
  const searchTerm = query.toLowerCase().trim();
  
  if (!searchTerm) {
    return [];
  }

  return CAMP_HUMPHREYS_BUILDINGS.filter(building => 
    // 건물 번호로 검색
    building.buildingNumber.includes(searchTerm) ||
    // 건물 이름으로 검색
    building.name.toLowerCase().includes(searchTerm) ||
    // 카테고리로 검색
    building.category.includes(searchTerm) ||
    // 설명으로 검색
    (building.description && building.description.toLowerCase().includes(searchTerm))
  );
}

// 건물 번호로 정확히 찾기
export function getBuildingByNumber(buildingNumber: string): BuildingData | undefined {
  return CAMP_HUMPHREYS_BUILDINGS.find(
    building => building.buildingNumber === buildingNumber
  );
}

// 카테고리별로 건물 목록 가져오기
export function getBuildingsByCategory(category: string): BuildingData[] {
  return CAMP_HUMPHREYS_BUILDINGS.filter(
    building => building.category === category
  );
}

// 가까운 건물 찾기
export function getNearbyBuildings(
  latitude: number,
  longitude: number,
  radiusKm: number = 1
): BuildingData[] {
  return CAMP_HUMPHREYS_BUILDINGS.filter(building => {
    const distance = calculateDistance(
      latitude,
      longitude,
      building.latitude,
      building.longitude
    );
    return distance <= radiusKm;
  });
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // 지구 반지름 (km)
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
