import hre from "hardhat";

async function main() {
    const connection = await hre.network.create();
    const { ethers } = connection;
    const contractFactory = await ethers.getContractFactory("SimpleStorage");
    const contract = await contractFactory.deploy();
    console.log(await contract.getAddress());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
