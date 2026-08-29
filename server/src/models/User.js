import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ethers } from 'ethers';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false
    },
    organisation: {
      type: String,
      default: ''
    },
    role: {
      type: String,
      enum: ['bidder', 'admin'],
      default: 'bidder'
    },
    savedTenders: [
      {
        type: String // Stores tender custom id e.g. "TND-2026-001"
      }
    ],
    // DEMO-ONLY simulated crypto wallet used to sign bid commit hashes.
    // A real system would never let the private key touch the server —
    // the user's own wallet (e.g. MetaMask) would sign client-side. It is
    // custodied here purely so the commit/verify demo works end-to-end
    // without requiring every demo user to install a wallet extension.
    walletAddress: {
      type: String,
      default: ''
    },
    walletPrivateKey: {
      type: String,
      default: '',
      select: false
    }
  },
  {
    timestamps: true
  }
);

// Encrypt password before saving user
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  // Give every new user a demo wallet so they can sign bid commitments.
  if (this.isNew && !this.walletAddress) {
    const wallet = ethers.Wallet.createRandom();
    this.walletAddress = wallet.address;
    this.walletPrivateKey = wallet.privateKey;
  }

  next();
});

// Compare user password with entered password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
