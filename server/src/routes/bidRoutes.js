import express from 'express';
import { body } from 'express-validator';
import {
  submitBid,
  getMyBids,
  getAllBidsForAdmin,
  getBidsByTenderId,
  adminUpdateBidAmount,
  adminRestoreBidAmount
} from '../controllers/bidController.js';
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

// Insider tamper demo: rewrite / restore the off-chain bid amount.
// The smart contract commitment is never touched by these routes.
const amountUpdateValidation = [
  body('amount').isNumeric().withMessage('Bid amount must be a valid number'),
  validate
];

router.patch('/:id/amount', protect, authorize('admin'), amountUpdateValidation, adminUpdateBidAmount);
router.patch('/:id/restore', protect, authorize('admin'), adminRestoreBidAmount);

export default router;
