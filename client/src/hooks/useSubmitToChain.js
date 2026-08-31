import { useWriteContract, usePublicClient } from "wagmi";
import contractDetails from "../constants/contractDetails.json";
import { sha256 } from "js-sha256";

/**
 * Random per-bid salt, generated in the browser with the Web Crypto API
 * (built into every browser — no extra dependency needed). Safe to store
 * and display in plaintext: the security of the commitment comes from
 * SHA-256 being one-way, not from keeping the salt secret. Without already
 * knowing the exact original amount, the salt alone is useless for forging
 * a different amount that hashes to the same commitment.
 */
function generateSalt() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * commitHash = sha256(amount + ':' + salt). Must exactly match
 * server/src/utils/commitReveal.js's computeCommitHash.
 */
export function computeCommitHash(amount, salt) {
  return `0x${sha256(`${amount}:${salt}`)}`;
}

export function useSubmitToChain() {
  const { abi, address } = contractDetails;
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const submitToChain = async (bidData) => {
    const salt = generateSalt();
    const commitHash = computeCommitHash(bidData.amount, salt);

    const txHash = await writeContractAsync({
      address,
      abi,
      functionName: "submitBid",
      args: [bidData.tenderId, commitHash]
    });

    // Wait for the transaction to actually be mined before returning — the
    // server verifies this commitment by reading the chain immediately
    // afterward, so it needs to already be there.
    await publicClient.waitForTransactionReceipt({ hash: txHash });

    return { txHash, salt, commitHash };
  };

  return submitToChain;
}
