import crypto from 'crypto';

/**
 * Generate a simulated 64-character 0x hex blockchain transaction hash
 */
export const generateTxHash = (prefix = '0x') => {
  const randomBytes = crypto.randomBytes(32).toString('hex');
  return `${prefix}${randomBytes}`;
};
