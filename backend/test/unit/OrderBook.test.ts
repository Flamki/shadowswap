import { expect } from 'chai';
import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { ethers } from 'hardhat';
import { deployShadowSwapFixture, quoteTokenFromPriceAndAmount, submitOrder, toE8 } from '../helpers/fixture';

describe('ShadowOrderBook', function () {
  it('submits a valid BUY order and stores active id', async function () {
    const { buyer, orderBook, weth, usdc } = await loadFixture(deployShadowSwapFixture);
    const expiry = (await time.latest()) + 3600;

    const tx = orderBook
      .connect(buyer)
      .submitOrder(toE8('2850'), toE8('1.5'), 1, await weth.getAddress(), await usdc.getAddress(), expiry);

    await expect(tx).to.emit(orderBook, 'OrderSubmitted');

    const active = await orderBook.getActiveOrderIds();
    expect(active.length).to.equal(1);

    const meta = await orderBook.getOrderMeta(active[0]);
    expect(meta.trader).to.equal(buyer.address);
    expect(meta.active).to.equal(true);
  });

  it('reverts submit when expiry is too far', async function () {
    const { buyer, orderBook, weth, usdc } = await loadFixture(deployShadowSwapFixture);
    const expiry = (await time.latest()) + 8 * 24 * 3600;

    await expect(
      orderBook
        .connect(buyer)
        .submitOrder(toE8('2850'), toE8('1.5'), 1, await weth.getAddress(), await usdc.getAddress(), expiry)
    ).to.be.revertedWithCustomError(orderBook, 'InvalidInput');
  });

  it('cancels order by owner and refunds funds', async function () {
    const { buyer, orderBook, vault, weth, usdc } = await loadFixture(deployShadowSwapFixture);
    const expiry = (await time.latest()) + 3600;

    const price = toE8('2850');
    const amount = toE8('1.5');
    const orderId = await submitOrder(orderBook, buyer, {
      priceE8: price,
      amountE8: amount,
      direction: 1,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    const expectedLocked = quoteTokenFromPriceAndAmount(price, amount);
    expect(await usdc.balanceOf(await vault.getAddress())).to.equal(expectedLocked);

    const buyerBefore = await usdc.balanceOf(buyer.address);
    const cancelTx = orderBook.connect(buyer).cancelOrder(orderId);

    await expect(cancelTx).to.emit(orderBook, 'OrderCancelled');

    const buyerAfter = await usdc.balanceOf(buyer.address);
    expect(buyerAfter).to.be.greaterThan(buyerBefore);

    const meta = await orderBook.getOrderMeta(orderId);
    expect(meta.active).to.equal(false);
  });

  it('reverts cancel from non-owner', async function () {
    const { buyer, seller, orderBook, weth, usdc } = await loadFixture(deployShadowSwapFixture);
    const expiry = (await time.latest()) + 3600;

    const orderId = await submitOrder(orderBook, buyer, {
      priceE8: toE8('2850'),
      amountE8: toE8('1.5'),
      direction: 1,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    await expect(orderBook.connect(seller).cancelOrder(orderId)).to.be.revertedWithCustomError(orderBook, 'NotOrderOwner');
  });

  it('expires stale orders through batch call', async function () {
    const { buyer, orderBook, weth, usdc } = await loadFixture(deployShadowSwapFixture);
    const expiry = (await time.latest()) + 10;

    const orderId = await submitOrder(orderBook, buyer, {
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

  it('matches BUY and SELL when price crosses', async function () {
    const { buyer, seller, orderBook, weth, usdc } = await loadFixture(deployShadowSwapFixture);
    const expiry = (await time.latest()) + 3600;

    const buyId = await submitOrder(orderBook, buyer, {
      priceE8: toE8('2850'),
      amountE8: toE8('1.5'),
      direction: 1,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    const sellId = await submitOrder(orderBook, seller, {
      priceE8: toE8('2840'),
      amountE8: toE8('1.5'),
      direction: 0,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    const tx = orderBook.tryMatch(buyId, sellId);
    await expect(tx).to.emit(orderBook, 'MatchFound');

    const active = await orderBook.getActiveOrderIds();
    expect(active.length).to.equal(0);
  });

  it('does not match when buy price is below sell price', async function () {
    const { buyer, seller, orderBook, weth, usdc } = await loadFixture(deployShadowSwapFixture);
    const expiry = (await time.latest()) + 3600;

    const buyId = await submitOrder(orderBook, buyer, {
      priceE8: toE8('2800'),
      amountE8: toE8('1.0'),
      direction: 1,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    const sellId = await submitOrder(orderBook, seller, {
      priceE8: toE8('2850'),
      amountE8: toE8('1.0'),
      direction: 0,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    const matchId = await orderBook.tryMatch.staticCall(buyId, sellId);
    expect(matchId).to.equal('0x0000000000000000000000000000000000000000000000000000000000000000');

    const active = await orderBook.getActiveOrderIds();
    expect(active.length).to.equal(2);
  });

  it('reverts matching when pairs are mismatched', async function () {
    const { buyer, seller, orderBook, vault, weth, usdc } = await loadFixture(deployShadowSwapFixture);
    const MockERC20 = await ethers.getContractFactory('MockERC20');
    const otherQuote: any = await MockERC20.deploy('Other USDC', 'OUSDC', 18);
    await otherQuote.waitForDeployment();
    await (await otherQuote.mint(buyer.address, ethers.parseEther('1000000'))).wait();
    await (await otherQuote.connect(buyer).approve(await vault.getAddress(), ethers.MaxUint256)).wait();

    const expiry = (await time.latest()) + 3600;

    const buyId = await submitOrder(orderBook, buyer, {
      priceE8: toE8('2850'),
      amountE8: toE8('1.0'),
      direction: 1,
      tokenA: await weth.getAddress(),
      tokenB: await otherQuote.getAddress(),
      expiry,
    });

    const sellId = await submitOrder(orderBook, seller, {
      priceE8: toE8('2840'),
      amountE8: toE8('1.0'),
      direction: 0,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    await expect(orderBook.tryMatch(buyId, sellId)).to.be.revertedWithCustomError(orderBook, 'InvalidInput');
  });
});
