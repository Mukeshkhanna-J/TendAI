import mongoose from 'mongoose';

const bidSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    tenderId: {
      type: String,
      required: [true, 'Tender ID is required'],
      trim: true
    },
    bidder: {
      type: String,
      required: [true, 'Bidder organisation or name is required'],
      trim: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    amount: {
      type: Number,
      required: [true, 'Bid amount is required']
    },
    submittedAt: {
      type: String,
      default: () => new Date().toISOString().slice(0, 10)
    },
    status: {
      type: String,
      enum: ['Under Evaluation', 'Awarded', 'Rejected', 'Cancelled'],
      default: 'Under Evaluation'
    },
    trustScore: {
      type: Number,
      default: () => Math.floor(Math.random() * (95 - 65 + 1)) + 65
    },
    // Snapshot of the transparent, rule-based factors that produced
    // trustScore at submission time (see utils/trustAnalysis.js). Stored
    // as a snapshot so the public "proof" for a score stays accurate even
    // if the tender's value is edited later.
    trustFactors: {
      type: [
        {
          label: { type: String },
          verdict: { type: String, enum: ['good', 'caution', 'bad'] },
          impact: { type: Number },
          detail: { type: String },
          _id: false
        }
      ],
      default: []
    },
    txHash: {
      type: String,
      required: true
    },

    // --- Commit-reveal integrity fields ---
    // salt + commitHash are produced client-side in the bidder's browser at
    // submission time (client/src/blockchain/chain.js) and the commit is
    // written on-chain directly from the bidder's own connected wallet
    // (see chainService.js). The DB copies here are only a convenience
    // cache for display, never the source of truth used during
    // verification — that's always a live read from the chain.
    salt: {
      type: String,
      default: ''
    },
    commitHash: {
      type: String,
      default: ''
    },
    // The bidder's real MetaMask address, as reported by their browser
    // when connecting. Cross-checked against the on-chain transaction's
    // msg.sender in integrityService.js — that on-chain value is the
    // authoritative fact; this field is only a display cache.
    bidderWalletAddress: {
      type: String,
      default: ''
    },
    chainBlockNumber: {
      type: Number,
      default: null
    },

    // Populated later when a bid document (containing the claimed amount)
    // is submitted and checked against the on-chain commitment.
    verification: {
      status: {
        type: String,
        enum: ['Not Submitted', 'Verified', 'Failed'],
        default: 'Not Submitted'
      },
      documentName: { type: String, default: '' },
      revealedAmount: { type: Number, default: null },
      recomputedHash: { type: String, default: '' },
      onChainHash: { type: String, default: '' },
      reason: { type: String, default: '' },
      verifiedAt: { type: Date, default: null }
    },

    // Audit trail for the "insider tampering" demo: set whenever an admin
    // uses the direct override to change a bid's amount, bypassing the
    // commit-reveal flow entirely. This is traditional audit logging —
    // deliberately kept separate from the blockchain integrity check so
    // the demo can show both: "someone changed this on X date" (this
    // field) AND "and here's cryptographic proof it no longer matches
    // what was originally committed" (checkBidIntegrity).
    adminModified: {
      at: { type: Date, default: null },
      byAdminName: { type: String, default: '' },
      previousAmount: { type: Number, default: null },
      note: { type: String, default: '' }
    }
  },
  {
    timestamps: true
  }
);

const Bid = mongoose.model('Bid', bidSchema);
export default Bid;
