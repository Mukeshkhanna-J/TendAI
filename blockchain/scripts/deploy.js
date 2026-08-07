import hre from "hardhat";

async function main() {
    const connection = await hre.network.create();
    const { ethers } = connection;
    const contract = await ethers.deployContract("SimpleStorage");
    await contract.waitForDeployment();
    console.log(await contract.getAddress());
}

main()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
