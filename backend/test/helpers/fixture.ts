import hre, { ethers } from 'hardhat';

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
  await (await orderBook.setKeeper(keeper.address)).wait();
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

export async function encryptOrderInput(priceE8: bigint, amountE8: bigint, direction: 0 | 1) {
  const fhenix = (hre as any).fhenixjs;
  const encPrice = await fhenix.encrypt_uint64(priceE8);
  const encAmount = await fhenix.encrypt_uint64(amountE8);
  const encDirection = await fhenix.encrypt_uint8(direction);

  return { encPrice, encAmount, encDirection };
}

export async function submitEncryptedOrder(
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
  const { encPrice, encAmount, encDirection } = await encryptOrderInput(
    params.priceE8,
    params.amountE8,
    params.direction
  );

  const submit = orderBook
    .connect(signer)['submitOrder((bytes,int32),(bytes,int32),(bytes,int32),address,address,uint256)'];

  const tx = await submit(encPrice, encAmount, encDirection, params.tokenA, params.tokenB, params.expiry);
  const receipt = await tx.wait();

  return extractOrderId(orderBook, receipt);
}

export async function submitPlainOrder(
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
  const submit = orderBook.connect(signer)['submitOrder(uint64,uint64,uint8,address,address,uint256)'];
  const tx = await submit(
    params.priceE8,
    params.amountE8,
    params.direction,
    params.tokenA,
    params.tokenB,
    params.expiry
  );
  const receipt = await tx.wait();

  return extractOrderId(orderBook, receipt);
}

function extractOrderId(orderBook: any, receipt: any): string {
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

export async function getMatchIdFromReceipt(orderBook: any, receipt: any): Promise<string> {
  const event = receipt?.logs
    .map((log: any) => {
      try {
        return orderBook.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((parsed: any) => parsed?.name === 'MatchFound');

  if (!event) {
    throw new Error('MatchFound event not found');
  }

  return event.args.matchId as string;
}
