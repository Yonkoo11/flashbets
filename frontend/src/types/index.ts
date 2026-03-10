// FlashBets Type Definitions

export type BetDirection = 'UP' | 'DOWN'

export type MarketStatus = 'INACTIVE' | 'ACTIVE' | 'LOCKED' | 'RESOLVED'

export interface Market {
  id: string
  roundNumber: number
  startPrice: number
  endPrice?: number
  startTime: number
  endTime: number
  status: MarketStatus
  totalPool: number
  upPool: number
  downPool: number
  outcome?: BetDirection
}

export interface Bet {
  id: string
  marketId: string
  userId: string
  direction: BetDirection
  amount: number
  odds: number
  potentialPayout: number
  timestamp: number
  outcome?: 'WIN' | 'LOSS'
  profit?: number
}

export interface UserPosition {
  direction: BetDirection
  amount: number
  potentialPayout: number
}

export interface HistoryEntry {
  id: string
  direction: BetDirection
  amount: number
  outcome: 'WIN' | 'LOSS'
  profit: number
  timestamp: number
}

export interface WalletState {
  isConnected: boolean
  address: string | null
  balance: number
  chainId: string | null
}

export interface PriceData {
  price: number
  change24h: number
  timestamp: number
}

// Contract function types
export interface PlaceBetParams {
  direction: BetDirection
  amount: number
}

export interface MarketState {
  currentRound: number
  startPrice: number
  upPool: number
  downPool: number
  status: MarketStatus
  userBet?: UserPosition
}
