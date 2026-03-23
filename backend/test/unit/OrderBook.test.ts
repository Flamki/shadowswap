import { expect } from 'chai';
import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { ethers } from 'hardhat';
import {
  deployShadowSwapFixture,
  getMatchIdFromReceipt,
  quoteTokenFromPriceAndAmount,
  submitEncryptedOrder,
  submitPlainOrder,
  toE8,
  toToken18FromE8,
} from '../helpers/fixture';

describe('ShadowOrderBook', function () {
  it('submits a valid encrypted BUY order and stores active id', async function () {
    const { buyer, orderBook, weth, usdc } = await loadFixture(deployShadowSwapFixture);
    const expiry = (await time.latest()) + 3600;

    const orderId = await submitEncryptedOrder(orderBook, buyer, {
      priceE8: toE8('2850'),
      amountE8: toE8('1.5'),
      direction: 1,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    const active = await orderBook.getActiveOrderIds();
    expect(active.length).to.equal(1);
    expect(active[0]).to.equal(orderId);

    const meta = await orderBook.getOrderMeta(active[0]);
    expect(meta.trader).to.equal(buyer.address);
    expect(meta.active).to.equal(true);
  });

  it('submits a valid encrypted SELL order', async function () {
    const { seller, orderBook, weth, usdc } = await loadFixture(deployShadowSwapFixture);
    const expiry = (await time.latest()) + 3600;

    const orderId = await submitEncryptedOrder(orderBook, seller, {
      priceE8: toE8('2840'),
      amountE8: toE8('1.2'),
      direction: 0,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    const meta = await orderBook.getOrderMeta(orderId);
    expect(meta.trader).to.equal(seller.address);
    expect(meta.active).to.equal(true);
  });

  it('supports plaintext submitOrder compatibility path', async function () {
    const { buyer, orderBook, weth, usdc } = await loadFixture(deployShadowSwapFixture);
    const expiry = (await time.latest()) + 3600;

    const orderId = await submitPlainOrder(orderBook, buyer, {
      priceE8: toE8('2850'),
      amountE8: toE8('1.0'),
      direction: 1,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    const meta = await orderBook.getOrderMeta(orderId);
    expect(meta.active).to.equal(true);
  });

  it('reverts submit when tokenA is zero address', async function () {
    const { buyer, orderBook, usdc } = await loadFixture(deployShadowSwapFixture);
    const expiry = (await time.latest()) + 3600;

    const submit = orderBook.connect(buyer)['submitOrder(uint64,uint64,uint8,address,address,uint256)'];
    await expect(
      submit(toE8('2850'), toE8('1.0'), 1, ethers.ZeroAddress, await usdc.getAddress(), expiry)
    ).to.be.reverted;
  });

  it('reverts submit when token pair is same', async function () {
    const { buyer, orderBook, weth } = await loadFixture(deployShadowSwapFixture);
    const expiry = (await time.latest()) + 3600;

    const submit = orderBook.connect(buyer)['submitOrder(uint64,uint64,uint8,address,address,uint256)'];
    await expect(
      submit(toE8('2850'), toE8('1.0'), 1, await weth.getAddress(), await weth.getAddress(), expiry)
    ).to.be.reverted;
  });

  it('reverts submit when expiry is in the past', async function () {
    const { buyer, orderBook, weth, usdc } = await loadFixture(deployShadowSwapFixture);
    const expiry = (await time.latest()) - 1;

    const submit = orderBook.connect(buyer)['submitOrder(uint64,uint64,uint8,address,address,uint256)'];
    await expect(
      submit(toE8('2850'), toE8('1.0'), 1, await weth.getAddress(), await usdc.getAddress(), expiry)
    ).to.be.reverted;
  });

  it('reverts submit when expiry is too far', async function () {
    const { buyer, orderBook, weth, usdc } = await loadFixture(deployShadowSwapFixture);
    const expiry = (await time.latest()) + 8 * 24 * 3600;

    const submit = orderBook.connect(buyer)['submitOrder(uint64,uint64,uint8,address,address,uint256)'];
    await expect(
      submit(toE8('2850'), toE8('1.0'), 1, await weth.getAddress(), await usdc.getAddress(), expiry)
    ).to.be.reverted;
  });

  it('reverts submit when price is zero', async function () {
    const { buyer, orderBook, weth, usdc } = await loadFixture(deployShadowSwapFixture);
    const expiry = (await time.latest()) + 3600;

    const submit = orderBook.connect(buyer)['submitOrder(uint64,uint64,uint8,address,address,uint256)'];
    await expect(
      submit(0n, toE8('1.0'), 1, await weth.getAddress(), await usdc.getAddress(), expiry)
    ).to.be.reverted;
  });

  it('reverts submit when amount is zero', async function () {
    const { buyer, orderBook, weth, usdc } = await loadFixture(deployShadowSwapFixture);
    const expiry = (await time.latest()) + 3600;

    const submit = orderBook.connect(buyer)['submitOrder(uint64,uint64,uint8,address,address,uint256)'];
    await expect(
      submit(toE8('2850'), 0n, 1, await weth.getAddress(), await usdc.getAddress(), expiry)
    ).to.be.reverted;
  });

  it('reverts submit when direction is invalid', async function () {
    const { buyer, orderBook, weth, usdc } = await loadFixture(deployShadowSwapFixture);
    const expiry = (await time.latest()) + 3600;

    const submit = orderBook.connect(buyer)['submitOrder(uint64,uint64,uint8,address,address,uint256)'];
    await expect(
      submit(toE8('2850'), toE8('1.0'), 2, await weth.getAddress(), await usdc.getAddress(), expiry)
    ).to.be.reverted;
  });

  it('cancels order by owner and refunds funds', async function () {
    const { buyer, orderBook, vault, weth, usdc } = await loadFixture(deployShadowSwapFixture);
    const expiry = (await time.latest()) + 3600;
    const price = toE8('2850');
    const amount = toE8('1.5');

    const orderId = await submitPlainOrder(orderBook, buyer, {
      priceE8: price,
      amountE8: amount,
      direction: 1,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    const expectedLocked = quoteTokenFromPriceAndAmount(price, amount);
    expect(await usdc.balanceOf(await vault.getAddress())).to.equal(expectedLocked);

    await expect(orderBook.connect(buyer).cancelOrder(orderId)).to.emit(orderBook, 'OrderCancelled');

    const meta = await orderBook.getOrderMeta(orderId);
    expect(meta.active).to.equal(false);
  });

  it('reverts cancel from non-owner', async function () {
    const { buyer, seller, orderBook, weth, usdc } = await loadFixture(deployShadowSwapFixture);
    const expiry = (await time.latest()) + 3600;

    const orderId = await submitPlainOrder(orderBook, buyer, {
      priceE8: toE8('2850'),
      amountE8: toE8('1.0'),
      direction: 1,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    await expect(orderBook.connect(seller).cancelOrder(orderId)).to.be.reverted;
  });

  it('reverts cancel for already cancelled order', async function () {
    const { buyer, orderBook, weth, usdc } = await loadFixture(deployShadowSwapFixture);
    const expiry = (await time.latest()) + 3600;

    const orderId = await submitPlainOrder(orderBook, buyer, {
      priceE8: toE8('2850'),
      amountE8: toE8('1.0'),
      direction: 1,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    await orderBook.connect(buyer).cancelOrder(orderId);
    await expect(orderBook.connect(buyer).cancelOrder(orderId)).to.be.reverted;
  });

  it('expires stale orders through batch call', async function () {
    const { buyer, orderBook, weth, usdc } = await loadFixture(deployShadowSwapFixture);
    const expiry = (await time.latest()) + 10;

    const orderId = await submitPlainOrder(orderBook, buyer, {
      priceE8: toE8('2800'),
      amountE8: toE8('2.0'),
      direction: 1,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    await time.increaseTo(expiry + 1);

    await expect(orderBook.expireBatch([orderId])).to.emit(orderBook, 'OrderExpired');

    const meta = await orderBook.getOrderMeta(orderId);
    expect(meta.active).to.equal(false);
  });

  it('does not expire non-expired orders', async function () {
    const { buyer, orderBook, weth, usdc } = await loadFixture(deployShadowSwapFixture);
    const expiry = (await time.latest()) + 3600;

    const orderId = await submitPlainOrder(orderBook, buyer, {
      priceE8: toE8('2800'),
      amountE8: toE8('2.0'),
      direction: 1,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    await orderBook.expireBatch([orderId]);
    const meta = await orderBook.getOrderMeta(orderId);
    expect(meta.active).to.equal(true);
  });

  it('matches BUY and SELL when price crosses', async function () {
    const { buyer, seller, orderBook, weth, usdc } = await loadFixture(deployShadowSwapFixture);
    const expiry = (await time.latest()) + 3600;

    const buyId = await submitPlainOrder(orderBook, buyer, {
      priceE8: toE8('2850'),
      amountE8: toE8('1.5'),
      direction: 1,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    const sellId = await submitPlainOrder(orderBook, seller, {
      priceE8: toE8('2840'),
      amountE8: toE8('1.5'),
      direction: 0,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    const tx = await orderBook.tryMatch(buyId, sellId);
    await expect(Promise.resolve(tx)).to.emit(orderBook, 'MatchFound');

    const receipt = await tx.wait();
    const matchId = await getMatchIdFromReceipt(orderBook, receipt);
    const match = await orderBook.getMatch(matchId);
    expect(match.exists).to.equal(true);
  });

  it('returns zero match id when buy price is below sell price', async function () {
    const { buyer, seller, orderBook, weth, usdc } = await loadFixture(deployShadowSwapFixture);
    const expiry = (await time.latest()) + 3600;

    const buyId = await submitPlainOrder(orderBook, buyer, {
      priceE8: toE8('2800'),
      amountE8: toE8('1.0'),
      direction: 1,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    const sellId = await submitPlainOrder(orderBook, seller, {
      priceE8: toE8('2850'),
      amountE8: toE8('1.0'),
      direction: 0,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    const matchId = await orderBook.tryMatch.staticCall(buyId, sellId);
    expect(matchId).to.equal(ethers.ZeroHash);
  });

  it('reverts matching when pairs are mismatched', async function () {
    const { buyer, seller, orderBook, vault, weth, usdc } = await loadFixture(deployShadowSwapFixture);
    const MockERC20 = await ethers.getContractFactory('MockERC20');
    const otherQuote: any = await MockERC20.deploy('Other USDC', 'OUSDC', 18);
    await otherQuote.waitForDeployment();
    await (await otherQuote.mint(buyer.address, ethers.parseEther('1000000'))).wait();
    await (await otherQuote.connect(buyer).approve(await vault.getAddress(), ethers.MaxUint256)).wait();

    const expiry = (await time.latest()) + 3600;

    const buyId = await submitPlainOrder(orderBook, buyer, {
      priceE8: toE8('2850'),
      amountE8: toE8('1.0'),
      direction: 1,
      tokenA: await weth.getAddress(),
      tokenB: await otherQuote.getAddress(),
      expiry,
    });

    const sellId = await submitPlainOrder(orderBook, seller, {
      priceE8: toE8('2840'),
      amountE8: toE8('1.0'),
      direction: 0,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    await expect(orderBook.tryMatch(buyId, sellId)).to.be.reverted;
  });

  it('reverts self-match attempts', async function () {
    const { buyer, orderBook, vault, weth, usdc } = await loadFixture(deployShadowSwapFixture);
    const expiry = (await time.latest()) + 3600;

    await (await weth.mint(buyer.address, ethers.parseEther('10'))).wait();
    await (await weth.connect(buyer).approve(await vault.getAddress(), ethers.MaxUint256)).wait();

    const buyId = await submitPlainOrder(orderBook, buyer, {
      priceE8: toE8('2850'),
      amountE8: toE8('1.0'),
      direction: 1,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    const sellId = await submitPlainOrder(orderBook, buyer, {
      priceE8: toE8('2840'),
      amountE8: toE8('1.0'),
      direction: 0,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    await expect(orderBook.tryMatch(buyId, sellId)).to.be.reverted;
  });

  it('reverts matching when one order is expired', async function () {
    const { buyer, seller, orderBook, weth, usdc } = await loadFixture(deployShadowSwapFixture);
    const expirySoon = (await time.latest()) + 5;

    const buyId = await submitPlainOrder(orderBook, buyer, {
      priceE8: toE8('2850'),
      amountE8: toE8('1.0'),
      direction: 1,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry: expirySoon,
    });

    const sellId = await submitPlainOrder(orderBook, seller, {
      priceE8: toE8('2840'),
      amountE8: toE8('1.0'),
      direction: 0,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry: expirySoon,
    });

    await time.increaseTo(expirySoon + 1);
    await expect(orderBook.tryMatch(buyId, sellId)).to.be.reverted;
  });

  it('keeps BUY order active with residual after partial match', async function () {
    const { buyer, seller, orderBook, vault, weth, usdc } = await loadFixture(deployShadowSwapFixture);
    const expiry = (await time.latest()) + 3600;

    const buyId = await submitPlainOrder(orderBook, buyer, {
      priceE8: toE8('2850'),
      amountE8: toE8('2.0'),
      direction: 1,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    const sellId = await submitPlainOrder(orderBook, seller, {
      priceE8: toE8('2840'),
      amountE8: toE8('1.0'),
      direction: 0,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    await orderBook.tryMatch(buyId, sellId);

    const [, , , , amountLeft, active, filled] = await orderBook.getOrderForSettlement(buyId);
    expect(amountLeft).to.equal(toE8('1.0'));
    expect(active).to.equal(true);
    expect(filled).to.equal(false);

    const lock = await vault.lockedFunds(buyId);
    expect(lock.active).to.equal(true);
    expect(lock.amount).to.be.greaterThan(toToken18FromE8(toE8('1.0')));
  });

  it('allows authorized settlement-preview reads and blocks others', async function () {
    const { buyer, seller, keeper, other, orderBook, weth, usdc } = await loadFixture(deployShadowSwapFixture);
    const expiry = (await time.latest()) + 3600;

    const buyId = await submitPlainOrder(orderBook, buyer, {
      priceE8: toE8('2850'),
      amountE8: toE8('1.0'),
      direction: 1,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    const sellId = await submitPlainOrder(orderBook, seller, {
      priceE8: toE8('2840'),
      amountE8: toE8('1.0'),
      direction: 0,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    const tx = await orderBook.tryMatch(buyId, sellId);
    const receipt = await tx.wait();
    const matchId = await getMatchIdFromReceipt(orderBook, receipt);

    const preview = await orderBook.connect(keeper).getMatchForSettlement(matchId);
    expect(preview.exists).to.equal(true);
    expect(preview.settlementPrice).to.be.greaterThan(0);

    await expect(orderBook.connect(other).getMatchForSettlement(matchId)).to.be.reverted;
  });
});
