# PromiseLens

A working browser workspace and GenLayer Intelligent Contract for evidence-based promise tracking.

## Run

Requires Node.js 18+. Run `npm ci`, `node build.mjs`, then serve `dist` with any static HTTP server.

The default workspace connects to deployed contract `0x29cbdD5c5266693170Ad0920c92776dC45BF3c00` on hosted GenLayer Studionet (61999). It loads the finalized integration-test promise and actual AI verdict automatically. No wallet is needed to read it. New writes require a browser wallet. The board's discovery index is browser-local; contract state is authoritative. No identity verification or global discovery is included.

## Activate GenLayer

1. The default contract is already deployed. For another instance, open https://studio.genlayer.com and deploy `contracts/PromiseLens.py` (no constructor arguments).
2. The app selects the existing contract automatically. To use your own instance, open **GenLayer connection**, paste its address, and select **Use contract**.
3. Connect a browser wallet to stable Studionet (61999); fund it using Studio's development faucet.
4. Record a new promise, submit evidence, and request evaluation after the deadline day ends in UTC.
5. Load existing records by promise ID. The board's discovery index lives in this browser. A local record is not automatically migrated to the contract.

The browser bundle uses the locked stable `genlayer-js` SDK. It targets stable Studionet, not the v0.6 Studio-dev preview. Wallet writes wait for FINALIZED and then reread finalized state. Submitted transaction hashes are retained in browser storage if waiting fails; check Studio before retrying a submitted transaction.

## Decision rules

The recorder fixes the original source, title, deadline, and up to eight criteria. Only that recorder can add up to five evidence URLs. Anyone can request an evaluation after the deadline, up to ten evaluations per promise. Supported evidence hosts are github.com, raw.githubusercontent.com, and docs.genlayer.com; content is fetched by the contract, not accepted as an authoritative browser summary. Redirect handling remains subject to GenLayer's web runtime. Each fetched body is truncated to 16,000 characters; long pages may require raw text sources.

Each criterion yields met, unmet, or unknown with dated support. Non-unknown findings require exact source quotations. Validators compare states and source indices. All met = fulfilled; all unmet = unfulfilled; some met = partially fulfilled; otherwise insufficient evidence. Every evaluation preserves its explanation and evidence URLs. Full fetched pages are not archived on chain, so linked content can subsequently change. LLM judgment and publication-date interpretation require adversarial integration testing before production use.

Deployment and AI evaluation have been verified in hosted Studio using its development account and full validator consensus. See `VALIDATION.md` and `dist/verification.json`; repeat read-only verification with `node verify-live.mjs`. This is a development sandbox, not mainnet or Bradbury. End-user browser-wallet signing remains untested. Historical promises are supported and the actual recording timestamp stays visible. Recorded claims do not authenticate a project's identity or endorsement.

## Tests

Use Python 3.12+, `pip install -r requirements.txt`, then `pytest tests -v`. Direct-mode tests mock LLM/web responses; they do not replace Studio consensus validation.

References: https://docs.genlayer.com/developers/intelligent-contracts/equivalence-principle and https://docs.genlayer.com/developers/intelligent-contracts/testing
