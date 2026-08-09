import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Helper to generate JWT token
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'tendai_super_secret_jwt_key_2026_production_v1',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Helper to send token response & set cookie
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  };

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        organisation: user.organisation,
        role: user.role,
        savedTenders: user.savedTenders || []
      }
    });
};

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, organisation, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    const user = await User.create({
      name: name || (role === 'admin' ? 'Government Officer' : 'Registered Bidder'),
      email,
      password: password || '123456', // default fallback if omitted from simplified mock form
      organisation: organisation || '',
      role: role || 'bidder'
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    let user = await User.findOne({ email }).select('+password');

    // If user does not exist in database yet (e.g. testing with quick input), auto-create or check password
    if (!user) {
      // Auto-create user for frictionless login if credentials don't exist yet
      user = await User.create({
        name: email.split('@')[0] || 'User',
        email,
        password: password || '123456',
        role: role || 'bidder',
        organisation: role === 'admin' ? 'Government Ministry' : 'Enterprise Ltd'
      });
    } else {
      // Compare password if present
      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // If user logs in specifying role that changed, update role
      if (role && user.role !== role) {
        user.role = role;
        await user.save();
      }
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        organisation: user.organisation,
        role: user.role,
        savedTenders: user.savedTenders || []
      }
    });
  } catch (error) {
    next(error);
  }
};
