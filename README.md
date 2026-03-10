# FlashBets

60-second BTC UP/DOWN prediction market on Base. Place a bet, watch the clock, collect winnings — all on-chain.

## How it works

1. Anyone calls `startNewMarket()` to open a 60-second round
2. Players deposit ETH and bet UP or DOWN on BTC price
3. At 50 seconds, betting locks automatically
4. At 60 seconds, anyone calls `resolveMarket()` — Chainlink settles the price
5. Winners split the losing pool proportionally, minus a 2.5% protocol fee

No admin keys on the round lifecycle. Permissionless.

## Architecture

```
flashbets/
├── contracts/          # Solidity 0.8.20, Foundry
│   ├── src/
│   │   ├── FlashBets.sol
│   │   └── interfaces/AggregatorV3Interface.sol
│   ├── script/Deploy.s.sol
│   ├── test/FlashBets.t.sol
│   └── foundry.toml
└── frontend/           # Next.js 14, wagmi v2, RainbowKit
    └── src/
        ├── app/
        ├── components/
        ├── hooks/
        └── lib/
```

## Contract

**Chainlink BTC/USD:**
- Base mainnet: `0x64c911996d3c6aC71F9B455b1e8E7266BcFbf528`
- Base Sepolia: `0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1`

**Round lifecycle constants:**
- `ROUND_DURATION` = 60 seconds
- `LOCK_THRESHOLD` = 50 seconds
- `MIN_BET` = 0.0001 ETH
- `PROTOCOL_FEE_BPS` = 250 (2.5%)

**Payout formula:**
```
loserShare = (betAmount * loserPool) / winnerPool
fee        = loserShare * 2.5%
payout     = betAmount + loserShare - fee
```

## Setup

### Contracts

```bash
cd contracts

# Install dependencies
forge install foundry-rs/forge-std
forge install OpenZeppelin/openzeppelin-contracts@v5.1.0

# Test
forge test -vv

# Deploy to Base Sepolia
forge script script/Deploy.s.sol \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast --verify \
  --etherscan-api-key $BASESCAN_API_KEY
```

### Frontend

```bash
cd frontend
bun install

# Add contract address to src/lib/contract.ts
bun run dev
```

Create `frontend/.env.local`:
```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

## Tests

6 tests, all passing:

| Test | What it covers |
|------|----------------|
| `test_deposit` | ETH deposit updates balance |
| `test_full_round_up_wins` | Complete round: deposit, bet, lock, resolve, claim, loser rejected |
| `test_cannot_bet_after_lock_threshold` | Betting reverts after 50s |
| `test_cannot_double_bet` | Second bet reverts |
| `test_cannot_resolve_before_round_complete` | Early resolve reverts |
| `test_withdraw` | Withdraw updates balance and sends ETH |

## License

MIT
