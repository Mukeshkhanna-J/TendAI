import mongoose from 'mongoose';

/**
 * One recorded edit made to a bid amount after submission.
 * Kept purely as an audit trail for the tamper demo - the authoritative proof
 * of tampering is the hash mismatch against the smart contract, not this log.
 */
const tamperEntrySchema = new mongoose.Schema(
  {
    previousAmount: Number,
    newAmount: Number,
    changedBy: String,
    changedAt: String,
    storedHashRewritten: { type: Boolean, default: false }
  },
  { _id: false }
);

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
    // ---- On-chain anchoring (added for integrity verification) ----
    // Wallet that signed the commitment. Needed to look the bid up on-chain
    // via getBidderCommitment(tenderId, bidder).
    walletAddress: {
      type: String,
      default: null,
      trim: true
    },
    // sha256 of the amount, mirrored off-chain purely for display. The chain
    // copy is the authority - this one is as forgeable as `amount` itself.
    commitHash: {
      type: String,
      default: null,
      trim: true
    },
    // ---- Insider tamper demo bookkeeping ----
    // Amount as first recorded. Never rewritten by the admin edit endpoint.
    originalAmount: {
      type: Number,
      default: null
    },
    tampered: {
      type: Boolean,
      default: false
    },
    tamperLog: {
      type: [tamperEntrySchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

const Bid = mongoose.model('Bid', bidSchema);
export default Bid;
