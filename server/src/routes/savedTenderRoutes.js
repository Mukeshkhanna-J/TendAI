import express from 'express';
import { getSavedTenders, toggleSavedTender } from '../controllers/savedTenderController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, authorize('bidder'), getSavedTenders);
router.post('/:tenderId', protect, authorize('bidder'), toggleSavedTender);

export default router;
