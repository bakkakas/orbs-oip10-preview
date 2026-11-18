# OIP-10 interactive preview

Focused Korean community UI preview. **No live chain integration, real subscriptions, contact collection, wallet connection, or notification delivery.** Only public illustrative data is deployed from `site/`.

## Scope
- Exact target: **507,540,603 ORBS**.
- Weekly formula: **USD 67,307.69 / prior-period ORBS/USD 7-day TWAP**.
- Six completed illustrative weeks and one pending example; no invented dates, addresses, hashes, chains or authoritative market prices.
- Numeric TWAP input, slider, presets, invalid-value handling and over-remaining-balance warning. Simulator never modifies historical progress.
- Responsive weekly table with state/week filters, ordering, empty state and keyboard-accessible detail dialog.
- Telegram/email/web-push preference prototype stored only in browser localStorage; preview message only.
- Proposal and Korean explainer links. All live-integration inputs marked pending.

## Local verification
```
npm test
npm run check
python3 -m http.server 8899 --bind 127.0.0.1 --directory site
```
Optional browser QA: `node tests/browser.cjs http://127.0.0.1:8899/` with Playwright installed. `PLAYWRIGHT_MODULE` and `CHROMIUM_PATH` may point to an existing local installation. Exercises 1440, 390 and 320px viewports and writes ignored screenshots to `artifacts/`. Tests also run against the deployed HTTPS URL.

## Deployment
GitHub Pages Actions deploys only `site/` on main, after model tests and JS syntax checks. Query-string asset versions are updated through HTML → app → model when assets change. No public API keys or backend endpoints.

## Weekly alerts: recommended production architecture (NOT implemented)
1. A scheduled server worker reads indexed burn events or the confirmed chain's RPC (`eth_getLogs` only if EVM). Backfill from a configured start block with a bounded overlap; keep a durable cursor and back off on rate limits.
2. Validate successful receipt, emitting contract, exact ABI/event signature, token decimals and burn semantics; a transfer alone is not assumed to be a burn. Check canonical block hash and agreed finality/confirmation depth. Pending/orphaned transactions never trigger success notices.
3. Retrieve the selected official price source over the exact previous 7-day interval (UTC boundaries). TWAP is time-weighted, not an unweighted mean of uneven samples. Record source, timestamps, coverage and method; incomplete/stale price data blocks a full price-bearing notification rather than substituting a spot price. Use fixed-point/decimal arithmetic and the contract's rounding/cap rules in production; the UI simulator uses floating-point values for illustration only.
4. Persist an immutable snapshot: chain/contract, tx hash, log index, block hash/number, event amount, interval boundaries, TWAP evidence, computed reference amount, cumulative amount and timestamp. Publish atomically; retain the last good snapshot on upstream failures. Compare expected and actual burn without silently substituting either.
5. Insert an outbox row atomically with the snapshot. Unique event key `(chainId, contract, txHash, logIndex)`; unique recipient delivery key `(eventKey, channel, recipientId)`. Dispatch after finalized NEW burns only, using provider idempotency where available. Retry transient failures with backoff; Telegram has no general idempotency key, so reconcile unknown send outcomes rather than blindly promising exactly-once delivery. Support unsubscribe and reorg correction handling.
6. Telegram: user starts the bot, verifies an expiring bind code, and consents to DM or authorized channel delivery. Simplest first release. Email: verified address/double opt-in, delivery provider and unsubscribe link. Web push: HTTPS service worker + VAPID + explicit permission and stored PushSubscription; supported iOS home-screen installs need user interaction. Never request permission on page load.
7. Monitor collection failures separately from user burn alerts. Scheduled execution alone is not evidence of a new burn. No real scheduler or alerts are created by this prototype.

## Remaining production inputs
- Official burn contract and token address, chain/network ID, deployment/start block, ABI and exact burn-event semantics/signature; decimals and explorer URL.
- Authoritative ORBS/USD price source or pool/oracle, TWAP sampling/time weighting, exact 7-day UTC cutoffs, handling of missing data.
- First burn date/weekly cutoff, finality requirements, amount rounding and last-balance/cap behavior; confirm deposit amount against deployment.
- Preferred initial channel, recipient opt-in/linking flow, backend hosting/DB and chosen messaging provider credentials stored server-side (never in the public site).

No live data or alert delivery is claimed. Preferences saved in this prototype are not production consent/subscriptions.
