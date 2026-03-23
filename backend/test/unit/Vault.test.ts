import { expect } from 'chai';
import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { ethers } from 'hardhat';

import {
  deployShadowSwapFixture,
  getMatchIdFromReceipt,
  quoteTokenFromPriceAndAmount,
  submitPlainOrder,
  toE8,
  toToken18FromE8,
} from '../helpers/fixture';

describe('ShadowVault', function () {
  it('locks quote tokens for BUY orders', async function () {
    const { buyer, orderBook, vault, weth, usdc } = await loadFixture(deployShadowSwapFixture);
    const expiry = (await time.latest()) + 3600;

    const price = toE8('2850');
    const amount = toE8('1.5');

    await submitPlainOrder(orderBook, buyer, {
      priceE8: price,
      amountE8: amount,
      direction: 1,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    const expected = quoteTokenFromPriceAndAmount(price, amount);
    expect(await usdc.balanceOf(await vault.getAddress())).to.equal(expected);
  });

  it('locks base tokens for SELL orders', async function () {
    const { seller, orderBook, vault, weth, usdc } = await loadFixture(deployShadowSwapFixture);
    const expiry = (await time.latest()) + 3600;

    const amount = toE8('2.25');

    await submitPlainOrder(orderBook, seller, {
      priceE8: toE8('2840'),
      amountE8: amount,
      direction: 0,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    expect(await weth.balanceOf(await vault.getAddress())).to.equal(toToken18FromE8(amount));
  });

  it('updates traderBalances on lock', async function () {
    const { buyer, orderBook, vault, weth, usdc } = await loadFixture(deployShadowSwapFixture);
    const expiry = (await time.latest()) + 3600;

    const price = toE8('2800');
    const amount = toE8('1.0');

    await submitPlainOrder(orderBook, buyer, {
      priceE8: price,
      amountE8: amount,
      direction: 1,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    const expected = quoteTokenFromPriceAndAmount(price, amount);
    expect(await vault.traderBalances(buyer.address, await usdc.getAddress())).to.equal(expected);
  });

  it('reverts direct lockForOrder from non-orderbook caller', async function () {
    const { buyer, other, vault, weth, usdc } = await loadFixture(deployShadowSwapFixture);

    await expect(
      vault
        .connect(other)
        .lockForOrder(
          '0x1234000000000000000000000000000000000000000000000000000000000000',
          buyer.address,
          await weth.getAddress(),
          await usdc.getAddress(),
          toE8('2800'),
          toE8('1.0'),
          1
        )
    ).to.be.reverted;
  });

  it('releases funds on cancel path', async function () {
    const { buyer, orderBook, vault, weth, usdc } = await loadFixture(deployShadowSwapFixture);
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

    const lock = await vault.lockedFunds(orderId);
    expect(lock.active).to.equal(false);
    expect(lock.amount).to.equal(0);
  });

  it('reverts releaseOnFill from non-settlement caller', async function () {
    const { buyer, other, vault } = await loadFixture(deployShadowSwapFixture);

    await expect(
      vault
        .connect(other)
        .releaseOnFill(
          ethers.ZeroHash,
          ethers.ZeroHash,
          buyer.address,
          1n
        )
    ).to.be.reverted;
  });

  it('transfers locked funds on settlement and keeps BUY remainder locked', async function () {
    const { buyer, seller, keeper, orderBook, settlement, vault, weth, usdc } = await loadFixture(deployShadowSwapFixture);
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

    const tx = await orderBook.tryMatch(buyId, sellId);
    const receipt = await tx.wait();
    const matchId = await getMatchIdFromReceipt(orderBook, receipt);

    const matchData = await orderBook.connect(keeper).getMatchForSettlement(matchId);

    await expect(
      settlement
        .connect(keeper)
        .executeSettlement(
          matchId,
          matchData.settlementPrice,
          matchData.fillAmount,
          matchData.buyResidual,
          matchData.sellResidual
        )
    ).to.emit(vault, 'FundsTransferred');

    const buyLock = await vault.lockedFunds(buyId);
    const sellLock = await vault.lockedFunds(sellId);
    expect(buyLock.active).to.equal(true);
    expect(sellLock.active).to.equal(false);
  });

  it('keeps legacy wrapper methods access-controlled', async function () {
    const { owner, vault } = await loadFixture(deployShadowSwapFixture);

    await expect(vault.connect(owner).releaseRemaining(ethers.ZeroHash, owner.address)).to.be.reverted;
    await expect(vault.connect(owner).transferLocked(ethers.ZeroHash, ethers.ZeroHash, owner.address, 1n)).to.be.reverted;
  });
});
