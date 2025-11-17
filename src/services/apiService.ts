const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface BuildingData {
  id?: string;
  buildingNumber: string;
  name: string;
  category: string;
  businessHours?: string;
  contact?: string;
  address?: string;
  latitude: number;
  longitude: number;
  description?: string;
}

/**
 * 장소 검색
 */
export async function searchBuildings(query: string): Promise<BuildingData[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/buildings/search?q=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      throw new Error('검색 요청 실패');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('장소 검색 오류:', error);
    return [];
  }
}

/**
 * 모든 건물 조회
 */
export async function getAllBuildings(): Promise<BuildingData[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/buildings`);
    
    if (!response.ok) {
      throw new Error('건물 목록 조회 실패');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('건물 목록 조회 오류:', error);
    return [];
  }
}

/**
 * 건물 번호로 특정 장소 조회
 */
export async function getBuildingByNumber(buildingNumber: string): Promise<BuildingData | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/buildings/${buildingNumber}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('건물 조회 실패');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('건물 조회 오류:', error);
    return null;
  }
}

/**
 * 카테고리별 장소 조회
 */
export async function getBuildingsByCategory(category: string): Promise<BuildingData[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/buildings/category/${category}`);
    
    if (!response.ok) {
      throw new Error('카테고리별 조회 실패');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('카테고리별 조회 오류:', error);
    return [];
  }
}

/**
 * 근처 장소 검색
 */
export async function getNearbyBuildings(
  latitude: number,
  longitude: number,
  radiusKm: number = 2
): Promise<BuildingData[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/buildings/nearby?lat=${latitude}&lon=${longitude}&radius=${radiusKm}`
    );
    
    if (!response.ok) {
      throw new Error('근처 장소 검색 실패');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('근처 장소 검색 오류:', error);
    return [];
  }
}

/**
 * 새 장소 추가
 */
export async function addBuilding(building: BuildingData): Promise<string | null> {
  try {
    const token = localStorage.getItem('auth_token');
    console.log('🔑 저장된 토큰:', token);
    console.log('🔑 토큰 존재 여부:', !!token);
    
    if (!token) {
      throw new Error('로그인이 필요합니다. 토큰이 없습니다.');
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
    
    console.log('📤 요청 헤더:', headers);
    
    const response = await fetch(`${API_BASE_URL}/buildings`, {
      method: 'POST',
      headers,
      body: JSON.stringify(building),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('API 에러 응답:', errorData);
      throw new Error(errorData.error || `장소 추가 실패 (${response.status})`);
    }
    
    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error('장소 추가 오류:', error);
    throw error;
  }
}

/**
 * 장소 정보 업데이트
 */
export async function updateBuilding(
  buildingNumber: string,
  updates: Partial<BuildingData>
): Promise<boolean> {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/buildings/${buildingNumber}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      throw new Error('장소 업데이트 실패');
    }
    
    return true;
  } catch (error) {
    console.error('장소 업데이트 오류:', error);
    return false;
  }
}

/**
 * 장소 삭제
 */
export async function deleteBuilding(buildingNumber: string): Promise<boolean> {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/buildings/${buildingNumber}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });
    
    if (!response.ok) {
      throw new Error('장소 삭제 실패');
    }
    
    return true;
  } catch (error) {
    console.error('장소 삭제 오류:', error);
    return false;
  }
}
