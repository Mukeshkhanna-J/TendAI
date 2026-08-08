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
    }
  },
  {
    timestamps: true
  }
);

const Bid = mongoose.model('Bid', bidSchema);
export default Bid;
