import { Router } from 'express';
import { analyzeCareRequest, getCareSummary } from '../controllers/analyzeController.js';

const router = Router();

router.post('/', analyzeCareRequest);
router.get('/summary', getCareSummary);

export default router;
