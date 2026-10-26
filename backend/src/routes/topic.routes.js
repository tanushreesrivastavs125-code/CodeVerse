import { Router } from 'express';
import { getTopics } from '../controllers/topic.controller.js';

const router = Router();

// GET /api/topics - Retrieve curriculum roadmap and concept hierarchy (Public)
router.get('/', getTopics);

export default router;
