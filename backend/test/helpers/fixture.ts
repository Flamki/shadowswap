import { ethers } from 'hardhat';

export const PRICE_DECIMALS = 10n ** 8n;

export async function deployShadowSwapFixture() {
  const [owner, buyer, seller, keeper, other] = await ethers.getSigners();

  const Vault = await ethers.getContractFactory('ShadowVault');
  const vault: any = await Vault.deploy();
  await vault.waitForDeployment();

  const OrderBook = await ethers.getContractFactory('ShadowOrderBook');
  const orderBook: any = await OrderBook.deploy(await vault.getAddress());
  await orderBook.waitForDeployment();

  const Settlement = await ethers.getContractFactory('ShadowSettlement');
  const settlement: any = await Settlement.deploy(await orderBook.getAddress(), await vault.getAddress());
  await settlement.waitForDeployment();

  await (await orderBook.setSettlement(await settlement.getAddress())).wait();
  await (await vault.setOrderBook(await orderBook.getAddress())).wait();
  await (await vault.setSettlement(await settlement.getAddress())).wait();
  await (await settlement.setDecryptionOracle(keeper.address)).wait();

  const MockERC20 = await ethers.getContractFactory('MockERC20');
  const weth: any = await MockERC20.deploy('Wrapped Ether', 'WETH', 18);
  await weth.waitForDeployment();
  const usdc: any = await MockERC20.deploy('USD Coin', 'USDC', 18);
  await usdc.waitForDeployment();

  await (await weth.mint(seller.address, ethers.parseEther('1000'))).wait();
  await (await usdc.mint(buyer.address, ethers.parseEther('10000000'))).wait();

  await (await weth.connect(seller).approve(await vault.getAddress(), ethers.MaxUint256)).wait();
  await (await usdc.connect(buyer).approve(await vault.getAddress(), ethers.MaxUint256)).wait();

  return {
    owner,
    buyer,
    seller,
    keeper,
    other,
    vault,
    orderBook,
    settlement,
    weth,
    usdc,
  };
}

export function toE8(value: string): bigint {
  // Supports up to 8 decimals.
  const [whole, frac = ''] = value.split('.');
  const padded = (frac + '00000000').slice(0, 8);
  return BigInt(whole) * PRICE_DECIMALS + BigInt(padded);
}

export function toToken18FromE8(amountE8: bigint): bigint {
  return amountE8 * 10n ** 10n;
}

export function quoteTokenFromPriceAndAmount(priceE8: bigint, amountE8: bigint): bigint {
  const quoteE8 = (priceE8 * amountE8) / PRICE_DECIMALS;
  return quoteE8 * 10n ** 10n;
}

export async function submitOrder(
  orderBook: any,
  signer: any,
  params: {
    priceE8: bigint;
    amountE8: bigint;
    direction: 0 | 1;
    tokenA: string;
    tokenB: string;
    expiry: number;
  }
): Promise<string> {
  const tx = await orderBook
    .connect(signer)
    .submitOrder(params.priceE8, params.amountE8, params.direction, params.tokenA, params.tokenB, params.expiry);
  const receipt = await tx.wait();

  const event = receipt?.logs
    .map((log: any) => {
      try {
        return orderBook.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((parsed: any) => parsed?.name === 'OrderSubmitted');

  if (!event) {
    throw new Error('OrderSubmitted event not found');
  }

  return event.args.orderId as string;
}
