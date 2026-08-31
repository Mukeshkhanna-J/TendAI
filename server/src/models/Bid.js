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
    txHash: {
      type: String,
      required: true
    },

    // --- Commit-reveal integrity fields ---
    // Generated client-side (see useSubmitToChain.js) at submission time:
    // commitHash = sha256(amount + ':' + salt), written on-chain via
    // TenderContract.submitBid(tenderId, commitHash) directly from the
    // bidder's own connected wallet. The copies here are only a convenience
    // cache for display — verification always re-reads the chain itself.
    salt: {
      type: String,
      default: ''
    },
    commitHash: {
      type: String,
      default: ''
    },
    // The bidder's connected wallet address, as reported by their browser.
    // Cross-checked against the on-chain commitment's own submitter
    // (msg.sender of their transaction) before this record is ever created.
    bidderWalletAddress: {
      type: String,
      default: ''
    },

    // Audit trail for the "insider tampering" demo: set whenever an admin
    // uses the direct override to change a bid's amount, bypassing the
    // commit-reveal flow entirely. Kept separate from the blockchain
    // integrity check on purpose, so the demo can show both: "someone
    // changed this on X date" (this field) AND "and here's cryptographic
    // proof it no longer matches what was committed" (checkBidIntegrity).
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
