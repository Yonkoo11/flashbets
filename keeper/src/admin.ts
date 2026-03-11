/**
 * Admin CLI — run one-off contract operations without the keeper loop.
 * Usage: bun run admin <command>
 * Commands: start | lock | resolve | cancel | pause | unpause | info
 */
import { createPublicClient, createWalletClient, http, formatEther } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { CHAIN, RPC_URL, KEEPER_PK, ADDRESS } from './config'
import { ABI } from './abi'

const ADMIN_ABI = [
  ...ABI,
  {
    name: 'pause',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'unpause',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'withdrawFees',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'accruedFees',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
] as const

const STATUS_LABEL = ['Inactive', 'Active', 'Locked', 'Resolved']

async function main() {
  const cmd = process.argv[2]
  if (!cmd) {
    console.log('Usage: bun run admin <info|start|lock|resolve|cancel|pause|unpause|fees>')
    process.exit(1)
  }

  const account      = privateKeyToAccount(KEEPER_PK)
  const publicClient = createPublicClient({ chain: CHAIN, transport: http(RPC_URL) })
  const walletClient = createWalletClient({ account, chain: CHAIN, transport: http(RPC_URL) })

  if (cmd === 'info') {
    const [info, paused, fees] = await Promise.all([
      publicClient.readContract({ address: ADDRESS, abi: ADMIN_ABI, functionName: 'getMarketInfo' }),
      publicClient.readContract({ address: ADDRESS, abi: ADMIN_ABI, functionName: 'paused' }),
      publicClient.readContract({ address: ADDRESS, abi: ADMIN_ABI, functionName: 'accruedFees' }),
    ])
    const [roundId, startPrice, startTime, status, upPool, downPool, remaining] = info
    console.log(`Chain:     ${CHAIN.name} (${CHAIN.id})`)
    console.log(`Contract:  ${ADDRESS}`)
    console.log(`Round:     #${roundId}`)
    console.log(`Status:    ${STATUS_LABEL[Number(status)]} ${paused ? '(PAUSED)' : ''}`)
    console.log(`StartTime: ${startTime > 0n ? new Date(Number(startTime) * 1000).toISOString() : 'n/a'}`)
    console.log(`StartPx:   ${startPrice > 0n ? (Number(startPrice) / 1e8).toFixed(2) : 'n/a'}`)
    console.log(`Remaining: ${remaining}s`)
    console.log(`Up pool:   ${formatEther(upPool)} ETH`)
    console.log(`Down pool: ${formatEther(downPool)} ETH`)
    console.log(`Fees:      ${formatEther(fees)} ETH`)
    return
  }

  const writeFns: Record<string, string> = {
    start:   'startNewMarket',
    lock:    'lockMarket',
    resolve: 'resolveMarket',
    cancel:  'cancelStaleRound',
    pause:   'pause',
    unpause: 'unpause',
    fees:    'withdrawFees',
  }

  const fn = writeFns[cmd]
  if (!fn) {
    console.error(`Unknown command: ${cmd}`)
    process.exit(1)
  }

  console.log(`Sending ${fn}...`)
  const hash = await walletClient.writeContract({
    address: ADDRESS,
    abi: ADMIN_ABI,
    functionName: fn as any,
  })
  console.log(`tx: ${hash}`)
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  console.log(`status: ${receipt.status}  block: ${receipt.blockNumber}`)
}

main().catch((err) => {
  console.error(err?.shortMessage ?? err?.message ?? err)
  process.exit(1)
})
