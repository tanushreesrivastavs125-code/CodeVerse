import { Router } from 'express';
import { askMentor } from '../controllers/mentor.controller.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { mentorRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// All AI mentor operations require authenticated player sessions
router.use(authMiddleware);

router.post('/mentor', mentorRateLimiter, askMentor);

export default router;

