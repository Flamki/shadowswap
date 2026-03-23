import { useCallback, useEffect, useState } from 'react';
import { type JsonRpcSigner } from 'ethers';
import { CHAIN_ID, createBrowserProvider } from '../lib/contracts';

interface WalletState {
  account: string | null;
  signer: JsonRpcSigner | null;
  chainId: number | null;
  connecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

export function useWallet(): WalletState {
  const [account, setAccount] = useState<string | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncWalletState = useCallback(async () => {
    if (!window.ethereum) {
      return;
    }

    const provider = createBrowserProvider();
    const accounts = (await window.ethereum.request({ method: 'eth_accounts' })) as string[];

    if (!accounts || accounts.length === 0) {
      setAccount(null);
      setSigner(null);
      setChainId(null);
      return;
    }

    const walletSigner = await provider.getSigner();
    const network = await provider.getNetwork();

    setSigner(walletSigner);
    setAccount(await walletSigner.getAddress());
    setChainId(Number(network.chainId));
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError('No EVM wallet found. Install MetaMask to continue.');
      return;
    }

    setConnecting(true);
    setError(null);

    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      const provider = createBrowserProvider();
      const network = await provider.getNetwork();
      const currentChainId = Number(network.chainId);

      if (currentChainId !== CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }],
          });
        } catch {
          // Continue even if user refuses switching.
        }
      }

      await syncWalletState();
    } catch (connectError) {
      setError(connectError instanceof Error ? connectError.message : 'Failed to connect wallet.');
    } finally {
      setConnecting(false);
    }
  }, [syncWalletState]);

  const disconnect = useCallback(() => {
    setAccount(null);
    setSigner(null);
    setChainId(null);
    setError(null);
  }, []);

  useEffect(() => {
    syncWalletState().catch(() => undefined);

    if (!window.ethereum?.on || !window.ethereum?.removeListener) {
      return;
    }

    const handleAccountsChanged = () => {
      syncWalletState().catch(() => undefined);
    };

    const handleChainChanged = () => {
      syncWalletState().catch(() => undefined);
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener?.('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener?.('chainChanged', handleChainChanged);
    };
  }, [syncWalletState]);

  return {
    account,
    signer,
    chainId,
    connecting,
    error,
    connect,
    disconnect,
  };
}
