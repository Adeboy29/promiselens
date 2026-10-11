# Repository update

All source and test files intentionally live at the repository root to match the existing uploaded layout. app-source.js is readable source; app.js is its compiled bundle. PromiseLens.py is authoritative contract source.

Keep Settings > Pages > Deploy from a branch > main > / (root). The custom .github/workflows/main.yml verifies builds/tests and does not deploy Pages. See README.md for exact commands.
