'use client'

// Balance is now on-chain via useWallet().contractBalance
// This file re-exports from useWallet for backwards compatibility with
// any components that import useBalance directly.

export { useWallet as useBalance } from './useWallet'
