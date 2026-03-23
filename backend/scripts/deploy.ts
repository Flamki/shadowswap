import { ethers } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log('Deploying ShadowSwap backend...');
  console.log('Deployer:', deployer.address);
  console.log('Network chainId:', network.chainId.toString());

  const Vault = await ethers.getContractFactory('ShadowVault');
  const vault = await Vault.deploy();
  await vault.waitForDeployment();

  const OrderBook = await ethers.getContractFactory('ShadowOrderBook');
  const orderBook = await OrderBook.deploy(await vault.getAddress());
  await orderBook.waitForDeployment();

  const Settlement = await ethers.getContractFactory('ShadowSettlement');
  const settlement = await Settlement.deploy(await orderBook.getAddress(), await vault.getAddress());
  await settlement.waitForDeployment();

  await (await orderBook.setVault(await vault.getAddress())).wait();
  await (await orderBook.setSettlement(await settlement.getAddress())).wait();
  await (await vault.setOrderBook(await orderBook.getAddress())).wait();
  await (await vault.setSettlement(await settlement.getAddress())).wait();

  if (process.env.KEEPER_ADDRESS) {
    await (await orderBook.setKeeper(process.env.KEEPER_ADDRESS)).wait();
    await (await settlement.setDecryptionOracle(process.env.KEEPER_ADDRESS)).wait();
  }

  const addresses = {
    network: network.chainId === 421614n ? 'arbitrumSepolia' : `chain-${network.chainId.toString()}`,
    chainId: Number(network.chainId),
    shadowOrderBook: await orderBook.getAddress(),
    shadowVault: await vault.getAddress(),
    shadowSettlement: await settlement.getAddress(),
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
  };

  const deploymentsDir = path.join(process.cwd(), 'deployments');
  fs.mkdirSync(deploymentsDir, { recursive: true });
  const outputPath = path.join(deploymentsDir, `${addresses.network}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(addresses, null, 2));

  console.log('\nDeployment complete:');
  console.log(addresses);
  console.log('Saved:', outputPath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
