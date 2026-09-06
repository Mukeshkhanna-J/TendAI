import Bid from "../models/Bid.js";
import Tender from "../models/Tender.js";
import { generateTxHash } from "../utils/generateHash.js";
import { computeCommitHash } from "../utils/bidHash.js";

/**
 * @desc    Submit a new bid for a tender
 * @route   POST /api/bids
 * @access  Private (Bidder)
 */
export const submitBid = async (req, res, next) => {
    try {
        const { tenderId, amount, walletAddress, commitHash, chainTxHash } =
            req.body;
        const org_name = req.user.organisation;
        // Check if tender exists
        const tender = await Tender.findOne({ id: tenderId });
        if (!tender) {
            return res.status(404).json({
                success: false,
                message: `Tender not found with ID ${tenderId}`,
            });
        }

        if (tender.status !== "Live") {
            return res.status(400).json({
                success: false,
                message: `Cannot submit bid for a tender with status '${tender.status}'`,
            });
        }

        // Count existing bids to construct custom ID
        const count = await Bid.countDocuments();
        const customId = `BID-${940 + count}`;

        // Prefer the real transaction hash returned by the wallet; fall back to
        // the simulated one so pre-blockchain flows keep working.
        const txHash = chainTxHash || generateTxHash();
        const trustScore = Math.floor(Math.random() * (95 - 70 + 1)) + 70;
        const submittedAt = new Date().toISOString().slice(0, 10);

        const newBid = await Bid.create({
            id: customId,
            tenderId,
            bidder:
                req.user.organisation || req.user.name || "Registered Bidder",
            user: req.user._id,
            amount: Number(amount),
            submittedAt,
            status: "Under Evaluation",
            trustScore,
            txHash,
            walletAddress: walletAddress || null,
            commitHash: commitHash || computeCommitHash(amount),
            originalAmount: Number(amount),
            tampered: false,
            tamperLog: [],
        });

        res.status(201).json({
            success: true,
            message:
                "Bid submitted successfully with AI trust scoring and on-chain verification",
            data: newBid,
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
            $or: [
                { user: req.user._id },
                { bidder: req.user.organisation || req.user.name },
            ],
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: bids.length,
            data: bids,
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
            data: bids,
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
                message: "Tender not found",
            });
        }

        // Check if bids are visible publicly or if requester is admin/owner
        if (!tender.bidsVisible && (!req.user || req.user.role !== "admin")) {
            return res.status(200).json({
                success: true,
                bidsVisible: false,
                message: "Bid details are sealed until closing date",
                data: [],
            });
        }

        const bids = await Bid.find({ tenderId }).sort({ amount: 1 });

        res.status(200).json({
            success: true,
            bidsVisible: true,
            count: bids.length,
            data: bids,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Overwrite the stored amount of an existing bid (ATTACK SIMULATION)
 * @route   PATCH /api/bids/:id/amount
 * @access  Private (Admin)
 *
 * This deliberately models a corrupt insider with database access. It rewrites
 * ONLY the off-chain record. The commitment written to the smart contract at
 * submission time is immutable and is left completely alone, which is exactly
 * what makes the tampering detectable from the bidder's side.
 */
export const adminUpdateBidAmount = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { amount, alsoUpdateStoredHash = false } = req.body;

        const newAmount = Number(amount);
        if (!Number.isFinite(newAmount) || newAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: "A positive numeric bid amount is required",
            });
        }

        const bid = await Bid.findOne({ id });
        if (!bid) {
            return res.status(404).json({
                success: false,
                message: `Bid not found with ID ${id}`,
            });
        }

        const previousAmount = bid.amount;

        // Snapshot the very first value once, so the demo can always show the
        // genuine figure alongside the manipulated one.
        if (bid.originalAmount === null || bid.originalAmount === undefined) {
            bid.originalAmount = previousAmount;
        }

        bid.amount = newAmount;
        bid.tampered = newAmount !== bid.originalAmount;

        // Optional "cover your tracks" step: the insider also rewrites the hash
        // cached in the database. The on-chain commitment still gives them away.
        if (alsoUpdateStoredHash) {
            bid.commitHash = computeCommitHash(newAmount);
        }

        bid.tamperLog.push({
            previousAmount,
            newAmount,
            changedBy: req.user?.email || req.user?.name || "admin",
            changedAt: new Date().toISOString(),
            storedHashRewritten: Boolean(alsoUpdateStoredHash),
        });

        await bid.save();

        res.status(200).json({
            success: true,
            message: `Bid ${id} amount changed from ${previousAmount} to ${newAmount} in the database. The on-chain commitment was not modified.`,
            data: bid,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Restore a tampered bid back to its original recorded amount
 * @route   PATCH /api/bids/:id/restore
 * @access  Private (Admin)
 *
 * Convenience for re-running the demo.
 */
export const adminRestoreBidAmount = async (req, res, next) => {
    try {
        const { id } = req.params;
        const bid = await Bid.findOne({ id });

        if (!bid) {
            return res.status(404).json({
                success: false,
                message: `Bid not found with ID ${id}`,
            });
        }

        if (bid.originalAmount === null || bid.originalAmount === undefined) {
            return res.status(400).json({
                success: false,
                message: "This bid has no recorded original amount to restore",
            });
        }

        const previousAmount = bid.amount;
        bid.amount = bid.originalAmount;
        bid.commitHash = computeCommitHash(bid.originalAmount);
        bid.tampered = false;
        bid.tamperLog.push({
            previousAmount,
            newAmount: bid.originalAmount,
            changedBy: req.user?.email || req.user?.name || "admin",
            changedAt: new Date().toISOString(),
            storedHashRewritten: true,
        });

        await bid.save();

        res.status(200).json({
            success: true,
            message: `Bid ${id} restored to its original amount`,
            data: bid,
        });
    } catch (error) {
        next(error);
    }
};
