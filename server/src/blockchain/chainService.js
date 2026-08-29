import { ethers } from 'ethers';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Written by blockchain/scripts/deployBidVerification.js when the contract
// is (re)deployed to the local chain. Contains { address, abi }.
const deployment = JSON.parse(
  readFileSync(path.join(__dirname, 'BidVerification.json'), 'utf-8')
);

const RPC_URL = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545';
const CONTRACT_ADDRESS = process.env.BID_VERIFICATION_CONTRACT_ADDRESS || deployment.address;

// The relayer is the account that actually pays gas and sends the on-chain
// commitBid transaction on behalf of bidders (a common "meta-transaction"
// pattern). It is NOT the bidder's identity — the bidder's own identity and
// intent are proven separately by their wallet signature over the commit
// hash (see utils/commitReveal.js), which we verify independently of who
// relayed the transaction.
const RELAYER_PRIVATE_KEY =
  process.env.BLOCKCHAIN_PRIVATE_KEY ||
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Hardhat default account #0 (demo only)

let provider;
let relayerWallet;
let contract;
let chainAvailable = null;

function getProvider() {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(RPC_URL);
  }
  return provider;
}

function getContract() {
  if (!contract) {
    relayerWallet = new ethers.Wallet(RELAYER_PRIVATE_KEY, getProvider());
    contract = new ethers.Contract(CONTRACT_ADDRESS, deployment.abi, relayerWallet);
  }
  return contract;
}

/**
 * Checks whether the local chain node is reachable. Cached for the process
 * lifetime after the first successful check to avoid hammering the RPC.
 */
export const isChainAvailable = async () => {
  if (chainAvailable) return true;
  try {
    await getProvider().getBlockNumber();
    chainAvailable = true;
    return true;
  } catch {
    return false;
  }
};

/**
 * Commit a bid's hash on-chain. Reverts (throws) if this bidId was already
 * committed, since the contract enforces a write-once commitment per bid.
 */
export const commitBidOnChain = async (bidId, commitHash) => {
  const tx = await getContract().commitBid(bidId, commitHash);
  const receipt = await tx.wait();
  return {
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    relayerAddress: relayerWallet.address
  };
};

/**
 * Read back the immutable on-chain commitment for a bid. This is the
 * authoritative source of truth used during document verification — never
 * trust the mutable database record for the comparison.
 */
export const getOnChainCommitment = async (bidId) => {
  const [commitHash, submitter, timestamp, exists] = await getContract().getCommitment(bidId);
  return {
    commitHash,
    submitter,
    timestamp: Number(timestamp),
    exists
  };
};

export const chainConfig = { RPC_URL, CONTRACT_ADDRESS };
