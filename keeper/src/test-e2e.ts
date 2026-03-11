/**
 * End-to-end test: runs a full round lifecycle + bet + claim on Sepolia.
 *
 * Prerequisites:
 *   - KEEPER_PRIVATE_KEY set (needs ~0.005 ETH for gas)
 *   - TESTER_PRIVATE_KEY set (needs ~0.005 ETH for gas + bet amount)
 *   - CHAIN_ID=84532
 *
 * Usage:
 *   CHAIN_ID=84532 KEEPER_PRIVATE_KEY=0x... TESTER_PRIVATE_KEY=0x... bun src/test-e2e.ts
 */
import { createPublicClient, createWalletClient, http, formatEther, parseEther } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { CHAIN, RPC_URL, KEEPER_PK, ADDRESS } from './config'
import { ABI } from './abi'

const TESTER_PK = process.env.TESTER_PRIVATE_KEY as `0x${string}`
if (!KEEPER_PK) { console.error('Missing KEEPER_PRIVATE_KEY'); process.exit(1) }
if (!TESTER_PK) { console.error('Missing TESTER_PRIVATE_KEY'); process.exit(1) }

const keeperAccount = privateKeyToAccount(KEEPER_PK)
const testerAccount = privateKeyToAccount(TESTER_PK)

const pub = createPublicClient({ chain: CHAIN, transport: http(RPC_URL) })
const keeperWallet = createWalletClient({ account: keeperAccount, chain: CHAIN, transport: http(RPC_URL) })
const testerWallet = createWalletClient({ account: testerAccount, chain: CHAIN, transport: http(RPC_URL) })

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

async function getStatus() {
  const info = await pub.readContract({ address: ADDRESS, abi: ABI, functionName: 'getMarketInfo' })
  const [roundId, startPrice, startTime, status, upPool, downPool, secsLeft] = info
  return { roundId, startPrice, startTime: Number(startTime), status: Number(status), upPool, downPool, secsLeft: Number(secsLeft) }
}

async function waitForTx(hash: `0x${string}`, label: string) {
  console.log(`  tx: ${hash}`)
  const receipt = await pub.waitForTransactionReceipt({ hash })
  if (receipt.status === 'reverted') throw new Error(`${label} reverted`)
  console.log(`  confirmed in block ${receipt.blockNumber} (${receipt.gasUsed} gas)`)
}

