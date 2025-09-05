import { Router } from 'express';
import SubscriberController from '../controllers/subscriberController';
import  authenticateStructure from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';

const router = Router();

// All routes require authentication
router.use(authenticateStructure);

router.post(
  '/upload',
  SubscriberController.uploadMiddleware,
  SubscriberController.uploadCSV
);

router.get(
  '/',
  validate(schemas.queryParams),
  SubscriberController.getSubscribers
);

router.get(
  '/:subscriberCode',
  SubscriberController.getSubscriber
);

export default router;
