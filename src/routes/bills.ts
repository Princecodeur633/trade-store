import { Router } from 'express';
import BillsController from '../controllers/billController'; // import default class
import authenticateStructure from '../middleware/auth';       // import default middleware
import { validate, schemas } from '../middleware/validation';

const router = Router();

// All routes require authentication
router.use(authenticateStructure);

// Routes
router.post(
  '/',
  validate(schemas.createBill),
  BillsController.createBill
);

router.get(
  '/',
  validate(schemas.queryParams),
  BillsController.getBills
);

router.get(
  '/:billNumber',
  BillsController.getBill
);

router.patch(
  '/:billNumber/status',
  BillsController.updateBillStatus
);

export default router;
