import { connectToMongoDB, getMapCollection } from '../config/mongodb';
import { BuildingData } from './localBuildingService';

/**
 * MongoDB 컬렉션 초기화
 */
export async function initializeMongoDB() {
  try {
    await connectToMongoDB();
    console.log('MongoDB 초기화 완료');
  } catch (error) {
    console.error('MongoDB 초기화 실패:', error);
    throw error;
  }
}

/**
 * 장소 검색 (이름, 건물 형태로 검색)
 */
export async function searchBuildings(query: string): Promise<BuildingData[]> {
  try {
    const collection = getMapCollection();
    
    const searchResults = await collection
      .find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { buildingType: { $regex: query, $options: 'i' } },
          { category: { $regex: query, $options: 'i' } }
        ]
      })
      .toArray();

    return searchResults.map((doc: any) => ({
      buildingNumber: doc.buildingNumber || doc._id.toString(),
      name: doc.name,
      category: doc.category,
      buildingType: doc.buildingType,
      businessHours: doc.businessHours,
      contact: doc.contact,
      address: doc.address,
      latitude: doc.latitude,
      longitude: doc.longitude,
      description: doc.description
    }));
  } catch (error) {
    console.error('건물 검색 오류:', error);
    return [];
  }
}

/**
 * 건물 번호로 특정 장소 조회
 */
export async function getBuildingByNumber(buildingNumber: string): Promise<BuildingData | null> {
  try {
    const collection = getMapCollection();
    const doc = await collection.findOne({ buildingNumber }) as any;
    
    if (!doc) return null;

    return {
      buildingNumber: doc.buildingNumber || doc._id.toString(),
      name: doc.name,
      category: doc.category,
      buildingType: doc.buildingType,
      businessHours: doc.businessHours,
      contact: doc.contact,
      address: doc.address,
      latitude: doc.latitude,
      longitude: doc.longitude,
      description: doc.description
    };
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
    const collection = getMapCollection();
    
    const results = await collection
      .find({ category })
      .toArray();

    return results.map((doc: any) => ({
      buildingNumber: doc.buildingNumber || doc._id.toString(),
      name: doc.name,
      category: doc.category,
      buildingType: doc.buildingType,
      businessHours: doc.businessHours,
      contact: doc.contact,
      address: doc.address,
      latitude: doc.latitude,
      longitude: doc.longitude,
      description: doc.description
    }));
  } catch (error) {
    console.error('카테고리별 조회 오류:', error);
    return [];
  }
}

/**
 * 근처 장소 검색 (위도, 경도 기준)
 */
export async function getNearbyBuildings(
  latitude: number,
  longitude: number,
  radiusKm: number = 2
): Promise<BuildingData[]> {
  try {
    const collection = getMapCollection();
    
    // MongoDB geospatial query 사용 (2dsphere 인덱스 필요)
    const results = await collection
      .find({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude]
            },
            $maxDistance: radiusKm * 1000 // km to meters
          }
        }
      })
      .toArray();

    return results.map((doc: any) => ({
      buildingNumber: doc.buildingNumber || doc._id.toString(),
      name: doc.name,
      category: doc.category,
      buildingType: doc.buildingType,
      businessHours: doc.businessHours,
      contact: doc.contact,
      address: doc.address,
      latitude: doc.latitude,
      longitude: doc.longitude,
      description: doc.description
    }));
  } catch (error) {
    console.error('근처 장소 검색 오류:', error);
    // geospatial 인덱스가 없는 경우 fallback: 모든 데이터 조회 후 거리 계산
    return await getNearbyBuildingsFallback(latitude, longitude, radiusKm);
  }
}

/**
 * 근처 장소 검색 (fallback - geospatial 인덱스 없을 때)
 */
async function getNearbyBuildingsFallback(
  latitude: number,
  longitude: number,
  radiusKm: number
): Promise<BuildingData[]> {
  try {
    const collection = getMapCollection();
    const allBuildings = await collection.find({}).toArray();

    const buildingsWithDistance = allBuildings
      .map((doc: any) => {
        const distance = calculateDistance(latitude, longitude, doc.latitude, doc.longitude);
        return {
          buildingNumber: doc.buildingNumber || doc._id.toString(),
          name: doc.name,
          category: doc.category,
          buildingType: doc.buildingType,
          businessHours: doc.businessHours,
          contact: doc.contact,
          address: doc.address,
          latitude: doc.latitude,
          longitude: doc.longitude,
          description: doc.description,
          distance
        };
      })
      .filter((building: BuildingData & { distance: string }) => {
        const distanceValue = parseFloat(building.distance.replace('km', '').replace('m', '')) || 0;
        return building.distance.includes('km') ? distanceValue <= radiusKm : distanceValue / 1000 <= radiusKm;
      })
      .sort((a: BuildingData & { distance: string }, b: BuildingData & { distance: string }) => {
        const distA = parseFloat(a.distance.replace('km', '').replace('m', '')) || 0;
        const distB = parseFloat(b.distance.replace('km', '').replace('m', '')) || 0;
        return distA - distB;
      });

    return buildingsWithDistance;
  } catch (error) {
    console.error('Fallback 근처 장소 검색 오류:', error);
    return [];
  }
}

/**
 * 새 장소 추가
 */
export async function addBuilding(building: Omit<BuildingData, 'buildingNumber'>): Promise<string | null> {
  try {
    const collection = getMapCollection();
    
    const result = await collection.insertOne({
      ...building,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return result.insertedId.toString();
  } catch (error) {
    console.error('장소 추가 오류:', error);
    return null;
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
    const collection = getMapCollection();
    
    const result = await collection.updateOne(
      { buildingNumber },
      { 
        $set: {
          ...updates,
          updatedAt: new Date()
        }
      }
    );

    return result.modifiedCount > 0;
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
    const collection = getMapCollection();
    
    const result = await collection.deleteOne({ buildingNumber });
    return result.deletedCount > 0;
  } catch (error) {
    console.error('장소 삭제 오류:', error);
    return false;
  }
}

/**
 * 거리 계산 (Haversine formula)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const R = 6371;
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
