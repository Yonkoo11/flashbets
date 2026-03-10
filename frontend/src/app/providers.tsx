'use client'

import { ReactNode, useState, useEffect } from 'react'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { wagmiConfig } from '@/lib/wagmi'
import { ToastProvider } from '@/components/Toast'

import '@rainbow-me/rainbowkit/styles.css'

const queryClient = new QueryClient()

export function Providers({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#f59e0b',
            accentColorForeground: 'black',
            borderRadius: 'medium',
          })}
          locale="en-US"
        >
          <ToastProvider>{mounted ? children : null}</ToastProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
