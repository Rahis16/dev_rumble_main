import { Router } from 'express';
import { TaskController } from '../controllers/taskController.js';

const router = Router();

router.get('/', TaskController.listTasks);
router.post('/', TaskController.createTask);
router.post('/plan', TaskController.planFeature);
router.patch('/:id/status', TaskController.updateTaskStatus);
router.put('/:id', TaskController.updateTask);
router.delete('/:id', TaskController.deleteTask);

export default router;
