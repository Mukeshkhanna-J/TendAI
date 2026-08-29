import { useWriteContract } from "wagmi";
import abi from "../constants/abi.json";
import { useAuth } from "../hooks/useAuth";

export function useSubmitToChain() {
    const { user } = useAuth();
    const { data: hash, writeContractAsync } = useWriteContract();

    const submitToChain = async (bidData) => {
        console.log(bidData);
        const hash = writeContractAsync({
            address: "0xf9B4B860d89b2de527Ec58cf79b8cfa9500b8a7e",
            abi,
            functionName: "submitBid",
            args: [bidData.tenderId, BigInt(bidData.amount), user.organisation],
        });
        return hash;
    };
    return submitToChain;
}
