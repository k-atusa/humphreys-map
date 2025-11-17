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
    
    const results: SearchResult[] = buildings.map((building, index) => ({
      id: building.id || building.buildingNumber || `building-${index}`,
      name: building.name,
      address: building.address || '',
      category: building.category,
      latitude: building.latitude,
      longitude: building.longitude
    }));

    return results;
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}
