import { createPublicClient, createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import {
  CHAIN, RPC_URL, KEEPER_PK, ADDRESS,
  POLL_INTERVAL_MS, LOCK_THRESHOLD_S, ROUND_DURATION_S, BUFFER_S,
} from './config'
import { ABI } from './abi'
import { notify } from './telegram'

// Status enum mirrors the contract
const STATUS = { Inactive: 0, Active: 1, Locked: 2, Resolved: 3 } as const

if (!KEEPER_PK) {
  console.error('KEEPER_PRIVATE_KEY not set')
  process.exit(1)
}
if (!ADDRESS) {
  console.error('No contract address for this chain')
  process.exit(1)
}

const account    = privateKeyToAccount(KEEPER_PK)
const publicClient = createPublicClient({ chain: CHAIN, transport: http(RPC_URL) })
const walletClient = createWalletClient({ account, chain: CHAIN, transport: http(RPC_URL) })

let consecutiveErrors = 0

async function getMarketInfo() {
  const result = await publicClient.readContract({ address: ADDRESS, abi: ABI, functionName: 'getMarketInfo' })
  const [roundId, , startTime, status, upPool, downPool] = result
  return {
    roundId,
    startTime: Number(startTime),
    status:    Number(status),
    upPool,
    downPool,
  }
}

async function send(fn: 'startNewMarket' | 'lockMarket' | 'resolveMarket' | 'cancelStaleRound') {
  console.log(`[${new Date().toISOString()}] → ${fn}`)
  try {
    const hash = await walletClient.writeContract({ address: ADDRESS, abi: ABI, functionName: fn })
    console.log(`  ✓ ${fn} tx: ${hash}`)
    await notify(`✓ \`${fn}\` tx: \`${hash}\``)
    consecutiveErrors = 0
    return hash
  } catch (err: any) {
    const msg = err?.shortMessage ?? err?.message ?? String(err)
    console.error(`  ✗ ${fn} failed: ${msg}`)
    await notify(`✗ \`${fn}\` failed: ${msg}`)
    consecutiveErrors++
    if (consecutiveErrors >= 5) {
      await notify('🚨 5 consecutive errors — keeper may be stuck. Check immediately.')
    }
  }
}

async function tick() {
  const now = Math.floor(Date.now() / 1000)
  let info: Awaited<ReturnType<typeof getMarketInfo>>

  try {
    info = await getMarketInfo()
  } catch (err: any) {
    console.error(`[${new Date().toISOString()}] getMarketInfo failed:`, err?.shortMessage ?? err?.message)
    consecutiveErrors++
    return
  }

  const elapsed = now - info.startTime
  const { status, roundId } = info

  console.log(
    `[${new Date().toISOString()}] round=${roundId} status=${status} elapsed=${elapsed}s ` +
    `up=${info.upPool} down=${info.downPool}`
  )

  if (status === STATUS.Inactive || status === STATUS.Resolved) {
    await send('startNewMarket')
    return
  }

  if (status === STATUS.Active) {
    if (elapsed >= LOCK_THRESHOLD_S + BUFFER_S) {
      await send('lockMarket')
    }
    return
  }

  if (status === STATUS.Locked) {
    if (elapsed >= ROUND_DURATION_S + BUFFER_S) {
      await send('resolveMarket')
    }
    return
  }
}

async function main() {
  console.log(`FlashBets keeper starting`)
  console.log(`  Chain:    ${CHAIN.name} (${CHAIN.id})`)
  console.log(`  Contract: ${ADDRESS}`)
  console.log(`  Keeper:   ${account.address}`)
  console.log(`  Poll:     ${POLL_INTERVAL_MS}ms`)

  await notify(`🟢 Keeper started on ${CHAIN.name}. Address: \`${account.address}\``)

  // Run immediately, then on interval
  await tick()
  setInterval(tick, POLL_INTERVAL_MS)
}

main().catch(async (err) => {
  console.error('Fatal:', err)
  await notify(`💀 Keeper crashed: ${err?.message ?? err}`)
  process.exit(1)
})
