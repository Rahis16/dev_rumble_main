import { Router } from 'express';
import { AgentController } from '../controllers/agentController.js';

const router = Router();

router.post('/execute', AgentController.executeTask);
router.get('/reports', AgentController.listReports);

export default router;
