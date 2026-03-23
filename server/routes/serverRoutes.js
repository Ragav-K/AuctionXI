import { Router } from 'express';
import {
  createServer,
  joinServer,
  getServerState,
  startAuction,
  placeBid,
  getPlayersByCategory,
} from '../controllers/serverController.js';

const router = Router();

router.post('/create', createServer);
router.post('/join', joinServer);
router.get('/:serverId/players', getPlayersByCategory);
router.get('/:serverId', getServerState);
router.post('/start', startAuction);
router.post('/bid', placeBid);

export default router;
