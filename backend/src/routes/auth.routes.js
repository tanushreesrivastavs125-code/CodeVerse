import { Router } from 'express';
import { register, login, getProfile } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validationMiddleware.js';
import { validateRegister, validateLogin } from '../validators/auth.validator.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', validate(validateRegister), register);
router.post('/login', validate(validateLogin), login);
router.get('/profile', authMiddleware, getProfile);

export default router;
