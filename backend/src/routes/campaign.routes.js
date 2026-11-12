import { Router } from 'express';
import { getLevels, runLevel, getRunHistory } from '../controllers/campaign.controller.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// All campaign progression routes require authenticated player sessions
router.use(authMiddleware);

router.get('/levels', getLevels);
router.post('/levels/:id/run', runLevel);
router.get('/history', getRunHistory);

export default router;
