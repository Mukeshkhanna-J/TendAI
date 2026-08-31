import { ethers } from 'ethers';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Shared source of truth with the client: written by
// blockchain/scripts/deploy.js whenever TenderContract is (re)deployed.
// Reading it directly (rather than duplicating a copy under server/) means
// the server can never drift out of sync with what the frontend is using.
const deployment = JSON.parse(
  readFileSync(
    path.join(__dirname, '..', '..', '..', 'client', 'src', 'constants', 'contractDetails.json'),
    'utf-8'
  )
);

const RPC_URL = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:7545';
const CONTRACT_ADDRESS = process.env.BID_CONTRACT_ADDRESS || deployment.address;

// The server only ever reads from the contract. Bidders write to it
// directly from their own connected wallet (RainbowKit/wagmi) in the
// browser — the server never holds a private key or signs anything.
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
 * Read back the immutable commitment a wallet made for a given tender.
 * This contract keys commitments by (tenderId, bidderAddress) — one bid
 * per wallet per tender — rather than by a custom bid ID.
 */
export const getOnChainCommitment = async (tenderId, bidderAddress) => {
  const [commitHash, submitter, timestamp, exists] = await getContract().getBidderCommitment(
    tenderId,
    bidderAddress
  );
  return { commitHash, submitter, timestamp: Number(timestamp), exists };
};

export const chainConfig = { RPC_URL, CONTRACT_ADDRESS };
