import { Router } from 'express';
import { ProjectController } from '../controllers/projectController.js';

const router = Router();

router.get('/', ProjectController.listProjects);
router.post('/', ProjectController.createProject);
router.post('/open-vscode', ProjectController.openVSCode);
router.get('/:id', ProjectController.getProject);
router.post('/:id/analyze', ProjectController.analyze);

export default router;
