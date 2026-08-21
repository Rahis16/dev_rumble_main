import { Router } from 'express';
import { SettingsController } from '../controllers/settingsController.js';

const router = Router();

router.get('/', SettingsController.getSettings);
router.get('/health', SettingsController.getHealth);
router.get('/evaluate-quality', SettingsController.evaluateProjectQuality);

export default router;
