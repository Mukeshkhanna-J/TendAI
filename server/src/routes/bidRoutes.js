import express from 'express';
import { body } from 'express-validator';
import { submitBid, getMyBids, getAllBidsForAdmin, getBidsByTenderId } from '../controllers/bidController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// Validation rules for bid submission
const bidValidation = [
  body('tenderId').trim().notEmpty().withMessage('Tender ID is required'),
  body('amount').isNumeric().withMessage('Bid amount must be a valid number'),
  validate
];

router.post('/', protect, authorize('bidder'), bidValidation, submitBid);
router.get('/my-bids', protect, authorize('bidder'), getMyBids);
router.get('/admin/all-bids', protect, authorize('admin'), getAllBidsForAdmin);
router.get('/tender/:tenderId', getBidsByTenderId);

export default router;
