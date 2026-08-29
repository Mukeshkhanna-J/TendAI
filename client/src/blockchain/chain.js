import { ethers } from "ethers";
import deployment from "./BidVerification.json";

// Fallback JSON-RPC endpoint used for read-only chain queries (getBid) when
// no wallet is connected yet — reading the chain shouldn't require MetaMask.
const RPC_URL = import.meta.env.VITE_BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545";

export const hasMetaMask = () => typeof window !== "undefined" && !!window.ethereum;

/**
 * Ask the browser wallet (MetaMask) for account access and return a signer
 * tied to the connected account. Every subsequent on-chain write (submitBid)
 * is signed by this account's own private key, inside the wallet — it never
 * touches our server or our JavaScript.
 */
export async function connectWallet() {
  if (!hasMetaMask()) {
    throw new Error("MetaMask not detected. Install the MetaMask browser extension to submit a bid.");
  }
  const provider = new ethers.BrowserProvider(window.ethereum);
  const accounts = await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  const network = await provider.getNetwork();
  return { provider, signer, address: accounts[0], chainId: Number(network.chainId) };
}

function getReadProvider() {
  if (hasMetaMask()) return new ethers.BrowserProvider(window.ethereum);
  return new ethers.JsonRpcProvider(RPC_URL);
}

function getContract(signerOrProvider) {
  return new ethers.Contract(deployment.address, deployment.abi, signerOrProvider);
}

/** Safe to store/display in plaintext — see commitReveal notes on the server. */
export const generateSalt = () => ethers.hexlify(ethers.randomBytes(16));

/** Must exactly match the hashing the server/contract expect: keccak256(amount, salt). */
export const computeCommitHash = (amount, salt) =>
  ethers.solidityPackedKeccak256(["uint256", "string"], [BigInt(Math.round(Number(amount))), salt]);

/**
 * Submit a bid's commit hash directly to the blockchain from the connected
 * wallet. The contract itself enforces that a given bidId can only ever be
 * committed once (see BidVerification.sol) — a second attempt reverts.
 */
export async function submitBidOnChain(signer, bidId, commitHash) {
  const contract = getContract(signer);
  const tx = await contract.submitBid(bidId, commitHash);
  const receipt = await tx.wait();
  return { txHash: receipt.hash, blockNumber: receipt.blockNumber };
}

/**
 * Read a bid's commitment straight from the chain — no server involved.
 * Works whether or not a wallet is connected (falls back to a plain
 * read-only RPC connection).
 */
export async function getBidOnChain(bidId) {
  const contract = getContract(getReadProvider());
  const [commitHash, submitter, timestamp, exists] = await contract.getBid(bidId);
  return { commitHash, submitter, timestamp: Number(timestamp), exists };
}

export const chainConfig = { RPC_URL, CONTRACT_ADDRESS: deployment.address };
