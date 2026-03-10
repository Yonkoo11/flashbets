'use client'

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi'
import { useAccount } from 'wagmi'
import { formatEther, parseEther } from 'viem'
import { FLASHBETS_ABI, FLASHBETS_ADDRESS } from '@/lib/contract'

// Market status enum mirrors contract
export type MarketStatus = 'INACTIVE' | 'ACTIVE' | 'LOCKED' | 'RESOLVED'
// Maps uint8 from contract to the string enum used throughout the UI
const STATUS_MAP = ['INACTIVE', 'ACTIVE', 'LOCKED', 'RESOLVED'] as const

export function useMarket() {
  const { address } = useAccount()
  const chainId = useChainId()
  const contractAddress = FLASHBETS_ADDRESS[chainId as keyof typeof FLASHBETS_ADDRESS]

  // ---- Reads ----

  const { data: marketInfo, refetch: refetchMarket } = useReadContract({
    address: contractAddress,
    abi: FLASHBETS_ABI,
    functionName: 'getMarketInfo',
    query: { refetchInterval: 3_000 },
  })

  const { data: roundId } = useReadContract({
    address: contractAddress,
    abi: FLASHBETS_ABI,
    functionName: 'currentRoundId',
    query: { refetchInterval: 5_000 },
  })

  const { data: userBet, refetch: refetchUserBet } = useReadContract({
    address: contractAddress,
    abi: FLASHBETS_ABI,
    functionName: 'getUserBet',
    args: roundId !== undefined && address ? [roundId, address] : undefined,
    query: { enabled: !!address && roundId !== undefined, refetchInterval: 5_000 },
  })

  const { data: upOddsRaw } = useReadContract({
    address: contractAddress,
    abi: FLASHBETS_ABI,
    functionName: 'getOdds',
    args: [true, 0n],
    query: { refetchInterval: 3_000 },
  })

  const { data: downOddsRaw } = useReadContract({
    address: contractAddress,
    abi: FLASHBETS_ABI,
    functionName: 'getOdds',
    args: [false, 0n],
    query: { refetchInterval: 3_000 },
  })

  // ---- Writes ----

  const { writeContractAsync, data: txHash } = useWriteContract()
  const { isLoading: isTxPending } = useWaitForTransactionReceipt({ hash: txHash })

  async function startNewMarket() {
    return writeContractAsync({
      address: contractAddress,
      abi: FLASHBETS_ABI,
      functionName: 'startNewMarket',
    })
  }

  async function lockMarket() {
    return writeContractAsync({
      address: contractAddress,
      abi: FLASHBETS_ABI,
      functionName: 'lockMarket',
    })
  }

  async function resolveMarket() {
    return writeContractAsync({
      address: contractAddress,
      abi: FLASHBETS_ABI,
      functionName: 'resolveMarket',
    })
  }

  async function placeBet(direction: boolean, amountEth: string) {
    return writeContractAsync({
      address: contractAddress,
      abi: FLASHBETS_ABI,
      functionName: 'placeBetAmount',
      args: [direction, parseEther(amountEth)],
    })
  }

  async function claimWinnings(roundIdToClaim: bigint) {
    return writeContractAsync({
      address: contractAddress,
      abi: FLASHBETS_ABI,
      functionName: 'claimWinnings',
      args: [roundIdToClaim],
    })
  }

  // ---- Parsed values ----

  const status: MarketStatus = marketInfo ? STATUS_MAP[marketInfo[3]] : 'INACTIVE'
  const secondsRemaining = marketInfo ? Number(marketInfo[6]) : 0
  const upPool   = marketInfo ? parseFloat(formatEther(marketInfo[4])) : 0
  const downPool = marketInfo ? parseFloat(formatEther(marketInfo[5])) : 0

  // Fixed-point odds: 195 = 1.95x
  const upOdds   = upOddsRaw   ? Number(upOddsRaw)   / 100 : 2.00
  const downOdds = downOddsRaw ? Number(downOddsRaw) / 100 : 2.00

  const hasActiveBet = userBet ? userBet[2] : false
  const userBetDirection: 'UP' | 'DOWN' | null = userBet ? (userBet[0] ? 'UP' : 'DOWN') : null
  const userBetAmount = userBet ? parseFloat(formatEther(userBet[1])) : 0

  return {
    status,
    secondsRemaining,
    upPool,
    downPool,
    totalPool: upPool + downPool,
    upOdds,
    downOdds,
    currentRoundId: roundId ?? 0n,
    hasActiveBet,
    userBetDirection,
    userBetAmount,
    isTxPending,
    // lifecycle
    startNewMarket,
    lockMarket,
    resolveMarket,
    // betting
    placeBet,
    claimWinnings,
    // refresh
    refetchMarket,
    refetchUserBet,
  }
}
