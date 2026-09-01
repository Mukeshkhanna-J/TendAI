import { defineConfig } from "hardhat/config";
import hardhatEthersPlugin from "@nomicfoundation/hardhat-ethers";
import hardhatMocha from "@nomicfoundation/hardhat-mocha";
import dotenv from "dotenv";

dotenv.config();

const networks: Record<string, unknown> = {};

// Only wire up the Ganache/remote network if credentials are actually provided.
// Without this guard, hardhat fails config validation (even for --help) as
// soon as GANACHE_RPC_URL / GANACHE_PRIVATE_KEY are unset.
if (process.env.GANACHE_RPC_URL && process.env.GANACHE_PRIVATE_KEY) {
    networks.ganache = {
        type: "http",
        chainType: "l1",
        url: process.env.GANACHE_RPC_URL,
        accounts: [process.env.GANACHE_PRIVATE_KEY],
    };
}

export default defineConfig({
    solidity: {
        version: "0.8.20",
        settings: {
            evmVersion: "paris",
        },
    },
    plugins: [hardhatEthersPlugin, hardhatMocha],
    networks,
});
