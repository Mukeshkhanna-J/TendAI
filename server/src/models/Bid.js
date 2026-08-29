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
    // salt + commitHash + signature are produced at submission time.
    // commitHash is also written immutably on-chain (see chainService.js);
    // the DB copy here is only a convenience cache for display, never the
    // source of truth used during verification.
    salt: {
      type: String,
      default: ''
    },
    commitHash: {
      type: String,
      default: ''
    },
    signature: {
      type: String,
      default: ''
    },
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
      signatureValid: { type: Boolean, default: null },
      reason: { type: String, default: '' },
      verifiedAt: { type: Date, default: null }
    }
  },
  {
    timestamps: true
  }
);

const Bid = mongoose.model('Bid', bidSchema);
export default Bid;
