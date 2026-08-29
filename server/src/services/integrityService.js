import { computeCommitHash } from '../utils/commitReveal.js';
import { getOnChainCommitment, isChainAvailable } from '../blockchain/chainService.js';

/**
 * Live integrity check for a bid: recomputes the commit hash from the bid's
 * *current* stored amount + its original salt, and compares it against the
 * immutable on-chain commitment. If anyone edits the bid's amount directly
 * in the database after submission (e.g. an admin, or a compromised
 * account) — without also being able to rewrite the blockchain — this
 * comparison will fail and the bid is reported as Compromised.
 *
 * Since bidders submit the on-chain transaction themselves from their own
 * MetaMask wallet, the contract's `submitter` (msg.sender) is a genuine
 * cryptographic fact, not something the server or database can fake. We
 * cross-check it against the wallet address recorded on the bid as a second,
 * independent signal.
 */
export const checkBidIntegrity = async (bid) => {
  if (!bid.salt || !bid.commitHash) {
    return { checked: false, intact: null, status: 'No On-Chain Commitment', source: null };
  }

  const liveHash = computeCommitHash(bid.amount, bid.salt);

  let onChainHash = bid.commitHash;
  let source = 'database (blockchain node unreachable)';
  let submitterMatches = null;
  if (await isChainAvailable()) {
    const onChain = await getOnChainCommitment(bid.id);
    if (onChain.exists) {
      onChainHash = onChain.commitHash;
      source = 'blockchain';
      if (bid.bidderWalletAddress) {
        submitterMatches = onChain.submitter.toLowerCase() === bid.bidderWalletAddress.toLowerCase();
      }
    }
  }

  const hashIntact = liveHash.toLowerCase() === onChainHash.toLowerCase();
  const intact = hashIntact && submitterMatches !== false;

  return {
    checked: true,
    intact,
    status: intact ? 'Verified' : 'Compromised',
    source,
    liveHash,
    onChainHash,
    submitterMatches
  };
};

export const checkManyBidIntegrity = async (bids) => {
  const results = await Promise.all(bids.map((bid) => checkBidIntegrity(bid)));
  return bids.map((bid, index) => ({ bid, integrity: results[index] }));
};
