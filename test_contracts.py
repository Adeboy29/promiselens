"""Run each collected contract scenario in a fresh interpreter (SDK registry isolation)."""
import os
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parent
ENV = {**os.environ, "PYTEST_DISABLE_PLUGIN_AUTOLOAD": "1"}
BASE = [sys.executable, "-m", "pytest", "-p", "gltest.direct.pytest_plugin"]

def main():
    collected = subprocess.run(BASE + ["test_contract.py", "--collect-only", "-q"],
                               cwd=ROOT, env=ENV, text=True, capture_output=True)
    if collected.returncode:
        print(collected.stdout + collected.stderr)
        return collected.returncode
    cases = [line.strip() for line in collected.stdout.splitlines()
             if line.startswith("test_contract.py::")]
    if len(cases) != 9:
        print("Expected 9 scenarios, found", len(cases), collected.stdout)
        return 1
    failed = 0
    for case in cases:
        result = subprocess.run(BASE + [case, "-q", "--tb=short"], cwd=ROOT, env=ENV)
        failed += result.returncode != 0
    print(f"Contract scenarios: {len(cases)-failed}/{len(cases)} passed")
    return int(bool(failed))

if __name__ == "__main__":
    raise SystemExit(main())
