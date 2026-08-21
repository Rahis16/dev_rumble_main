import { Router } from 'express';
import { MemoryController } from '../controllers/memoryController.js';

const router = Router();

router.get('/status', MemoryController.getMemoryStatus);
router.post('/sync-push', MemoryController.syncPush);
router.post('/sync-pull', MemoryController.syncPull);
router.get('/file', MemoryController.getFileContent);
router.post('/file', MemoryController.updateFileContent);
router.get('/decisions', MemoryController.listDecisions);
router.post('/decisions', MemoryController.createDecision);

export default router;
