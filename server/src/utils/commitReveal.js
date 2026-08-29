import { ethers } from 'ethers';

/**
 * Generate a random salt for a bid commitment.
 *
 * This is safe to store in plaintext in the database ("even leaked, no
 * problem") — the salt alone does not let anyone forge a matching
 * commitment for a different amount, because commitHash is a one-way
 * function. You'd still need to already know the exact original amount.
 */
export const generateSalt = () => ethers.hexlify(ethers.randomBytes(16));

/**
 * commitHash = keccak256(amount, salt)
 * Matches the hashing the bidder's browser computes at submission time
 * (client/src/blockchain/chain.js) and at reveal/verify time, and is the
 * exact value written immutably on-chain via BidVerification.submitBid.
 */
export const computeCommitHash = (amount, salt) =>
  ethers.solidityPackedKeccak256(['uint256', 'string'], [BigInt(Math.round(Number(amount))), salt]);