async function main() {
  console.log('=== FlashBets E2E Test ===')
  console.log(`Chain:    ${CHAIN.name} (${CHAIN.id})`)
  console.log(`Contract: ${ADDRESS}`)
  console.log(`Keeper:   ${keeperAccount.address}`)
  console.log(`Tester:   ${testerAccount.address}`)

  // Check balances
  const keeperBal = await pub.getBalance({ address: keeperAccount.address })
  const testerBal = await pub.getBalance({ address: testerAccount.address })
  console.log(`\nKeeper balance: ${formatEther(keeperBal)} ETH`)
  console.log(`Tester balance: ${formatEther(testerBal)} ETH`)

  if (keeperBal < parseEther('0.001')) { console.error('Keeper needs more ETH'); process.exit(1) }
  if (testerBal < parseEther('0.002')) { console.error('Tester needs more ETH'); process.exit(1) }

  // Step 1: Check current state
  let state = await getStatus()
  console.log(`\n[1] Current state: round=${state.roundId} status=${state.status}`)

  // Step 2: Start round (if not active)
  if (state.status === 0 || state.status === 3) {
    console.log('\n[2] Starting new round...')
    const hash = await keeperWallet.writeContract({ address: ADDRESS, abi: ABI, functionName: 'startNewMarket' })
    await waitForTx(hash, 'startNewMarket')
    await sleep(2000)
    state = await getStatus()
    console.log(`  Round ${state.roundId} now ACTIVE, ${state.secsLeft}s remaining`)
  } else {
    console.log(`\n[2] Round already active (status=${state.status}), skipping start`)
  }

  // Step 3: Tester deposits ETH
  console.log('\n[3] Tester depositing 0.001 ETH...')
  const depositHash = await testerWallet.writeContract({
    address: ADDRESS, abi: ABI, functionName: 'deposit', value: parseEther('0.001'),
  })
  await waitForTx(depositHash, 'deposit')

  // Check contract balance
  const contractBal = await pub.readContract({ address: ADDRESS, abi: ABI, functionName: 'balances', args: [testerAccount.address] })
  console.log(`  Contract balance: ${formatEther(contractBal as bigint)} ETH`)

  // Step 4: Place bet (UP = true)
  console.log('\n[4] Placing bet: 0.001 ETH on UP...')
  const betHash = await testerWallet.writeContract({
    address: ADDRESS, abi: ABI, functionName: 'placeBetAmount', args: [true, parseEther('0.001')],
  })
  await waitForTx(betHash, 'placeBetAmount')

  // Verify bet
  const bet = await pub.readContract({ address: ADDRESS, abi: ABI, functionName: 'getUserBet', args: [state.roundId, testerAccount.address] })
  console.log(`  Bet confirmed: direction=${(bet as any)[0] ? 'UP' : 'DOWN'} amount=${formatEther((bet as any)[1])} exists=${(bet as any)[2]}`)

  // Step 5: Wait for lock threshold
  state = await getStatus()
  const waitForLock = Math.max(0, state.secsLeft - 10)
  if (waitForLock > 0 && state.status === 1) {
    console.log(`\n[5] Waiting ${waitForLock}s for lock threshold...`)
    await sleep(waitForLock * 1000 + 3000)
  }

  // Step 6: Lock market
  console.log('\n[6] Locking market...')
  try {
    const lockHash = await keeperWallet.writeContract({ address: ADDRESS, abi: ABI, functionName: 'lockMarket' })
    await waitForTx(lockHash, 'lockMarket')
  } catch (e: any) {
    console.log(`  Lock attempt: ${e?.shortMessage ?? e?.message} (may already be locked)`)
  }

  // Step 7: Wait for round end
  state = await getStatus()
  if (state.secsLeft > 0) {
    console.log(`\n[7] Waiting ${state.secsLeft}s for round to end...`)
    await sleep(state.secsLeft * 1000 + 3000)
  }

  // Step 8: Resolve market
  console.log('\n[8] Resolving market...')
  const resolveHash = await keeperWallet.writeContract({ address: ADDRESS, abi: ABI, functionName: 'resolveMarket' })
  await waitForTx(resolveHash, 'resolveMarket')

  state = await getStatus()
  console.log(`  Market resolved. Status=${state.status}`)

  // Step 9: Try to claim winnings
  console.log('\n[9] Attempting to claim winnings...')
  try {
    const claimHash = await testerWallet.writeContract({
      address: ADDRESS, abi: ABI, functionName: 'claimWinnings', args: [state.roundId - 1n > 0n ? state.roundId - 1n : state.roundId],
    })
    await waitForTx(claimHash, 'claimWinnings')
    console.log('  Winnings claimed!')
  } catch (e: any) {
    console.log(`  Claim result: ${e?.shortMessage ?? e?.message} (lost the bet or already claimed)`)
  }

  // Step 10: Withdraw remaining balance
  const finalBal = await pub.readContract({ address: ADDRESS, abi: ABI, functionName: 'balances', args: [testerAccount.address] })
  console.log(`\n[10] Final contract balance: ${formatEther(finalBal as bigint)} ETH`)

  if ((finalBal as bigint) > 0n) {
    console.log('  Withdrawing...')
    const withdrawHash = await testerWallet.writeContract({
      address: ADDRESS, abi: ABI, functionName: 'withdraw', args: [finalBal],
    })
    await waitForTx(withdrawHash, 'withdraw')
    console.log('  Withdrawn!')
  }

  const testerFinalBal = await pub.getBalance({ address: testerAccount.address })
  console.log(`\n=== TEST COMPLETE ===`)
  console.log(`Tester wallet balance: ${formatEther(testerFinalBal)} ETH`)
  console.log(`Gas spent: ~${formatEther(testerBal - testerFinalBal)} ETH`)
}

main().catch(err => { console.error('Test failed:', err); process.exit(1) })
