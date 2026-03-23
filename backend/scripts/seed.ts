import { ethers } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const [buyer, seller] = await ethers.getSigners();

  const deploymentPath = path.join(process.cwd(), 'deployments', 'arbitrumSepolia.json');
  if (!fs.existsSync(deploymentPath)) {
    throw new Error('Missing deployments/arbitrumSepolia.json. Run deploy first.');
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf-8')) as {
    shadowOrderBook: string;
    shadowVault: string;
  };

  const orderBook: any = await ethers.getContractAt('ShadowOrderBook', deployment.shadowOrderBook);
  const vault: any = await ethers.getContractAt('ShadowVault', deployment.shadowVault);

  const MockERC20 = await ethers.getContractFactory('MockERC20');
  const weth: any = await MockERC20.deploy('Wrapped Ether', 'WETH', 18);
  await weth.waitForDeployment();
  const usdc: any = await MockERC20.deploy('USD Coin', 'USDC', 18);
  await usdc.waitForDeployment();

  await (await weth.mint(seller.address, ethers.parseEther('50'))).wait();
  await (await usdc.mint(buyer.address, ethers.parseEther('500000'))).wait();

  await (await weth.connect(seller).approve(await vault.getAddress(), ethers.MaxUint256)).wait();
  await (await usdc.connect(buyer).approve(await vault.getAddress(), ethers.MaxUint256)).wait();

  const expiry = Math.floor(Date.now() / 1000) + 3600;

  await (
    await orderBook.connect(buyer).submitOrder(
      2_850_00000000n,
      1_50000000n,
      1,
      await weth.getAddress(),
      await usdc.getAddress(),
      expiry
    )
  ).wait();

  await (
    await orderBook.connect(seller).submitOrder(
      2_840_00000000n,
      1_50000000n,
      0,
      await weth.getAddress(),
      await usdc.getAddress(),
      expiry
    )
  ).wait();

  console.log('Seed complete.');
  console.log('WETH:', await weth.getAddress());
  console.log('USDC:', await usdc.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
