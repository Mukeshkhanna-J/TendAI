import { ethers } from "ethers";
import deployment from "./BidVerification.json";

// JSON-RPC endpoint of the chain this contract is deployed to. Also used for
// all read-only queries (getBid), so verification keeps working regardless of
// which network the user's wallet happens to be pointed at.
const RPC_URL = import.meta.env.VITE_BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545";

// Hardhat's default local chain id. The contract address in
// BidVerification.json only exists on this chain — on any other network
// (mainnet especially) that address is meaningless and a transaction sent
// there would spend real funds for nothing.
const EXPECTED_CHAIN_ID = Number(import.meta.env.VITE_BLOCKCHAIN_CHAIN_ID || 31337);
const EXPECTED_CHAIN_ID_HEX = `0x${EXPECTED_CHAIN_ID.toString(16)}`;

export const hasMetaMask = () => typeof window !== "undefined" && !!window.ethereum;

/**
 * Make sure the wallet is pointed at the chain our contract actually lives
 * on, asking it to switch (and adding the network first if the wallet has
 * never seen it) rather than letting a transaction go out on the wrong one.
 */
async function ensureCorrectNetwork(provider) {
  const { chainId } = await provider.getNetwork();
  if (Number(chainId) === EXPECTED_CHAIN_ID) return;

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: EXPECTED_CHAIN_ID_HEX }]
    });
  } catch (err) {
    // 4902 = wallet doesn't know this network yet, so offer to add it.
    if (err.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: EXPECTED_CHAIN_ID_HEX,
            chainName: "TendAI Local Chain",
            rpcUrls: [RPC_URL],
            nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 }
          }
        ]
      });
    } else {
      throw new Error(
        `Wrong network. Switch your wallet to the local test chain (chain ID ${EXPECTED_CHAIN_ID}) before submitting a bid.`
      );
    }
  }
}

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
  let provider = new ethers.BrowserProvider(window.ethereum);
  const accounts = await provider.send("eth_requestAccounts", []);

  await ensureCorrectNetwork(provider);
  // Rebuild the provider so it picks up the (possibly switched) network.
  provider = new ethers.BrowserProvider(window.ethereum);

  const signer = await provider.getSigner();
  const network = await provider.getNetwork();

  // A funded account is required to pay gas. On the local test chain every
  // pre-seeded Hardhat account already holds test ETH; an empty balance
  // almost always means a personal (real-network) account was imported by
  // mistake, which produces a confusing "insufficient funds" error later.
  const balance = await provider.getBalance(accounts[0]);
  if (balance === 0n) {
    throw new Error(
      "This account has no test ETH on the local chain. Import one of the funded accounts printed by `npx hardhat node` instead."
    );
  }

  return { provider, signer, address: accounts[0], chainId: Number(network.chainId) };
}

// Reads always go straight to the chain's own RPC — never through the wallet,
// so verification works even with no wallet installed or connected.
function getReadProvider() {
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

export const chainConfig = { RPC_URL, CONTRACT_ADDRESS: deployment.address, EXPECTED_CHAIN_ID };
