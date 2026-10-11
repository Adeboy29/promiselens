# PromiseLens

Evidence-based promise tracking with a GenLayer Intelligent Contract.

- Website: https://adeboy29.github.io/promiselens/
- Network: stable GenLayer Studionet, chain ID 61999 (development sandbox).
- Contract: `0x29cbdD5c5266693170Ad0920c92776dC45BF3c00`
- Integration record: `promiselens-integration-20261009`

## Rebuild from a fresh checkout

Use Node.js 24 and Python 3.12. Run commands from the repository root.

```sh
git clone https://github.com/Adeboy29/promiselens.git
cd promiselens
npm ci
npm run build
npm test
```

`app-source.js` and `wallet.js` are the readable frontend source. The build bundles them into root `app.js`; root `PromiseLens.py` is the authoritative contract source. Root `index.html` and `style.css` are tracked publish inputs. Root output intentionally matches the existing GitHub Pages setting: deploy from `main` / `(root)`. No `dist` directory is used.

Serve locally with `python -m http.server 8000`, then open http://localhost:8000. No secrets, wallet private keys, or environment file are required to build or read the public integration record.

## Contract tests

```sh
python -m pip install -r requirements.txt
python test_contracts.py
```

Use the committed runner rather than plain `pytest`: the pinned SDK registers one contract class per interpreter. The runner collects all nine scenarios and starts a fresh pytest process for each, explicitly loading the direct-mode plugin. Tests pin GenVM v0.2.12; the first run downloads its approximately 216 MB official release into ignored `.test-cache/`, so internet access is required. Python dependencies are pinned in `requirements.txt`.

`conftest.py` contains Windows-only test plumbing for SDK archive extraction and deleting its open stdin temporary file. It does not modify installed dependencies or contract logic. Linux CI uses the upstream extraction and stdin code. LLM/web responses are mocked; JSON string mocks are double encoded because genlayer-test 0.29.2 parses them eagerly.

Coverage: duplicate IDs, recorder-only evidence, supported source hosts, deadline guard, fulfilled, unfulfilled, partial and unknown verdicts, immutable evaluation history, and fabricated citation rejection. Direct tests do not establish AI accuracy or validator consensus.

## Read-only deployed verification

```sh
npm ci
npm run verify:live
```

This queries `https://studio.genlayer.com/api`, checks four known transaction receipts are FINALIZED/SUCCESS, compares normalized deployed code with `PromiseLens.py`, and checks the integration record/history. It refreshes root `verification.json`. No transactions are submitted. Network outages or a Studionet reset can make this check fail; the saved proof is historical, not a guarantee of current network state.

## CI and publishing

`.github/workflows/main.yml` runs install, build, asset checks, committed-output comparison, and all nine isolated contract scenarios on Ubuntu with Node 24 / Python 3.12. It runs on pushes, pull requests, and manual dispatch. Live verification is deliberately an explicit command, not a network-dependent claim about CI success. GitHub's separate `pages build and deployment` workflow serves the checked-in root files. After changing frontend or contract source, run `npm run build` and commit the generated root files as well.

## Use and limitations

Existing finalized records are readable without a wallet. New writes need a browser wallet on Studionet. Snaps are not required by the app's connection flow. Record a promise, add evidence, then request evaluation after its deadline day ends in UTC. Only the recorder can add evidence; anyone can request an evaluation. The board's discovery index is browser-local; load a shared record using its ID. No global feed or project identity authentication is provided.

Evidence hosts: github.com, raw.githubusercontent.com, docs.genlayer.com. Up to eight fixed criteria, five evidence sources and ten evaluations per promise. All criteria met means Fulfilled; all unmet means Unfulfilled; some met means Partially fulfilled; otherwise Insufficient evidence. Sources are fetched by the contract, quotations checked, and validators compare findings. Pages may change; full evidence snapshots are not archived.

See `VALIDATION.md` for the dated validation scope. This is a Studionet MVP, not mainnet or Bradbury. End-user browser-wallet transactions remain unverified. No production audit or adversarial AI evaluation is claimed.
