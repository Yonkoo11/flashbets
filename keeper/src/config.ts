import { base, baseSepolia } from 'viem/chains'

const chainId = parseInt(process.env.CHAIN_ID ?? '84532')

export const CHAIN        = chainId === 8453 ? base : baseSepolia
export const RPC_URL      = process.env.RPC_URL ?? (chainId === 8453
  ? 'https://mainnet.base.org'
  : 'https://sepolia.base.org')

export const KEEPER_PK    = process.env.KEEPER_PRIVATE_KEY as `0x${string}`
export const TELEGRAM_BOT = process.env.TELEGRAM_BOT_TOKEN ?? ''
export const TELEGRAM_CHAT= process.env.TELEGRAM_CHAT_ID   ?? ''

export const CONTRACT_ADDRESS: Record<number, `0x${string}`> = {
  8453:  '0x8e39631FBfAB68Ff5739F576847Ba7795f5b3AcE',
  84532: '0xcA374e8bba8bd2BA0Aed26c4d425aA9aa7E058D0',
}

export const ADDRESS = CONTRACT_ADDRESS[chainId]

export const POLL_INTERVAL_MS   = 5_000   // 5s poll
export const LOCK_THRESHOLD_S   = 50      // must match contract
export const ROUND_DURATION_S   = 60      // must match contract
export const BUFFER_S           = 2       // extra wait after threshold before tx
