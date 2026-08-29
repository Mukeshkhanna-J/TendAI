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
 * Matches the hashing the client re-derives at reveal/verify time, and is
 * the exact value stored immutably on-chain via BidVerification.commitBid.
 */
export const computeCommitHash = (amount, salt) =>
  ethers.solidityPackedKeccak256(['uint256', 'string'], [BigInt(Math.round(Number(amount))), salt]);

/**
 * Sign the commit hash with a bidder's wallet private key — this is the
 * "signed hash" step in the commit flow, standing in for a real crypto
 * wallet (e.g. MetaMask) signature.
 */
export const signCommitHash = async (privateKey, commitHash) => {
  const wallet = new ethers.Wallet(privateKey);
  const signature = await wallet.signMessage(ethers.getBytes(commitHash));
  return { signature, address: wallet.address };
};

/**
 * Recover the address that produced a signature over a commit hash, so it
 * can be compared against the bidder's registered wallet address.
 */
export const recoverSigner = (commitHash, signature) =>
  ethers.verifyMessage(ethers.getBytes(commitHash), signature);
