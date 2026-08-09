import User from '../models/User.js';
import Tender from '../models/Tender.js';

/**
 * @desc    Get user's saved tenders
 * @route   GET /api/saved-tenders
 * @access  Private (Bidder)
 */
export const getSavedTenders = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const savedIds = user.savedTenders || [];

    const tenders = await Tender.find({ id: { $in: savedIds } });

    res.status(200).json({
      success: true,
      savedIds,
      count: tenders.length,
      data: tenders
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle saving/bookmarking a tender
 * @route   POST /api/saved-tenders/:tenderId
 * @access  Private (Bidder)
 */
export const toggleSavedTender = async (req, res, next) => {
  try {
    const { tenderId } = req.params;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const index = user.savedTenders.indexOf(tenderId);
    let isSaved = false;

    if (index > -1) {
      user.savedTenders.splice(index, 1);
      isSaved = false;
    } else {
      user.savedTenders.push(tenderId);
      isSaved = true;
    }

    await user.save();

    res.status(200).json({
      success: true,
      isSaved,
      savedTenders: user.savedTenders,
      message: isSaved ? 'Tender saved successfully' : 'Tender removed from saved list'
    });
  } catch (error) {
    next(error);
  }
};
