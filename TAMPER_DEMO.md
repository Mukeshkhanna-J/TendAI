# Insider Tamper Demo — Bid Value Integrity

Demonstrates that a corrupt insider with full database access still cannot alter
a bid undetected, because the value was committed to a smart contract at
submission time.

Nothing under `blockchain/` was modified. The contract, its deployment script and
the Hardhat config are exactly as they are on `main`. The feature only *reads*
the existing `TenderContract`.

---

## The mechanism

At submission (unchanged behaviour):

```
commitHash = sha256( String(Number(amount)) )      →  submitBid(tenderId, commitHash)
```

The contract stores that `bytes32` under `tenderCommitments[tenderId][msg.sender]`
and it can never be rewritten — `submitBid` reverts if a commitment already
exists for that wallet and tender.

What was added: the readable bid (amount, wallet address, tx hash) is now also
persisted off-chain in MongoDB. That off-chain row is the attack surface.

At verification:

```
localHash = sha256( String(Number(amountCurrentlyInDatabase)) )
chainHash = getBidderCommitment(tenderId, walletAddress).commitHash

localHash === chainHash   →  PASSED  — Bid Integrity Verified
localHash !== chainHash   →  FAILED  — Bid Value Changed
```

The chain is read live over RPC on every check, and the amount is re-fetched from
the API first, so the comparison always reflects the current database state.

---

## Running the demo

Prerequisites are the same as `main`: Ganache on `127.0.0.1:7545` (chain id
1337), MongoDB, the contract deployed via `blockchain/scripts/deploy.js` so that
`client/src/constants/contractDetails.json` holds the live address, and MetaMask
pointed at the Ganache network.

```bash
cd server && npm install && npm run dev
```

```bash
cd client && npm install && npm run dev
```

**1. Bidder submits a bid**

Log in as a bidder → *Bidder Dashboard* → connect wallet → submit a bid, e.g.
₹50,00,000. The wallet signs one transaction: the commitment goes on-chain, and
the readable bid lands in MongoDB.

**2. Bidder verifies — baseline**

In *My Bids*, click **Verify** on that row. Expected: green
**PASSED — Bid Integrity Verified**, with the two identical hashes shown side by
side. Do this before the attack so the audience sees the honest case first.

**3. Admin tampers**

Log in as an admin → sidebar → **Bid Value Control**. Find the bid, change the
*Stored Amount* to something lower (e.g. ₹41,00,000) and click **Apply Change**.

Optionally tick *"Also rewrite the hash cached in the database"* first — this
simulates a thorough insider who updates the mirrored hash too. It changes
nothing about the outcome, which is the point: verification reads the chain.

The database row now holds the manipulated amount. `PATCH /api/bids/:id/amount`
touches Mongo only; there is no code path from that endpoint to the contract.

**4. Bidder verifies — attack detected**

Back on the bidder dashboard, click **Verify** again. Expected: red
**FAILED — Bid Value Changed**, with the hash of the stored amount visibly
different from the commitment on the blockchain.

**5. Reset**

*Bid Value Control* → **Restore** puts the original amount back, and the next
verification passes again. Useful for re-running the demo.

---

## Verdicts

| Verdict | Meaning |
| --- | --- |
| `VERIFIED` | Stored amount hashes to exactly the on-chain commitment. |
| `TAMPERED` | A commitment exists, but the stored amount no longer matches it. |
| `NOT_ON_CHAIN` | The contract holds no commitment for this tender + wallet (transaction not yet mined, or wrong network / contract address). |
| `NO_WALLET` | The bid record has no wallet address — seeded or pre-blockchain data that was never anchored. |
| `NO_CONTRACT` | Nothing is deployed at the address in `contractDetails.json` on the connected chain. A setup problem, not a bid problem — see below. |
| `ERROR` | The RPC read failed. Check that Ganache is running. |

Seeded bids (`BID-901` … `BID-905`) report `NO_WALLET`: they were never committed
on-chain, so there is nothing to verify against. Only bids submitted through the
wallet flow can be verified.

---

## Troubleshooting

### `No contract deployed at 0x… ` / `getBidderCommitment returned no data ("0x")`

The address in `client/src/constants/contractDetails.json` is committed to the
repository, so a fresh clone carries the address from whoever deployed last. It
will not match a Ganache instance you started yourself, and restarting Ganache
wipes all deployed contracts and stored commitments.

This failure is quiet on the write side: a transaction sent to an address with
no code does not revert. It succeeds, returns an ordinary transaction hash, and
stores nothing. Bids submitted that way look fine until verification finds
nothing to check against. The dashboard now refuses to submit when the contract
is missing, but any bid created before that check has no commitment and can
never verify — delete it and submit a new one.

Fix:

```bash
cd blockchain && npm install
```

Create `blockchain/.env` (gitignored, so not in a fresh clone):

```
GANACHE_RPC_URL=http://127.0.0.1:7545
GANACHE_PRIVATE_KEY=<private key of a Ganache account>
```

With Ganache running on port 7545, deploy — this rewrites `contractDetails.json`
with the new address:

```bash
npx hardhat run scripts/deploy.js --network ganache
```

Restart the Vite dev server so the new JSON is picked up, then submit a fresh
bid and verify it.

### Chain id mismatch

`client/src/App.jsx` defines the Ganache chain as id **1337**. If your Ganache
reports a different chain id, MetaMask connects but reads resolve against the
wrong network.

---

## Files

Added:

| File | Role |
| --- | --- |
| `client/src/utils/bidHash.js` | Canonical amount → sha256 commitment, shared hashing rule. |
| `client/src/hooks/useVerifyBid.js` | Reads `getBidderCommitment` and returns the verdict. |
| `client/src/hooks/useContractDeployed.js` | Pre-flight check that the contract address actually holds code. |
| `client/src/components/VerificationReport.jsx` | Side-by-side hash comparison panel. |
| `client/src/components/IntegrityBadge.jsx` | Compact verdict pill. |
| `client/src/pages/AdminBidControl.jsx` | The attack screen. |
| `server/src/utils/bidHash.js` | Server-side twin of the hashing rule. |

Modified:

| File | Change |
| --- | --- |
| `server/src/models/Bid.js` | Added `walletAddress`, `commitHash`, `originalAmount`, `tampered`, `tamperLog`. |
| `server/src/controllers/bidController.js` | `submitBid` stores the anchoring fields; added `adminUpdateBidAmount` and `adminRestoreBidAmount`. |
| `server/src/routes/bidRoutes.js` | `PATCH /api/bids/:id/amount` and `/restore`, admin-only. |
| `client/src/services/api.js` | `adminUpdateAmount`, `adminRestoreAmount`. |
| `client/src/pages/BidderDashboard.jsx` | Persists the bid off-chain after the chain write; adds the integrity column and report. |
| `client/src/App.jsx` | Route `admin/bid-control`. |
| `client/src/layouts/DashboardLayout.jsx` | Sidebar entry. |
| `client/src/pages/AdminDashboard.jsx` | Link to the attack screen. |

One behavioural change to note in `BidderDashboard.jsx`: on `main`, the call that
saved the bid to MongoDB was commented out, so submissions went to the chain
only. It is re-enabled here, because the demo needs an off-chain record for the
admin to tamper with. The chain write is unchanged and still happens first.
