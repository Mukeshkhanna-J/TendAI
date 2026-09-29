module.exports = {
    networks: {
        ganache: {
            host: "127.0.0.1",
            port: 7545, // Match the port set in your GANACHE_RPC_URL (default: 7545 or 8545)
            network_id: "*", // Match any network id
        },
    },
    compilers: {
        solc: {
            version: "0.8.20", // Matches your Hardhat solidity version
            settings: {
                evmVersion: "paris", // Matches your Hardhat evmVersion
            },
        },
    },
};
