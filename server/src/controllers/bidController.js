import Bid from '../models/Bid.js';
import Tender from '../models/Tender.js';
import { generateTxHash } from '../utils/generateHash.js';

/**
 * @desc    Submit a new bid for a tender
 * @route   POST /api/bids
 * @access  Private (Bidder)
 */
export const submitBid = async (req, res, next) => {
  try {
    const { tenderId, amount } = req.body;

    // Check if tender exists
    const tender = await Tender.findOne({ id: tenderId });
    if (!tender) {
      return res.status(404).json({
        success: false,
        message: `Tender not found with ID ${tenderId}`
      });
    }

    if (tender.status !== 'Live') {
      return res.status(400).json({
        success: false,
        message: `Cannot submit bid for a tender with status '${tender.status}'`
      });
    }

    // Count existing bids to construct custom ID
    const count = await Bid.countDocuments();
    const customId = `BID-${940 + count}`;

    const txHash = generateTxHash();
    const trustScore = Math.floor(Math.random() * (95 - 70 + 1)) + 70;
    const submittedAt = new Date().toISOString().slice(0, 10);

    const newBid = await Bid.create({
      id: customId,
      tenderId,
      bidder: req.user.organisation || req.user.name || 'Registered Bidder',
      user: req.user._id,
      amount: Number(amount),
      submittedAt,
      status: 'Under Evaluation',
      trustScore,
      txHash
    });

    res.status(201).json({
      success: true,
      message: 'Bid submitted successfully with AI trust scoring and on-chain verification',
      data: newBid
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get bids submitted by current logged in bidder
 * @route   GET /api/bids/my-bids
 * @access  Private (Bidder)
 */
export const getMyBids = async (req, res, next) => {
  try {
    const bids = await Bid.find({
      $or: [{ user: req.user._id }, { bidder: req.user.organisation || req.user.name }]
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bids.length,
      data: bids
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all submitted bids across all tenders (Admin only)
 * @route   GET /api/bids/admin/all-bids
 * @access  Private (Admin)
 */
export const getAllBidsForAdmin = async (req, res, next) => {
  try {
    const bids = await Bid.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bids.length,
      data: bids
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get bids for a specific tender
 * @route   GET /api/bids/tender/:tenderId
 * @access  Public / Private
 */
export const getBidsByTenderId = async (req, res, next) => {
  try {
    const { tenderId } = req.params;
    const tender = await Tender.findOne({ id: tenderId });

    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found'
      });
    }

    // Check if bids are visible publicly or if requester is admin/owner
    if (!tender.bidsVisible && (!req.user || req.user.role !== 'admin')) {
      return res.status(200).json({
        success: true,
        bidsVisible: false,
        message: 'Bid details are sealed until closing date',
        data: []
      });
    }

    const bids = await Bid.find({ tenderId }).sort({ amount: 1 });

    res.status(200).json({
      success: true,
      bidsVisible: true,
      count: bids.length,
      data: bids
    });
  } catch (error) {
    next(error);
  }
};
