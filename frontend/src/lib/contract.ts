export const FLASHBETS_ADDRESS = {
  // Fill after deploying
  8453:  '0x0000000000000000000000000000000000000000' as `0x${string}`, // Base mainnet
  84532: '0x0000000000000000000000000000000000000000' as `0x${string}`, // Base Sepolia
} as const

export const FLASHBETS_ABI = [
  // ---- Write ----
  {
    name: 'deposit',
    type: 'function',
    stateMutability: 'payable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'withdraw',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'startNewMarket',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'lockMarket',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'resolveMarket',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'placeBetAmount',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'direction', type: 'bool' },
      { name: 'amount',    type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'claimWinnings',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'roundId', type: 'uint256' }],
    outputs: [],
  },
  // ---- Read ----
  {
    name: 'balances',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'player', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'getMarketInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'roundId',          type: 'uint256' },
      { name: 'startPrice',       type: 'int256'  },
      { name: 'startTime',        type: 'uint256' },
      { name: 'status',           type: 'uint8'   },
      { name: 'upPool',           type: 'uint256' },
      { name: 'downPool',         type: 'uint256' },
      { name: 'secondsRemaining', type: 'uint256' },
    ],
  },
  {
    name: 'getOdds',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'direction',    type: 'bool'    },
      { name: 'extraAmount',  type: 'uint256' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'getBtcPrice',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'price',     type: 'int256'  },
      { name: 'updatedAt', type: 'uint256' },
    ],
  },
  {
    name: 'getUserBet',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'roundId', type: 'uint256' },
      { name: 'player',  type: 'address' },
    ],
    outputs: [
      { name: 'direction', type: 'bool'    },
      { name: 'amount',    type: 'uint256' },
      { name: 'exists',    type: 'bool'    },
    ],
  },
  {
    name: 'currentRoundId',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  // ---- Events ----
  {
    name: 'MarketStarted',
    type: 'event',
    inputs: [
      { name: 'roundId',    type: 'uint256', indexed: true  },
      { name: 'startPrice', type: 'int256',  indexed: false },
      { name: 'startTime',  type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'BetPlaced',
    type: 'event',
    inputs: [
      { name: 'roundId',   type: 'uint256', indexed: true  },
      { name: 'player',    type: 'address', indexed: true  },
      { name: 'direction', type: 'bool',    indexed: false },
      { name: 'amount',    type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'MarketResolved',
    type: 'event',
    inputs: [
      { name: 'roundId',  type: 'uint256', indexed: true  },
      { name: 'endPrice', type: 'int256',  indexed: false },
      { name: 'outcome',  type: 'bool',    indexed: false },
    ],
  },
  {
    name: 'WinningsClaimed',
    type: 'event',
    inputs: [
      { name: 'roundId', type: 'uint256', indexed: true  },
      { name: 'player',  type: 'address', indexed: true  },
      { name: 'payout',  type: 'uint256', indexed: false },
    ],
  },
] as const
