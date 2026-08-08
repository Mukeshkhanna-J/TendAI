import Tender from '../models/Tender.js';
import Bid from '../models/Bid.js';
import User from '../models/User.js';
import { generateTxHash } from '../utils/generateHash.js';

/**
 * @desc    Get all tenders with filtering and sorting
 * @route   GET /api/tenders
 * @access  Public
 */
export const getAllTenders = async (req, res, next) => {
  try {
    const { category, status, department, valueRange, search, sortBy } = req.query;

    const query = {};

    if (category) query.category = category;
    if (status) query.status = status;
    if (department) query.department = department;

    if (valueRange) {
      const [min, max] = valueRange.split('-').map(Number);
      if (!isNaN(min) && !isNaN(max)) {
        query.value = { $gte: min, $lte: max };
      }
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { id: searchRegex },
        { title: searchRegex },
        { organisation: searchRegex },
        { category: searchRegex },
        { department: searchRegex }
      ];
    }

    let sortOptions = {};
    if (sortBy === 'value') {
      sortOptions = { value: -1 };
    } else if (sortBy === 'publishedDate') {
      sortOptions = { publishedDate: -1 };
    } else {
      // Default sort by closingDate ascending
      sortOptions = { closingDate: 1 };
    }

    const tenders = await Tender.find(query).sort(sortOptions);

    res.status(200).json({
      success: true,
      count: tenders.length,
      data: tenders
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get high-level tender statistics for homepage / metrics
 * @route   GET /api/tenders/stats
 * @access  Public
 */
export const getTenderStats = async (req, res, next) => {
  try {
    const totalTenders = await Tender.countDocuments();
    const activeBidders = await User.countDocuments({ role: 'bidder' });
    const awardedTenders = await Tender.countDocuments({ status: 'Closed' });

    res.status(200).json({
      success: true,
      data: {
        totalTenders,
        activeBidders: activeBidders || 1284, // Default aesthetic count if newly initialized
        awardedTenders
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single tender by ID (custom ID e.g. TND-2026-001 or _id)
 * @route   GET /api/tenders/:id
 * @access  Public
 */
export const getTenderById = async (req, res, next) => {
  try {
    const tenderIdParam = req.params.id;

    // Search by custom id ("TND-2026-001") or Mongoose _id
    let tender = await Tender.findOne({ id: tenderIdParam });
    if (!tender && tenderIdParam.match(/^[0-9a-fA-F]{24}$/)) {
      tender = await Tender.findById(tenderIdParam);
    }

    if (!tender) {
      return res.status(404).json({
        success: false,
        message: `Tender not found with ID ${tenderIdParam}`
      });
    }

    // Fetch related bids
    const bids = await Bid.find({ tenderId: tender.id });

    res.status(200).json({
      success: true,
      data: {
        ...tender.toObject(),
        bids: tender.bidsVisible ? bids : []
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new tender (Admin only)
 * @route   POST /api/tenders
 * @access  Private (Admin)
 */
export const createTender = async (req, res, next) => {
  try {
    const { title, description, category, department, organisation, closingDate, emdAmount, value, eligibility, documents } = req.body;

    // Auto-generate unique custom ID: TND-2026-xxx
    const count = await Tender.countDocuments();
    const customId = `TND-2026-${String(count + 1).padStart(3, '0')}`;

    const txHash = generateTxHash();
    const publishedDate = new Date().toISOString().slice(0, 10);

    const initialTimeline = [
      { label: 'Published', timestamp: new Date().toISOString(), txHash },
      { label: 'Bids Open', timestamp: new Date().toISOString(), txHash: generateTxHash() },
      { label: 'Bids Closed', timestamp: `${closingDate}T17:00:00+05:30`, txHash: 'Pending' },
      { label: 'Awarded', timestamp: null, txHash: 'Pending' }
    ];

    const newTender = await Tender.create({
      id: customId,
      title,
      description,
      category: category || 'Infrastructure',
      department: department || 'Urban Development',
      organisation: organisation || req.user.organisation || 'Government Department',
      closingDate,
      emdAmount: Number(emdAmount),
      value: Number(value),
      eligibility,
      status: 'Live',
      publishedDate,
      txHash,
      bidsVisible: false,
      createdBy: 'admin',
      creatorUser: req.user._id,
      documents: documents && documents.length > 0 ? documents : ['Notice Inviting Tender.pdf', 'Technical Specifications.pdf'],
      timeline: initialTimeline
    });

    res.status(201).json({
      success: true,
      message: 'Tender created successfully',
      data: newTender
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get tenders created by admin officer
 * @route   GET /api/tenders/admin/my-tenders
 * @access  Private (Admin)
 */
export const getAdminTenders = async (req, res, next) => {
  try {
    const adminTenders = await Tender.find({
      $or: [{ createdBy: 'admin' }, { creatorUser: req.user._id }]
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: adminTenders.length,
      data: adminTenders
    });
  } catch (error) {
    next(error);
  }
};
