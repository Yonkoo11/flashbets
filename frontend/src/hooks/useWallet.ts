'use client'

import { useAccount, useBalance, useChainId } from 'wagmi'
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { baseSepolia } from 'viem/chains'
import { formatEther, parseEther } from 'viem'
import { FLASHBETS_ABI, FLASHBETS_ADDRESS } from '@/lib/contract'

export function useWallet() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()

  // Native ETH balance
  const { data: ethBalance } = useBalance({ address })

  // In-contract ETH balance
  const { data: contractBalance, refetch: refetchBalance } = useReadContract({
    address: FLASHBETS_ADDRESS[chainId as keyof typeof FLASHBETS_ADDRESS],
    abi: FLASHBETS_ABI,
    functionName: 'balances',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  const { writeContractAsync, data: txHash } = useWriteContract()
  const { isLoading: isTxPending } = useWaitForTransactionReceipt({ hash: txHash })

  const contractAddress = FLASHBETS_ADDRESS[chainId as keyof typeof FLASHBETS_ADDRESS]

  async function depositEth(amountEth: string) {
    return writeContractAsync({
      address: contractAddress,
      abi: FLASHBETS_ABI,
      functionName: 'deposit',
      value: parseEther(amountEth),
    })
  }

  async function withdrawEth(amountEth: string) {
    return writeContractAsync({
      address: contractAddress,
      abi: FLASHBETS_ABI,
      functionName: 'withdraw',
      args: [parseEther(amountEth)],
    })
  }

  return {
    address,
    isConnected,
    chainId,
    isOnBase: chainId === 8453 || chainId === baseSepolia.id,
    ethBalance: ethBalance ? parseFloat(formatEther(ethBalance.value)).toFixed(4) : '0',
    contractBalance: contractBalance ? parseFloat(formatEther(contractBalance)).toFixed(4) : '0',
    contractBalanceWei: contractBalance ?? 0n,
    isTxPending,
    depositEth,
    withdrawEth,
    refetchBalance,
  }
}
