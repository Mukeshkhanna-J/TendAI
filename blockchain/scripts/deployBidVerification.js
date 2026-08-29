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

    // Export the ABI + address so the Express server (a plain ethers.js
    // consumer, not a Hardhat project) can talk to this contract without
    // depending on the Hardhat toolchain at runtime.
    const artifact = await hre.artifacts.readArtifact("BidVerification");
    const outDir = path.join(__dirname, "..", "..", "server", "src", "blockchain");
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(
        path.join(outDir, "BidVerification.json"),
        JSON.stringify({ address, abi: artifact.abi }, null, 2)
    );
    console.log(`ABI + address written to server/src/blockchain/BidVerification.json`);
}

main()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
