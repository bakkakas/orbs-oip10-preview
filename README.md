# OIP-10 interactive preview

Focused Korean community UI preview. **No live chain integration, real subscriptions, contact collection, wallet connection, or notification delivery.** Burn records remain illustrative; the header independently fetches a public live ORBS/USD market quote.

## Scope
- Exact target: **507,540,603 ORBS**.
- Weekly formula: **USD 67,307.69 / prior-period ORBS/USD 7-day TWAP**.
- Six completed illustrative rounds and one pending example, with explicitly illustrative weekly dates starting 2026-11-13. No transaction hashes are fabricated.
- Summary cards: initial 10 billion ORBS minus illustrative cumulative burns; latest completed reference price; completed rounds out of 52. The former simulator has been removed.
- Compact completed-only weekly table with period filters, ordering and keyboard-accessible details. Pending rounds are never shown.
- Telegram setup instructions and message preview below the history table; no channel selector, local preference or live subscription.
- Proposal and Korean explainer links. All live-integration inputs marked pending.

## Local verification
```
npm test
npm run check
npm run build
python3 -m http.server 8899 --bind 127.0.0.1 --directory dist
```
Optional browser QA: `node tests/browser.cjs http://127.0.0.1:8899/` with Playwright installed. `PLAYWRIGHT_MODULE` and `CHROMIUM_PATH` may point to an existing local installation. Exercises 1440, 390 and 320px viewports and writes ignored screenshots to `artifacts/`. Tests also run against the deployed HTTPS URL.

## Deployment
GitHub Pages Actions builds `site/` into `dist/` on main after tests and syntax checks. A content-derived release hash automatically rewrites every versioned HTML/CSS/JS reference, including nested imports. The release manifest detects stale tabs on entry/resume; language links carry the same release ID. No per-language page builds exist. No public API keys or application backend; the browser reads the public CoinGecko simple-price endpoint.

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

No live on-chain burn data or alert delivery is claimed. Preferences saved in this prototype are not production consent/subscriptions.

## Preview copy editor (2026-11-23)

Use **문구 편집** to change titles and descriptions, then **저장하고 적용**. Plain text is stored only in the current browser (localStorage); this does not publish changes to other visitors/devices. Cancel/Escape discards unsaved edits. **기본 문구로 채우기** restores draft defaults; save to apply. **문구 파일 받기** exports the current draft as JSON for handoff. Financial values and preview/temporary warnings remain outside the editor.

The contract display and Etherscan link temporarily use the user-supplied ORBS staking contract `0x01D59Af68E2dcb44e04C50e05F62E7043F2656C3`. It is explicitly NOT the burn contract and no on-chain reads are made. The filled progress bar has a subtle shimmer, disabled by prefers-reduced-motion.

## Header market price and weekly history

- Header: official ORBS mark plus CoinGecko `orbs` USD spot price rounded to exactly four decimal places, 24-hour percentage change and provider update time. Updates every 60 seconds while visible; 10-second request timeout. Language switches share a validated quote in tab-scoped sessionStorage for at most 60 seconds, preserving the original provider timestamp. A refresh failure clears the quote in all languages and backs off until the next minute; corrupt, expired or stale cached quotes are rejected. Missing change is hidden, never treated as 0%.
- Quotes older than five minutes, invalid values, network/HTTP failures and stale resumed tabs are not displayed as current. Unavailable prices display a dash and a translated status. The public free endpoint may rate-limit; there is no fabricated fallback.
- Spot price does not feed the 7-day reference price, burn history or 32% illustrative progress.
- History has Date / Round, 7-day reference price (USD/ORBS), Amount burned (ORBS), and Transaction columns. Select a date for details; scroll the table horizontally on mobile.
- Actual hashes are currently unknown. At the user's request all sample transaction cells temporarily link to the supplied ORBS staking address (an address page, not a transaction); the global preview notice and link tooltip identify this as a temporary address, without repetitive per-row labels. A supplied valid full transaction hash would instead render the exact transaction link.
- `tests/history-price.cjs` checks live quotes and table layout at three widths, then separately mocks missing/negative change, stale/invalid/error responses and refresh failure. It tests a synthetic transaction hash only in an isolated browser; never deployed as data.

## Summary cards and completed-only view

The global preview notice identifies all burn metrics as demo data: 10,000,000,000 minus 162,412,992.96 = 9,837,587,007.04 ORBS, not an on-chain totalSupply read. The reference-price card uses the highest completed round, not the live spot quote. Completion is 6 / 52. Completed-only filtering also applies to period filters and the row count.

## Cross-language updates

All three languages share the same model, renderers, live price request, table and card markup. Only labels differ. CI now builds the site and exercises the latest price, table, cards, links and controls across Korean, English and Japanese at desktop and mobile widths. Missing translations fail the language check rather than silently shipping a stale language-specific layout.

Copy editor saves use version 2: only user overrides, not a full snapshot of default text. Historical shipped defaults migrate automatically in all languages; genuine custom text remains untouched. Reset removes the overrides so later releases can update defaults. User edits are still local to their language/browser, not automatic machine translations.

The release checker preserves open editor drafts, ignores offline errors and bounds reload attempts. A content hash changes automatically on any source change, so maintainers do not need to manually bump individual import versions. An older pre-checker page may require one refresh to receive this mechanism.

## Telegram activation

The UI is not a working subscription endpoint yet. Operator setup: create a dedicated bot with @BotFather, store its token only in backend secrets, handle /start and /stop, persist opted-in chat IDs, and connect the verified burn-event worker/outbox described above. Publish a t.me bot link only once this is ready. Recipients open that link and press Start; a bot cannot initiate a private conversation before the user starts it. Authorized channel delivery instead requires adding the bot with appropriate posting rights.

A static GitHub Pages frontend cannot securely hold a bot token or run a reliable background monitor. A server/worker and durable database are required, along with the finalized burn contract/chain/ABI/start block. Current staking links are not evidence of burn events. No bot or real alerts are created by this change.
