import { useWriteContract, usePublicClient, useAccount } from "wagmi";
import contractDetails from "../constants/contractDetails.json";
import { sha256 } from "js-sha256";

export function useSubmitToChain() {
    const { abi, address } = contractDetails;
    const { data: hash, writeContractAsync } = useWriteContract();
    const { address: sender_addr, isConnected, chainId } = useAccount();
    const publicClient = usePublicClient();

    const submitToChain = async (bidData) => {
        if (!isConnected) {
            throw new Error("Wallet not connected");
        }
        const result = await publicClient.readContract({
            address: address,
            abi,
            functionName: "getBidderCommitment",
            args: [bidData.tenderId, sender_addr],
        });
        const exists = result[3];
        console.log(exists);
        if (exists) {
            throw new Error("Bid already submitted");
        }
        const hashOfAmount = `0x${sha256(bidData.amount)}`;
        //console.log(hashOfAmount);
        const hash = await writeContractAsync({
            address: address,
            abi,
            functionName: "submitBid",
            args: [bidData.tenderId, hashOfAmount],
        });

        return hash;
    };

    return submitToChain;
}
