import Feedback from '../models/Feedback.js';

/**
 * @desc    Submit public feedback on the TendAI transparency initiative
 * @route   POST /api/feedback
 * @access  Public
 */
export const submitFeedback = async (req, res, next) => {
  try {
    const { name, message, rating } = req.body;

    const feedback = await Feedback.create({
      name: name && name.trim() ? name.trim().slice(0, 80) : 'Anonymous',
      message,
      rating: rating ? Number(rating) : null
    });

    res.status(201).json({ success: true, data: feedback });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    List public feedback, newest first
 * @route   GET /api/feedback
 * @access  Public
 */
export const getFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.find().sort({ createdAt: -1 }).limit(100);
    res.status(200).json({ success: true, count: feedback.length, data: feedback });
  } catch (error) {
    next(error);
  }
};
