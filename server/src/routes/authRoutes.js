import express from 'express';
import { body } from 'express-validator';
import { registerUser, loginUser, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// Validation rules for registration
const registerValidation = [
  body('email').isEmail().withMessage('Please provide a valid email address'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('role').optional().isIn(['bidder', 'admin']).withMessage('Role must be bidder or admin'),
  validate
];

// Validation rules for login
const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email address'),
  body('password').optional(),
  validate
];

router.post('/register', registerValidation, registerUser);
router.post('/login', loginValidation, loginUser);
router.get('/me', protect, getMe);

export default router;
