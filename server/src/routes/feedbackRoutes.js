import express from 'express';
import { body } from 'express-validator';
import { submitFeedback, getFeedback } from '../controllers/feedbackController.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

const feedbackValidation = [
  body('message').trim().notEmpty().withMessage('Feedback message is required').isLength({ max: 1000 }),
  body('rating').optional({ nullable: true }).isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  validate
];

router.get('/', getFeedback);
router.post('/', feedbackValidation, submitFeedback);

export default router;
