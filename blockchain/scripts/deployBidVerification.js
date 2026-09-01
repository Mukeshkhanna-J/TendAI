import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import hre from "hardhat";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
    const connection = await hre.network.create("localhost");
    const { ethers } = connection;

    const contract = await ethers.deployContract("BidVerification");
    await contract.waitForDeployment();
    const address = await contract.getAddress();

    console.log(`BidVerification deployed to: ${address}`);

    // Export the ABI + address so both the Express server (read-only chain
    // checks) and the React client (bidder's own MetaMask wallet writes
    // directly to this contract) can talk to it as plain ethers.js
    // consumers, without depending on the Hardhat toolchain at runtime.
    const artifact = await hre.artifacts.readArtifact("BidVerification");
    const payload = JSON.stringify({ address, abi: artifact.abi }, null, 2);

    const outDirs = [
        path.join(__dirname, "..", "..", "server", "src", "blockchain"),
        path.join(__dirname, "..", "..", "client", "src", "blockchain")
    ];
    for (const dir of outDirs) {
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, "BidVerification.json"), payload);
        console.log(`ABI + address written to ${path.relative(path.join(__dirname, "..", ".."), dir)}/BidVerification.json`);
    }
}

main()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
