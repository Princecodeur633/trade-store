import { Router } from 'express';
import authController from '../controllers/authController';
import { validate, schemas } from '../middleware/validation';

const router = Router();

router.post('/register', validate(schemas.registerStructure), authController.register);
router.post('/login', validate(schemas.login), authController.login);

export default router;
