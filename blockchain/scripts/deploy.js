import hre from "hardhat";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
    // Deploys to the persistent Ganache instance defined in
    // hardhat.config.ts (requires GANACHE_RPC_URL / GANACHE_PRIVATE_KEY in
    // blockchain/.env, and a real Ganache node already running there).
    // Deploying to the default ephemeral network instead — e.g. by running
    // this script without --network ganache — spins up an in-memory chain
    // that vanishes the moment this process exits, silently writing an
    // address to contractDetails.json that no longer refers to anything.
    const connection = await hre.network.create("ganache");
    const { ethers } = connection;
    const contract = await ethers.deployContract("TenderContract");
    await contract.waitForDeployment();
    const addr = await contract.getAddress();
    console.log(`deployed contract at address ${addr}`);

    const artifact = await hre.artifacts.readArtifact("TenderContract");
    const payload = JSON.stringify(
        { address: addr, abi: artifact.abi },
        null,
        2,
    );

    const dir = path.join(__dirname, "..", "..", "client", "src", "constants");

    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "contractDetails.json"), payload);
    console.log(
        `ABI + address written to ${path.relative(path.join(__dirname, "..", ".."), dir)}/contractDetails.json`,
    );
}

main()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
