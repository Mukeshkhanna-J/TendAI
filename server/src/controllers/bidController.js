import Bid from '../models/Bid.js';
import Tender from '../models/Tender.js';
import { getOnChainCommitment, isChainAvailable } from '../blockchain/chainService.js';
import { analyzeBid } from '../utils/trustAnalysis.js';
import { checkBidIntegrity, checkManyBidIntegrity } from '../services/integrityService.js';

/**
 * @desc    Record a bid whose commitment was already submitted directly to
 *          the blockchain from the bidder's own wallet (MetaMask, in the
 *          browser — see client/src/blockchain/chain.js). The server never
 *          generates the hash, never signs anything, and never holds a
 *          private key on the bidder's behalf; it only trusts what it can
 *          independently verify by reading the chain itself.
 * @route   POST /api/bids
 * @access  Private (Bidder)
 */
export const submitBid = async (req, res, next) => {
  try {
    const { id, tenderId, amount, salt, commitHash, txHash, chainBlockNumber, bidderWalletAddress } = req.body;

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

    const existing = await Bid.findOne({ id });
    if (existing) {
      return res.status(409).json({ success: false, message: `Bid ID ${id} has already been recorded.` });
    }

    // Trust-but-verify: don't take the client's word for the on-chain
    // commitment — independently read the chain and require it to match
    // before persisting anything. This is what stops a malicious client
    // from claiming a commitment it never actually made.
    if (!(await isChainAvailable())) {
      return res.status(503).json({
        success: false,
        message: 'Blockchain node unreachable — cannot verify the on-chain commitment for this bid.'
      });
    }
    const onChain = await getOnChainCommitment(id);
    if (!onChain.exists) {
      return res.status(400).json({
        success: false,
        message: 'No on-chain commitment found for this bid ID. Submit the transaction from your wallet first.'
      });
    }
    if (onChain.commitHash.toLowerCase() !== String(commitHash).toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'The commit hash does not match what is recorded on-chain for this bid ID.'
      });
    }

    const { score: trustScore, factors: trustFactors } = analyzeBid(Number(amount), tender);
    const submittedAt = new Date().toISOString().slice(0, 10);

    const newBid = await Bid.create({
      id,
      tenderId,
      bidder: req.user.organisation || req.user.name || 'Registered Bidder',
      user: req.user._id,
      amount: Number(amount),
      submittedAt,
      status: 'Under Evaluation',
      trustScore,
      trustFactors,
      txHash,
      salt,
      commitHash,
      bidderWalletAddress: onChain.submitter || bidderWalletAddress,
      chainBlockNumber: chainBlockNumber ?? null
    });

    res.status(201).json({
      success: true,
      message: 'Bid recorded and independently verified against the on-chain commitment.',
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

    const enriched = await checkManyBidIntegrity(bids);

    res.status(200).json({
      success: true,
      count: bids.length,
      data: enriched.map(({ bid, integrity }) => ({ ...bid.toObject(), integrity }))
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

    const enriched = await checkManyBidIntegrity(bids);

    res.status(200).json({
      success: true,
      count: bids.length,
      data: enriched.map(({ bid, integrity }) => ({ ...bid.toObject(), integrity }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    DEMO ONLY — directly overrides a bid's stored amount, bypassing
 *          the commit-reveal flow entirely (no new salt/hash is generated,
 *          and the blockchain commitment is left untouched).
 *          This simulates an insider (or a compromised admin account)
 *          editing a bid record directly in the database. Because the
 *          on-chain commitment can't be rewritten, the change is
 *          immediately detectable via checkBidIntegrity — every place the
 *          bid is displayed will start reporting it as "Compromised".
 * @route   PATCH /api/bids/:id/admin-override
 * @access  Private (Admin)
 */
export const adminOverrideBidAmount = async (req, res, next) => {
  try {
    const { amount, note } = req.body;

    const bid = await Bid.findOne({ id: req.params.id });
    if (!bid) {
      return res.status(404).json({ success: false, message: 'Bid not found' });
    }

    const previousAmount = bid.amount;
    bid.amount = Number(amount);
    bid.adminModified = {
      at: new Date(),
      byAdminName: req.user.name || req.user.email,
      previousAmount,
      note: note || 'Amount overridden directly by an administrator (demo: insider tampering).'
    };
    await bid.save();

    const integrity = await checkBidIntegrity(bid);

    res.status(200).json({
      success: true,
      message: integrity.intact
        ? 'Bid amount updated. The new value happens to still match the blockchain commitment.'
        : 'Bid amount overridden directly in the database, bypassing the blockchain-verified commit. This bid now fails integrity verification everywhere it is displayed.',
      data: bid,
      integrity
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
    const enriched = await checkManyBidIntegrity(bids);

    res.status(200).json({
      success: true,
      bidsVisible: true,
      count: bids.length,
      data: enriched.map(({ bid, integrity }) => ({ ...bid.toObject(), integrity }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Persist the result of a document verification the bidder's
 *          browser already performed entirely client-side (see
 *          client/src/blockchain/chain.js and BidVerificationPanel.jsx):
 *          it read the commitment directly from the chain via getBid,
 *          recomputed the hash from the document amount + salt, and
 *          compared them locally. This endpoint only records that outcome
 *          so it's visible on the Admin Dashboard and public transparency
 *          page too — the server does not redo or arbitrate the check.
 * @route   POST /api/bids/:id/verify-document
 * @access  Private (Bidder who owns the bid, or Admin)
 */
export const recordVerificationResult = async (req, res, next) => {
  try {
    const { verified, documentAmount, documentName, recomputedHash, onChainHash } = req.body;

    const bid = await Bid.findOne({ id: req.params.id });
    if (!bid) {
      return res.status(404).json({ success: false, message: 'Bid not found' });
    }

    const isOwner = bid.user && bid.user.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to record verification for this bid' });
    }

    bid.verification = {
      status: verified ? 'Verified' : 'Failed',
      documentName: documentName || 'submitted-document',
      revealedAmount: Number(documentAmount),
      recomputedHash,
      onChainHash,
      reason: verified
        ? 'Document amount matched the on-chain commitment (checked client-side against the blockchain).'
        : 'Document amount did not match the on-chain commitment. Verification failed — possible tampering.',
      verifiedAt: new Date()
    };
    await bid.save();

    res.status(200).json({ success: true, data: bid.verification });
  } catch (error) {
    next(error);
  }
};
