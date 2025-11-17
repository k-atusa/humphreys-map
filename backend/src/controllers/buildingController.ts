import { Request, Response } from 'express';
import { getMapCollection } from '../config/mongodb';
import { BuildingData } from '../types/building';
import { ObjectId } from 'mongodb';

/**
 * 거리 계산 (Haversine formula)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

/**
 * 장소 검색
 * GET /api/buildings/search?q=query
 */
export async function searchBuildings(req: Request, res: Response) {
  try {
    const query = req.query.q as string;
    
    if (!query || !query.trim()) {
      return res.json([]);
    }

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

    const results = searchResults.map(doc => ({
      id: doc.buildingNumber || doc._id.toString(),
      buildingNumber: doc.buildingNumber || doc._id.toString(),
      name: doc.name,
      address: doc.address || '',
      category: doc.category,
      buildingType: doc.buildingType,
      businessHours: doc.businessHours,
      contact: doc.contact,
      latitude: doc.latitude,
      longitude: doc.longitude,
      description: doc.description
    }));

    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: '검색 중 오류가 발생했습니다.' });
  }
}

/**
 * 모든 건물 조회
 * GET /api/buildings
 */
export async function getAllBuildings(req: Request, res: Response) {
  try {
    const collection = getMapCollection();
    const buildings = await collection.find({}).toArray();

    const results = buildings.map(doc => ({
      id: doc.buildingNumber || doc._id.toString(),
      buildingNumber: doc.buildingNumber || doc._id.toString(),
      name: doc.name,
      address: doc.address || '',
      category: doc.category,
      buildingType: doc.buildingType,
      businessHours: doc.businessHours,
      contact: doc.contact,
      latitude: doc.latitude,
      longitude: doc.longitude,
      description: doc.description
    }));

    res.json(results);
  } catch (error) {
    console.error('Get all buildings error:', error);
    res.status(500).json({ error: '건물 목록 조회 중 오류가 발생했습니다.' });
  }
}

/**
 * 건물 번호로 특정 장소 조회
 * GET /api/buildings/:buildingNumber
 */
export async function getBuildingByNumber(req: Request, res: Response) {
  try {
    const { buildingNumber } = req.params;
    const collection = getMapCollection();
    
    const doc = await collection.findOne({ buildingNumber });
    
    if (!doc) {
      return res.status(404).json({ error: '건물을 찾을 수 없습니다.' });
    }

    const result = {
      id: doc.buildingNumber || doc._id.toString(),
      buildingNumber: doc.buildingNumber || doc._id.toString(),
      name: doc.name,
      address: doc.address || '',
      category: doc.category,
      buildingType: doc.buildingType,
      businessHours: doc.businessHours,
      contact: doc.contact,
      latitude: doc.latitude,
      longitude: doc.longitude,
      description: doc.description
    };

    res.json(result);
  } catch (error) {
    console.error('Get building error:', error);
    res.status(500).json({ error: '건물 조회 중 오류가 발생했습니다.' });
  }
}

/**
 * 카테고리별 장소 조회
 * GET /api/buildings/category/:category
 */
export async function getBuildingsByCategory(req: Request, res: Response) {
  try {
    const { category } = req.params;
    const collection = getMapCollection();
    
    const buildings = await collection.find({ category }).toArray();

    const results = buildings.map(doc => ({
      id: doc.buildingNumber || doc._id.toString(),
      buildingNumber: doc.buildingNumber || doc._id.toString(),
      name: doc.name,
      address: doc.address || '',
      category: doc.category,
      buildingType: doc.buildingType,
      businessHours: doc.businessHours,
      contact: doc.contact,
      latitude: doc.latitude,
      longitude: doc.longitude,
      description: doc.description
    }));

    res.json(results);
  } catch (error) {
    console.error('Get buildings by category error:', error);
    res.status(500).json({ error: '카테고리별 조회 중 오류가 발생했습니다.' });
  }
}

/**
 * 근처 장소 검색
 * GET /api/buildings/nearby?lat=36.9686&lon=127.0374&radius=2
 */
export async function getNearbyBuildings(req: Request, res: Response) {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);
    const radius = parseFloat(req.query.radius as string) || 2;

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ error: '유효한 위도와 경도를 입력하세요.' });
    }

    const collection = getMapCollection();
    const allBuildings = await collection.find({}).toArray();

    const buildingsWithDistance = allBuildings
      .map(doc => {
        const distance = calculateDistance(lat, lon, doc.latitude, doc.longitude);
        return {
          id: doc.buildingNumber || doc._id.toString(),
          buildingNumber: doc.buildingNumber || doc._id.toString(),
          name: doc.name,
          address: doc.address || '',
          category: doc.category,
          buildingType: doc.buildingType,
          businessHours: doc.businessHours,
          contact: doc.contact,
          latitude: doc.latitude,
          longitude: doc.longitude,
          description: doc.description,
          distance: distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`
        };
      })
      .filter(building => {
        const distanceValue = parseFloat(building.distance.replace('km', '').replace('m', '')) || 0;
        return building.distance.includes('km') ? distanceValue <= radius : distanceValue / 1000 <= radius;
      })
      .sort((a, b) => {
        const distA = parseFloat(a.distance.replace('km', '').replace('m', '')) || 0;
        const distB = parseFloat(b.distance.replace('km', '').replace('m', '')) || 0;
        return distA - distB;
      });

    res.json(buildingsWithDistance);
  } catch (error) {
    console.error('Get nearby buildings error:', error);
    res.status(500).json({ error: '근처 장소 검색 중 오류가 발생했습니다.' });
  }
}

/**
 * 새 장소 추가
 * POST /api/buildings
 */
export async function addBuilding(req: Request, res: Response) {
  try {
    const buildingData: BuildingData = req.body;

    // 필수 필드 검증
    if (!buildingData.name || !buildingData.latitude || !buildingData.longitude) {
      return res.status(400).json({ error: '필수 필드가 누락되었습니다.' });
    }

    const collection = getMapCollection();
    
    const result = await collection.insertOne({
      ...buildingData,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    res.status(201).json({
      message: '장소가 추가되었습니다.',
      id: result.insertedId.toString()
    });
  } catch (error) {
    console.error('Add building error:', error);
    res.status(500).json({ error: '장소 추가 중 오류가 발생했습니다.' });
  }
}

/**
 * 장소 정보 업데이트
 * PUT /api/buildings/:buildingNumber
 */
export async function updateBuilding(req: Request, res: Response) {
  try {
    const { buildingNumber } = req.params;
    const updates = req.body;

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

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: '건물을 찾을 수 없습니다.' });
    }

    res.json({ message: '장소 정보가 업데이트되었습니다.' });
  } catch (error) {
    console.error('Update building error:', error);
    res.status(500).json({ error: '장소 업데이트 중 오류가 발생했습니다.' });
  }
}

/**
 * 장소 삭제
 * DELETE /api/buildings/:buildingNumber
 */
export async function deleteBuilding(req: Request, res: Response) {
  try {
    const { buildingNumber } = req.params;
    const collection = getMapCollection();
    
    const result = await collection.deleteOne({ buildingNumber });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: '건물을 찾을 수 없습니다.' });
    }

    res.json({ message: '장소가 삭제되었습니다.' });
  } catch (error) {
    console.error('Delete building error:', error);
    res.status(500).json({ error: '장소 삭제 중 오류가 발생했습니다.' });
  }
}
