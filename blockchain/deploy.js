import { error } from 'console';
import { ethers } from 'ethers';
import fs from 'fs';

// const providerURL = ;
// const pvt_key = ;

async function main() {
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:7545');
  const wallet = new ethers.Wallet(
    '0x1bdf49cf24897d3e8e64827541cb9d081350845f9039958cf25b4aba8c592eb5',
    provider
  );
  const abi = fs.readFileSync('./build/blockchain_SimpleStorage_sol_SimpleStorage.abi', 'utf-8');
  const binary = fs.readFileSync('./build/blockchain_SimpleStorage_sol_SimpleStorage.bin', 'utf-8');
  const contractFactory = new ethers.ContractFactory(abi, binary, wallet);
  console.log('deploying...');
  const contract = await contractFactory.deploy();
  console.log(contract);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
