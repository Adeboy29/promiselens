# Validation — 9 October 2026

Network: hosted GenLayer Studio development network, chain ID 61999. This is a development sandbox, not Bradbury or mainnet. Contract: `0x29cbdD5c5266693170Ad0920c92776dC45BF3c00`.

Deployment, create_promise, submit_evidence, and evaluate transactions all returned FINALIZED / SUCCESS. Evaluation ran in Normal (Full Consensus) mode, with Simulation Mode off. The finalized record and history were independently fetched over public RPC using the browser application's GenLayer SDK. `verification.json` contains exact transaction hashes, validator votes, timestamps, promise and verdict. Run `node verify-live.mjs` to repeat the read-only checks.

Verdict: Insufficient evidence. The contract fetched a public GenVM README and found that it did not establish an explicit publication date for v0.2.12. This is an integration check, not a claim about a promise actually made by GenLayer. The deployed source matches `PromiseLens.py` after normalizing line endings. SHA-256: `96ea3c949536eefdb2ceac479222b6c21e7d8611628c0a3eb8ce4b01bdf8c426`.

Passed: nine direct-mode scenarios covering creation/duplicate IDs, ownership, source restriction, deadline guard, all five verdict combinations, and fabricated citation rejection. Tests ran in isolated processes because the pinned SDK maintains one contract-class registration per process. The committed conftest.py now supplies the Windows-only stdin cleanup compatibility; installed dependencies need no edits. Mock text responses are double encoded to compensate for genlayer-test 0.29.2 eagerly parsing JSON mocks regardless of response format.

Also passed: browser bundle and JavaScript syntax; GenVM static linter; earlier DOM checks for local creation, search, HTML escaping, evidence submission and persistence.

Remaining limits: Studio writes were signed by its development account. End-user browser-extension signing still requires a user's wallet and has not been exercised here. No real funds were transferred. No production security audit, public-testnet deployment, appeal test, or adversarial LLM evaluation has been performed. Evidence pages can change after evaluation; full source snapshots are not stored on chain. The app keeps a browser-local discovery index; contract state is authoritative.
