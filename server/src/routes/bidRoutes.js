import express from 'express';
import { body } from 'express-validator';
import {
  submitBid,
  getMyBids,
  getAllBidsForAdmin,
  getBidsByTenderId,
  recordVerificationResult,
  adminOverrideBidAmount
} from '../controllers/bidController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// The bidder's browser has already committed the hash on-chain from their
// own wallet before calling this — the server independently re-verifies
// that commitment against the chain rather than trusting the client.
const bidValidation = [
  body('id').trim().notEmpty().withMessage('Bid ID is required'),
  body('tenderId').trim().notEmpty().withMessage('Tender ID is required'),
  body('amount').isNumeric().withMessage('Bid amount must be a valid number'),
  body('salt').trim().notEmpty().withMessage('Salt is required'),
  body('commitHash').trim().notEmpty().withMessage('Commit hash is required'),
  body('txHash').trim().notEmpty().withMessage('On-chain transaction hash is required'),
  validate
];

const verifyDocumentValidation = [
  body('verified').isBoolean().withMessage('verified must be a boolean'),
  body('documentAmount').isNumeric().withMessage('Document amount must be a valid number'),
  validate
];

const adminOverrideValidation = [
  body('amount').isNumeric().withMessage('Amount must be a valid number'),
  validate
];

router.post('/', protect, authorize('bidder'), bidValidation, submitBid);
router.get('/my-bids', protect, authorize('bidder'), getMyBids);
router.get('/admin/all-bids', protect, authorize('admin'), getAllBidsForAdmin);
router.get('/tender/:tenderId', getBidsByTenderId);
router.post('/:id/verify-document', protect, verifyDocumentValidation, recordVerificationResult);
router.patch('/:id/admin-override', protect, authorize('admin'), adminOverrideValidation, adminOverrideBidAmount);

export default router;
