// MongoDB 연동을 위한 건물 데이터 인터페이스
export interface BuildingData {
  buildingNumber: string;
  name: string;
  category: string;
  buildingType: string; // 건물 형태
  businessHours?: string; // 영업 시간
  contact?: string; // 연락처
  address?: string; // 주소
  latitude: number;
  longitude: number;
  description?: string;
}

// MongoDB에서 가져온 건물 데이터를 저장할 배열
// 실제로는 MongoDB API에서 데이터를 가져와야 합니다
export const BUILDINGS: BuildingData[] = [
  // MongoDB에서 데이터를 가져오면 이 배열에 저장됩니다
];

// MongoDB에서 건물 검색
// TODO: 실제 MongoDB API 연동 필요
export function searchLocalBuildings(query: string): BuildingData[] {
  const searchTerm = query.toLowerCase().trim();
  
  if (!searchTerm) {
    return [];
  }

  // MongoDB 쿼리를 시뮬레이션
  // 실제로는 MongoDB API를 호출해야 합니다
  return BUILDINGS.filter(building => 
    building.buildingNumber.toLowerCase().includes(searchTerm) ||
    building.name.toLowerCase().includes(searchTerm) ||
    building.category.toLowerCase().includes(searchTerm) ||
    building.buildingType?.toLowerCase().includes(searchTerm) ||
    (building.description && building.description.toLowerCase().includes(searchTerm))
  );
}

// MongoDB에서 건물 번호로 정확히 찾기
// TODO: 실제 MongoDB API 연동 필요
export function getBuildingByNumber(buildingNumber: string): BuildingData | undefined {
  return BUILDINGS.find(
    building => building.buildingNumber === buildingNumber
  );
}

// MongoDB에서 카테고리별로 건물 목록 가져오기
// TODO: 실제 MongoDB API 연동 필요
export function getBuildingsByCategory(category: string): BuildingData[] {
  return BUILDINGS.filter(
    building => building.category === category
  );
}

// MongoDB에서 가까운 건물 찾기
// TODO: 실제 MongoDB API 연동 필요
export function getNearbyBuildings(
  latitude: number,
  longitude: number,
  radiusKm: number = 1
): BuildingData[] {
  return BUILDINGS.filter(building => {
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
