import { useWriteContract } from "wagmi";
import contractDetails from "../constants/contractDetails.json";
import { sha256 } from "js-sha256";

export function useSubmitToChain() {
    const { abi, address } = contractDetails;
    const { data: hash, writeContractAsync } = useWriteContract();

    const submitToChain = async (bidData) => {
        const hashOfAmount = `0x${sha256(bidData.amount)}`;
        //console.log(hashOfAmount);
        const hash = writeContractAsync({
            address: address,
            abi,
            functionName: "submitBid",
            args: [bidData.tenderId, hashOfAmount],
        });
        return hash;
    };
    return submitToChain;
}
