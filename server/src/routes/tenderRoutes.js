import express from 'express';
import { body } from 'express-validator';
import {
  getAllTenders,
  getTenderStats,
  getTenderById,
  createTender,
  getAdminTenders
} from '../controllers/tenderController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// Validation rules for creating a tender
const tenderValidation = [
  body('title').trim().notEmpty().withMessage('Tender title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('closingDate').notEmpty().withMessage('Closing date is required'),
  body('emdAmount').isNumeric().withMessage('EMD amount must be a number'),
  body('value').isNumeric().withMessage('Tender value must be a number'),
  body('eligibility').trim().notEmpty().withMessage('Eligibility criteria is required'),
  validate
];

router.get('/', getAllTenders);
router.get('/stats', getTenderStats);
router.get('/admin/my-tenders', protect, authorize('admin'), getAdminTenders);
router.get('/:id', getTenderById);
router.post('/', protect, authorize('admin'), tenderValidation, createTender);

export default router;
