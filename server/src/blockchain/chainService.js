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

// The server only ever *reads* from the contract. Bidders write to it
// directly from their own MetaMask wallet in the browser (see
// client/src/blockchain/chain.js) — the server never holds a private key
// or signs anything on a bidder's behalf.
let provider;
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
    contract = new ethers.Contract(CONTRACT_ADDRESS, deployment.abi, getProvider());
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
 * Read back the immutable on-chain commitment for a bid. This is the
 * authoritative source of truth used during integrity checks — never trust
 * the mutable database record for the comparison.
 */
export const getOnChainCommitment = async (bidId) => {
  const [commitHash, submitter, timestamp, exists] = await getContract().getBid(bidId);
  return {
    commitHash,
    submitter,
    timestamp: Number(timestamp),
    exists
  };
};

export const chainConfig = { RPC_URL, CONTRACT_ADDRESS };
