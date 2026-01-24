import { Router } from 'express';
import { getRoute } from '../controllers/routingController';

const router = Router();

// GET /api/routing/route?origin=lng,lat&destination=lng,lat&mode=driving|cycling|walking
router.get('/route', getRoute);

export default router;
