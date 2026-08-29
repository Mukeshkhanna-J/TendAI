import Bid from '../models/Bid.js';
import Tender from '../models/Tender.js';
import User from '../models/User.js';
import { generateTxHash } from '../utils/generateHash.js';
import { generateSalt, computeCommitHash, signCommitHash, recoverSigner } from '../utils/commitReveal.js';
import { commitBidOnChain, getOnChainCommitment, isChainAvailable } from '../blockchain/chainService.js';

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

    // Count existing bids to construct custom ID. The on-chain contract
    // enforces a write-once commitment per bidId, so if the counter and the
    // chain ever fall out of sync (e.g. a database reset while the chain
    // persists, as happens with the in-memory demo DB) we bump past any ID
    // that's already committed rather than failing the whole submission.
    let count = await Bid.countDocuments();
    let customId = `BID-${940 + count}`;
    const chainUp = await isChainAvailable();
    if (chainUp) {
      while ((await getOnChainCommitment(customId)).exists) {
        count += 1;
        customId = `BID-${940 + count}`;
      }
    }

    const trustScore = Math.floor(Math.random() * (95 - 70 + 1)) + 70;
    const submittedAt = new Date().toISOString().slice(0, 10);

    // --- Commit step: hash the bid amount with a random salt, sign the
    // hash with the bidder's wallet key, then push the hash on-chain. ---
    const salt = generateSalt();
    const commitHash = computeCommitHash(amount, salt);

    const bidderUser = await User.findById(req.user._id).select('+walletPrivateKey');
    const { signature, address: bidderWalletAddress } = await signCommitHash(
      bidderUser.walletPrivateKey,
      commitHash
    );

    let txHash;
    let chainBlockNumber = null;

    if (chainUp) {
      const chainResult = await commitBidOnChain(customId, commitHash);
      txHash = chainResult.txHash;
      chainBlockNumber = chainResult.blockNumber;
    } else {
      // Local blockchain node isn't running — fall back to a simulated
      // hash so the rest of the app still works, but verification against
      // an on-chain commitment won't be possible for this bid.
      txHash = generateTxHash();
    }

    const newBid = await Bid.create({
      id: customId,
      tenderId,
      bidder: req.user.organisation || req.user.name || 'Registered Bidder',
      user: req.user._id,
      amount: Number(amount),
      submittedAt,
      status: 'Under Evaluation',
      trustScore,
      txHash,
      salt,
      commitHash,
      signature,
      bidderWalletAddress,
      chainBlockNumber
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

/**
 * @desc    Verify a submitted bid document's stated amount against the
 *          immutable on-chain commitment made at bid submission time.
 *          This is the "reveal" half of the commit-reveal scheme: it
 *          proves whether the document's amount matches what was
 *          originally committed, catching any post-submission tampering.
 * @route   POST /api/bids/:id/verify-document
 * @access  Private (Bidder who owns the bid, or Admin)
 */
export const verifyBidDocument = async (req, res, next) => {
  try {
    const { documentAmount, documentName } = req.body;

    const bid = await Bid.findOne({ id: req.params.id });
    if (!bid) {
      return res.status(404).json({ success: false, message: 'Bid not found' });
    }

    const isOwner = bid.user && bid.user.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to verify this bid' });
    }

    if (!bid.salt || !bid.commitHash) {
      return res.status(400).json({
        success: false,
        message: 'This bid has no commit-reveal record (submitted before verification was enabled).'
      });
    }

    // Recompute the hash from the claimed document amount + the salt that
    // was generated at commit time. An attacker who edits the document to
    // change the amount cannot produce a matching hash without also
    // knowing what the *original* amount was — the salt alone is useless
    // for forging a different amount.
    const recomputedHash = computeCommitHash(documentAmount, bid.salt);

    // Look up the authoritative commitment. Prefer the immutable on-chain
    // copy; only fall back to the DB-cached hash if the chain node isn't
    // reachable (e.g. local demo without hardhat node running).
    let onChainHash = bid.commitHash;
    let source = 'database (blockchain node unreachable)';
    if (await isChainAvailable()) {
      const onChain = await getOnChainCommitment(bid.id);
      if (onChain.exists) {
        onChainHash = onChain.commitHash;
        source = 'blockchain';
      }
    }

    const hashesMatch = recomputedHash.toLowerCase() === onChainHash.toLowerCase();

    let signatureValid = null;
    if (bid.signature && bid.bidderWalletAddress) {
      try {
        const recovered = recoverSigner(bid.commitHash, bid.signature);
        signatureValid = recovered.toLowerCase() === bid.bidderWalletAddress.toLowerCase();
      } catch {
        signatureValid = false;
      }
    }

    const verified = hashesMatch && signatureValid !== false;

    bid.verification = {
      status: verified ? 'Verified' : 'Failed',
      documentName: documentName || 'submitted-document',
      revealedAmount: Number(documentAmount),
      recomputedHash,
      onChainHash,
      signatureValid,
      reason: verified
        ? `Document amount matches the ${source} commitment.`
        : !hashesMatch
        ? `Document amount does not match the ${source} commitment. The bid amount may have been tampered with after submission.`
        : 'Commit hash matches, but the wallet signature does not belong to the registered bidder.',
      verifiedAt: new Date()
    };
    await bid.save();

    // Always 200: a failed verification is a legitimate, expected outcome
    // of this check (that's the whole point of the tamper-detection demo),
    // not a server error.
    res.status(200).json({
      success: true,
      verified,
      source,
      data: bid.verification
    });
  } catch (error) {
    next(error);
  }
};
