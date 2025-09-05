import { Router } from 'express';
import DashboardController from '../controllers/dashboardController'; // import default class
import authenticateStructure from '../middleware/auth';               // import default middleware

const router = Router();

// All routes require authentication
router.use(authenticateStructure);

// Routes
router.get('/stats', DashboardController.getStats);
router.get('/monthly-report', DashboardController.getMonthlyReport);

export default router;
