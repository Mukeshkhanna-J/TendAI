import crypto from 'node:crypto';

/**
 * Must exactly match client/src/hooks/useSubmitToChain.js's computeCommitHash
 * — same input format (`${amount}:${salt}`), same algorithm (SHA-256). SHA-256
 * of identical UTF-8 bytes is identical regardless of which library computes
 * it (js-sha256 in the browser, Node's crypto module here), so the two sides
 * never need to share code, only agree on the input format.
 */
export const computeCommitHash = (amount, salt) =>
  `0x${crypto.createHash('sha256').update(`${amount}:${salt}`).digest('hex')}`;
