import { Router } from 'express';
import {
  searchBuildings,
  getAllBuildings,
  getBuildingByNumber,
  getBuildingsByCategory,
  getNearbyBuildings,
  addBuilding,
  updateBuilding,
  deleteBuilding
} from '../controllers/buildingController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

/**
 * 건물 검색
 * GET /api/buildings/search?q=query
 */
router.get('/search', searchBuildings);

/**
 * 근처 건물 검색
 * GET /api/buildings/nearby?lat=36.9686&lon=127.0374&radius=2
 */
router.get('/nearby', getNearbyBuildings);

/**
 * 카테고리별 건물 조회
 * GET /api/buildings/category/:category
 */
router.get('/category/:category', getBuildingsByCategory);

/**
 * 모든 건물 조회
 * GET /api/buildings
 */
router.get('/', getAllBuildings);

/**
 * 특정 건물 조회
 * GET /api/buildings/:buildingNumber
 */
router.get('/:buildingNumber', getBuildingByNumber);

/**
 * 새 건물 추가
 * POST /api/buildings
 * 관리자 권한 필요
 */
router.post('/', authenticate, requireAdmin, addBuilding);

/**
 * 건물 정보 업데이트
 * PUT /api/buildings/:buildingNumber
 * 관리자 권한 필요
 */
router.put('/:buildingNumber', authenticate, requireAdmin, updateBuilding);

/**
 * 건물 삭제
 * DELETE /api/buildings/:buildingNumber
 * 관리자 권한 필요
 */
router.delete('/:buildingNumber', authenticate, requireAdmin, deleteBuilding);

export default router;
