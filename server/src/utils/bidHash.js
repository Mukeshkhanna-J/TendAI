import crypto from 'crypto';

/**
 * Canonical string form of a bid amount.
 *
 * The on-chain commitment is sha256 of this exact string, so the client and the
 * server MUST normalise the amount identically. Keep this in sync with
 * `client/src/utils/bidHash.js`.
 */
export const canonicalAmount = (amount) => String(Number(amount));

/**
 * Compute the 0x-prefixed sha256 commitment for a bid amount.
 * This is the same value the bidder committed on-chain at submission time.
 */
export const computeCommitHash = (amount) =>
  `0x${crypto.createHash('sha256').update(canonicalAmount(amount)).digest('hex')}`;
