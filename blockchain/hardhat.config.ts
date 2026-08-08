import { defineConfig, configVariable } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
import hardhatEthersPlugin from "@nomicfoundation/hardhat-ethers";
import dotenv from "dotenv";
import hardhatMocha from "@nomicfoundation/hardhat-mocha";

dotenv.config();

export default defineConfig({
    solidity: {
        version: "0.8.20",
        settings: {
            evmVersion: "paris",
        },
    },
    plugins: [hardhatEthersPlugin, hardhatMocha],
    networks: {
        ganache: {
            type: "http",
            chainType: "l1",
            url: process.env.GANACHE_RPC_URL,
            accounts: [process.env.GANACHE_PRIVATE_KEY],
        },
    },
});
