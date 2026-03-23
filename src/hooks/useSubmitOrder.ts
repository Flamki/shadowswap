import { useCallback, useMemo, useState } from 'react';
import type { JsonRpcSigner } from 'ethers';
import {
  ORDER_BOOK_ADDRESS,
  USDC_ADDRESS,
  VAULT_ADDRESS,
  WETH_ADDRESS,
  getErc20Contract,
  getOrderBookContract,
  isContractsConfigured,
} from '../lib/contracts';
import { parseDecimalToE8, quoteNotionalToken18, toToken18FromE8 } from '../lib/precision';

type SubmitState = 'idle' | 'approving' | 'submitting' | 'success' | 'error';

interface SubmitParams {
  side: 'buy' | 'sell';
  amount: string;
  price: string;
  expiry?: number;
}

interface SubmitResult {
  orderId: string;
  txHash: string;
}

interface UseSubmitOrderArgs {
  signer: JsonRpcSigner | null;
  account: string | null;
}

interface SubmitOrderHook {
  submitState: SubmitState;
  submitError: string | null;
  txHash: string | null;
  lastOrderId: string | null;
  submitOrder: (params: SubmitParams) => Promise<SubmitResult | null>;
  reset: () => void;
}

export function useSubmitOrder({ signer, account }: UseSubmitOrderArgs): SubmitOrderHook {
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);

  const ready = useMemo(
    () => Boolean(signer && account && isContractsConfigured()),
    [signer, account],
  );

  const reset = useCallback(() => {
    setSubmitState('idle');
    setSubmitError(null);
    setTxHash(null);
    setLastOrderId(null);
  }, []);

  const submitOrder = useCallback(
    async (params: SubmitParams): Promise<SubmitResult | null> => {
      if (!ready || !signer || !account) {
        setSubmitState('error');
        setSubmitError('Connect wallet and configure contract addresses first.');
        return null;
      }

      try {
        setSubmitError(null);

        const orderBook = getOrderBookContract(signer);
        const weth = getErc20Contract(WETH_ADDRESS, signer);
        const usdc = getErc20Contract(USDC_ADDRESS, signer);

        const priceE8 = parseDecimalToE8(params.price);
        const amountE8 = parseDecimalToE8(params.amount);

        if (priceE8 <= 0n || amountE8 <= 0n) {
          throw new Error('Price and amount must be greater than zero.');
        }

        const isBuy = params.side === 'buy';
        const approveToken = isBuy ? usdc : weth;
        const requiredAmount = isBuy
          ? quoteNotionalToken18(priceE8, amountE8)
          : toToken18FromE8(amountE8);

        const allowance = (await approveToken.allowance(account, VAULT_ADDRESS)) as bigint;
        if (allowance < requiredAmount) {
          setSubmitState('approving');
          const approveTx = await approveToken.approve(VAULT_ADDRESS, requiredAmount);
          await approveTx.wait();
        }

        const expiry = params.expiry || Math.floor(Date.now() / 1000) + 24 * 60 * 60;

        setSubmitState('submitting');
        const submitTx = await orderBook.submitOrder(
          priceE8,
          amountE8,
          isBuy ? 1 : 0,
          WETH_ADDRESS,
          USDC_ADDRESS,
          expiry,
        );

        const receipt = await submitTx.wait();

        let submittedOrderId = '';
        for (const log of receipt.logs) {
          try {
            const parsed = orderBook.interface.parseLog(log);
            if (parsed?.name === 'OrderSubmitted') {
              submittedOrderId = String(parsed.args.orderId);
              break;
            }
          } catch {
            // Ignore non-orderbook logs.
          }
        }

        setSubmitState('success');
        setTxHash(submitTx.hash);
        setLastOrderId(submittedOrderId || null);

        return {
          orderId: submittedOrderId,
          txHash: submitTx.hash,
        };
      } catch (submitErr) {
        setSubmitState('error');
        setSubmitError(submitErr instanceof Error ? submitErr.message : 'Order submission failed.');
        return null;
      }
    },
    [account, ready, signer],
  );

  return {
    submitState,
    submitError,
    txHash,
    lastOrderId,
    submitOrder,
    reset,
  };
}
