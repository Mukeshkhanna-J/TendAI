import mongoose from 'mongoose';

const timelineEventSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    timestamp: { type: String, default: null },
    txHash: { type: String, default: 'Pending' }
  },
  { _id: false }
);

const tenderSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    title: {
      type: String,
      required: [true, 'Tender title is required'],
      trim: true
    },
    organisation: {
      type: String,
      required: [true, 'Organisation is required'],
      trim: true
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true
    },
    status: {
      type: String,
      enum: ['Live', 'Closed', 'Cancelled'],
      default: 'Live'
    },
    publishedDate: {
      type: String,
      default: () => new Date().toISOString().slice(0, 10)
    },
    closingDate: {
      type: String,
      required: [true, 'Closing date is required']
    },
    value: {
      type: Number,
      required: [true, 'Tender value is required']
    },
    emdAmount: {
      type: Number,
      required: [true, 'EMD amount is required']
    },
    description: {
      type: String,
      required: [true, 'Description is required']
    },
    eligibility: {
      type: String,
      required: [true, 'Eligibility criteria is required']
    },
    txHash: {
      type: String,
      required: true
    },
    bidsVisible: {
      type: Boolean,
      default: false
    },
    createdBy: {
      type: String,
      default: 'admin'
    },
    creatorUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    documents: {
      type: [String],
      default: []
    },
    timeline: {
      type: [timelineEventSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

const Tender = mongoose.model('Tender', tenderSchema);
export default Tender;
