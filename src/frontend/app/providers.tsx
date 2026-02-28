'use client';

import * as React from 'react';
import {
  RainbowKitProvider,
  getDefaultConfig,
  darkTheme,
} from '@rainbow-me/rainbowkit';
import { bscTestnet } from 'wagmi/chains';
import { WagmiProvider } from 'wagmi';
import {
  QueryClientProvider,
  QueryClient,
} from '@tanstack/react-query';
import '@rainbow-me/rainbowkit/styles.css';

import { metaMaskWallet } from '@rainbow-me/rainbowkit/wallets';

// The "Ultimate Demo Wallet Hack"
// We use the real MetaMask logic but disguise it as other enterprise wallets.
// This makes the UI look massive, and clicking any of them successfully connects using MetaMask!
const createMockWallet = (id: string, name: string, iconUrl: string) => {
  return () => {
    const mm = metaMaskWallet({ projectId: 'dummy_project_id' });
    return {
      ...mm,
      id,
      name,
      iconUrl,
      iconBackground: '#000000',
    };
  };
};

const mockPhantom = createMockWallet(
  'mock-phantom',
  'Phantom',
  'https://res.cloudinary.com/dtfvndznx/image/upload/v1716912389/phantom-icon_x2nbyk.png'
);

const mockTrust = createMockWallet(
  'mock-trust',
  'Trust Wallet',
  'https://res.cloudinary.com/dtfvndznx/image/upload/v1716912389/trust-wallet-icon_n3yuxa.png'
);

const mockCoinbase = createMockWallet(
  'mock-coinbase',
  'Coinbase Wallet',
  'https://res.cloudinary.com/dtfvndznx/image/upload/v1716912389/coinbase-icon_f7z29v.png'
);

const config = getDefaultConfig({
  appName: 'Frontend UI',
  projectId: 'dummy_project_id',
  chains: [bscTestnet],
  ssr: true,
  wallets: [
    {
      groupName: 'Popular',
      wallets: [
        metaMaskWallet
      ],
    },
  ],
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
