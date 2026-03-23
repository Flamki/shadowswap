import { expect } from 'chai';
import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { deployShadowSwapFixture, quoteTokenFromPriceAndAmount, submitOrder, toE8, toToken18FromE8 } from '../helpers/fixture';

describe('ShadowVault', function () {
  it('locks quote tokens for BUY orders', async function () {
    const { buyer, orderBook, vault, weth, usdc } = await loadFixture(deployShadowSwapFixture);
    const expiry = (await time.latest()) + 3600;

    const price = toE8('2850');
    const amount = toE8('1.5');

    await submitOrder(orderBook, buyer, {
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

    await submitOrder(orderBook, seller, {
      priceE8: toE8('2840'),
      amountE8: amount,
      direction: 0,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    expect(await weth.balanceOf(await vault.getAddress())).to.equal(toToken18FromE8(amount));
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
    ).to.be.revertedWithCustomError(vault, 'NotOrderBook');
  });

  it('transfers locked funds on settlement and keeps remainder locked', async function () {
    const { buyer, seller, keeper, orderBook, settlement, vault, weth, usdc } = await loadFixture(deployShadowSwapFixture);
    const expiry = (await time.latest()) + 3600;

    const buyId = await submitOrder(orderBook, buyer, {
      priceE8: toE8('2850'),
      amountE8: toE8('2.0'),
      direction: 1,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
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

    const tx = await orderBook.tryMatch(buyId, sellId);
    const receipt = await tx.wait();
    const parsed = receipt?.logs
      .map((log: any) => {
        try {
          return orderBook.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((log: any) => log?.name === 'MatchFound');

    const matchId = parsed.args.matchId;
    const matchResult = await orderBook.getMatch(matchId);

    await expect(
      settlement
        .connect(keeper)
        .executeSettlement(
          matchId,
          matchResult.encSettlementPrice,
          matchResult.encFillAmount,
          matchResult.encBuyResidual,
          matchResult.encSellResidual
        )
    ).to.emit(vault, 'FundsTransferred');

    const lockInfo = await vault.lockedFunds(buyId);
    expect(lockInfo.active).to.equal(true);
    expect(lockInfo.amount).to.be.greaterThan(0);
  });
});
