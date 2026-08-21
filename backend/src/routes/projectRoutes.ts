import { Router } from 'express';
import { ProjectController } from '../controllers/projectController.js';

const router = Router();

router.get('/', ProjectController.listProjects);
router.post('/', ProjectController.createProject);
router.post('/open-vscode', ProjectController.openVSCode);
router.get('/:id', ProjectController.getProject);
router.post('/:id/analyze', ProjectController.analyze);
router.get('/:id/tree', ProjectController.getTree);
router.get('/:id/file', ProjectController.readFile);
router.post('/:id/file', ProjectController.writeFile);

export default router;
