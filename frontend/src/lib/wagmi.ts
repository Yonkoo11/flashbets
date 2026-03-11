import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { base, baseSepolia } from 'viem/chains'
import { http } from 'wagmi'

export const wagmiConfig = getDefaultConfig({
  appName: 'FlashBets',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'flashbets-dev',
  chains: [baseSepolia, base],
  transports: {
    [base.id]:        http(),
    [baseSepolia.id]: http(),
  },
  ssr: true,
})

export { base, baseSepolia }
