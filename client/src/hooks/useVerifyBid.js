import { useCallback } from "react";
import { useConfig } from "wagmi";
import { readContract } from "wagmi/actions";
import contractDetails from "../constants/contractDetails.json";
import { computeCommitHash, hashesMatch } from "../utils/bidHash.js";

/**
 * Verification verdicts.
 *
 * VERIFIED   - database amount hashes to exactly the commitment on-chain.
 * TAMPERED   - a commitment exists, but the database amount no longer hashes
 *              to it. Somebody changed the value after submission.
 * NOT_ON_CHAIN - the contract holds no commitment for this tender + wallet.
 * NO_WALLET  - the bid record predates on-chain anchoring (e.g. seeded data).
 * ERROR      - the RPC read failed (node down, wrong network, bad address).
 */
export const VERIFY_STATUS = {
    VERIFIED: "VERIFIED",
    TAMPERED: "TAMPERED",
    NOT_ON_CHAIN: "NOT_ON_CHAIN",
    NO_WALLET: "NO_WALLET",
    ERROR: "ERROR",
};

/**
 * Normalise the tuple viem returns for getBidderCommitment.
 * Multi-output Solidity functions decode to an array; be tolerant either way.
 */
function readCommitment(result) {
    if (Array.isArray(result)) {
        const [commitHash, submitter, timestamp, exists] = result;
        return { commitHash, submitter, timestamp, exists };
    }
    return result || {};
}

/**
 * Re-verify a stored bid against the immutable commitment in the smart contract.
 *
 * The database is treated as untrusted: we take the amount currently stored
 * off-chain, hash it locally with the same rule used at submission time, and
 * compare it with the bytes32 the contract has held since the bid was made.
 * Nothing here writes to the chain.
 */
export function useVerifyBid() {
    const config = useConfig();
    const { abi, address } = contractDetails;

    return useCallback(
        async (bid) => {
            const base = {
                bidId: bid?.id,
                tenderId: bid?.tenderId,
                amount: bid?.amount,
                walletAddress: bid?.walletAddress || null,
                storedHash: bid?.commitHash || null,
                localHash: null,
                chainHash: null,
                submitter: null,
                committedAt: null,
                checkedAt: new Date().toISOString(),
            };

            if (!bid?.walletAddress) {
                return {
                    ...base,
                    status: VERIFY_STATUS.NO_WALLET,
                    message:
                        "This bid has no wallet address on record, so it was never anchored on-chain and cannot be verified.",
                };
            }

            // Hash of the value as it stands in the database right now.
            const localHash = computeCommitHash(bid.amount);

            try {
                const raw = await readContract(config, {
                    address,
                    abi,
                    functionName: "getBidderCommitment",
                    args: [bid.tenderId, bid.walletAddress],
                });

                const { commitHash, submitter, timestamp, exists } =
                    readCommitment(raw);

                if (!exists) {
                    return {
                        ...base,
                        localHash,
                        status: VERIFY_STATUS.NOT_ON_CHAIN,
                        message:
                            "No commitment found on the contract for this tender and wallet. If the bid was just submitted, wait for the transaction to be mined and try again.",
                    };
                }

                const chainHash = String(commitHash);
                const committedAt = timestamp
                    ? new Date(Number(timestamp) * 1000).toISOString()
                    : null;

                if (hashesMatch(localHash, chainHash)) {
                    return {
                        ...base,
                        localHash,
                        chainHash,
                        submitter,
                        committedAt,
                        status: VERIFY_STATUS.VERIFIED,
                        message:
                            "The stored bid amount hashes to exactly the commitment recorded on-chain. The value is untampered.",
                    };
                }

                return {
                    ...base,
                    localHash,
                    chainHash,
                    submitter,
                    committedAt,
                    status: VERIFY_STATUS.TAMPERED,
                    message:
                        "The stored bid amount does NOT hash to the commitment recorded on-chain. The value was changed after submission.",
                };
            } catch (error) {
                console.error("On-chain verification failed:", error);
                return {
                    ...base,
                    localHash,
                    status: VERIFY_STATUS.ERROR,
                    message:
                        error?.shortMessage ||
                        error?.message ||
                        "Could not reach the blockchain node to read the commitment.",
                };
            }
        },
        [config, abi, address],
    );
}
