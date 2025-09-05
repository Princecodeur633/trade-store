import { Router } from 'express';
import PaymentController from '../controllers/paymentController'; // import default class
import authenticateStructure from '../middleware/auth';           // import default middleware
import { validate, schemas } from '../middleware/validation';

const router = Router();

// All routes require authentication
router.use(authenticateStructure);

// Routes
router.post(
  '/',
  validate(schemas.recordPayment),
  PaymentController.recordPayment
);

router.get(
  '/',
  validate(schemas.queryParams),
  PaymentController.getPayments
);

export default router;
