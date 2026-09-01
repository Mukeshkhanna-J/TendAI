import { computeCommitHash } from '../utils/commitReveal.js';
import { getOnChainCommitment, isChainAvailable } from '../blockchain/chainService.js';

/**
 * Live integrity check for a bid: recomputes the commit hash from the bid's
 * *current* stored amount + its original salt, and compares it against the
 * immutable on-chain commitment for that (tenderId, bidderWalletAddress)
 * pair. If anyone edits the bid's amount directly in the database after
 * submission (e.g. an admin, or a compromised account) — without also being
 * able to rewrite the blockchain — this comparison fails and the bid is
 * reported as Compromised.
 */
export const checkBidIntegrity = async (bid) => {
  if (!bid.salt || !bid.commitHash || !bid.bidderWalletAddress) {
    return { checked: false, intact: null, status: 'No On-Chain Commitment', source: null };
  }

  const liveHash = computeCommitHash(bid.amount, bid.salt);

  let onChainHash = bid.commitHash;
  let source = 'database (blockchain node unreachable)';
  if (await isChainAvailable()) {
    const onChain = await getOnChainCommitment(bid.tenderId, bid.bidderWalletAddress);
    if (onChain.exists) {
      onChainHash = onChain.commitHash;
      source = 'blockchain';
    }
  }

  const intact = liveHash.toLowerCase() === onChainHash.toLowerCase();
  return {
    checked: true,
    intact,
    status: intact ? 'Verified' : 'Compromised',
    source,
    liveHash,
    onChainHash
  };
};

export const checkManyBidIntegrity = async (bids) => {
  const results = await Promise.all(bids.map((bid) => checkBidIntegrity(bid)));
  return bids.map((bid, index) => ({ bid, integrity: results[index] }));
};
