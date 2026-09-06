import { useCallback } from "react";
import { useConfig } from "wagmi";
import { getBytecode, getChainId } from "wagmi/actions";
import contractDetails from "../constants/contractDetails.json";

/**
 * Check that the configured contract address actually holds code on the
 * connected chain.
 *
 * This matters before writing: a transaction sent to an address with no
 * contract deployed does NOT revert. It succeeds as a plain value transfer and
 * returns a perfectly ordinary transaction hash, having stored nothing. A bid
 * submitted that way looks fine until someone tries to verify it, at which
 * point there is no commitment to verify against.
 */
export function useContractDeployed() {
    const config = useConfig();
    const { address } = contractDetails;

    return useCallback(async () => {
        const chainId = getChainId(config);
        try {
            const bytecode = await getBytecode(config, { address });
            if (!bytecode || bytecode === "0x") {
                return {
                    ok: false,
                    address,
                    chainId,
                    message: `No contract found at ${address} on chain ${chainId}. Redeploy with blockchain/scripts/deploy.js (it rewrites contractDetails.json) and reload this page before submitting.`,
                };
            }
            return { ok: true, address, chainId };
        } catch (error) {
            console.error("Could not check for contract code:", error);
            return {
                ok: false,
                address,
                chainId,
                message:
                    error?.shortMessage ||
                    error?.message ||
                    "Could not reach the blockchain node to check the contract.",
            };
        }
    }, [config, address]);
}
