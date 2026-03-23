import { Router } from 'express';
import { previewAuctionPlayerPool } from '../controllers/serverController.js';

const router = Router();

router.get('/players', previewAuctionPlayerPool);

export default router;
