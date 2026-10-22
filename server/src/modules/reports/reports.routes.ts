import { Router } from 'express';
import { getDailyReport, exportReportCsv } from './reports.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/daily', getDailyReport);
router.get('/export', exportReportCsv);

export const reportsRoutes = router;
