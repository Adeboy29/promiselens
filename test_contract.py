import json
import pytest


def make(direct_vm, direct_deploy):
    direct_vm.warp("2026-01-01T12:00:00+00:00")
    contract = direct_deploy("PromiseLens.py", sdk_version="v0.2.12")
    contract.create_promise("p1", "Project", "Release SDK", "https://github.com/project/roadmap", "2026-01-02", json.dumps(["Tagged release", "Document installation"]))
    return contract


def test_creation_and_duplicate(direct_vm, direct_deploy):
    c = make(direct_vm, direct_deploy)
    assert json.loads(c.get_promise("p1"))["criteria"] == ["Tagged release", "Document installation"]
    with pytest.raises(Exception, match="duplicate"):
        c.create_promise("p1", "Other", "Changed", "https://github.com", "2026-02-01", '["Changed"]')


def test_evidence_owner_and_host(direct_vm, direct_deploy, direct_bob):
    c = make(direct_vm, direct_deploy)
    with pytest.raises(Exception, match="Supported sources"):
        c.submit_evidence("p1", "https://localhost/internal", "")
    direct_vm.sender = direct_bob
    with pytest.raises(Exception, match="Only the recorder"):
        c.submit_evidence("p1", "https://github.com/project/release", "")


def test_deadline_guard(direct_vm, direct_deploy):
    c = make(direct_vm, direct_deploy)
    c.submit_evidence("p1", "https://github.com/project/release", "")
    direct_vm.warp("2026-01-02T23:59:59+00:00")
    with pytest.raises(Exception, match="after the deadline"):
        c.evaluate("p1")


@pytest.mark.parametrize("states,status", [(["met", "met"], "Fulfilled"), (["met", "unknown"], "Partially fulfilled"), (["unmet", "unmet"], "Unfulfilled"), (["unknown", "unknown"], "Insufficient evidence"), (["unmet", "unknown"], "Insufficient evidence")])
def test_verdict_and_history(direct_vm, direct_deploy, states, status):
    c = make(direct_vm, direct_deploy)
    c.submit_evidence("p1", "https://github.com/project/release", "not proof")
    direct_vm.warp("2026-01-03T12:00:00+00:00")
    direct_vm.mock_web(r"github.com", {"status": 200, "body": "2026-01-01 release evidence"})
    answer = {"checks": [{"state": s, "reason": "Dated source supports this finding", "source": 0 if s != "unknown" else -1, "quote": "2026-01-01 release evidence" if s != "unknown" else ""} for s in states]}
    # genlayer-test 0.29.2 eagerly parses mock JSON even for text responses.
    # Encode a JSON string to preserve exec_prompt's actual text return type.
    direct_vm.mock_llm(r"Evaluate a recorded promise", json.dumps(json.dumps(answer)))
    c.evaluate("p1")
    assert json.loads(c.get_promise("p1"))["status"] == status
    assert len(json.loads(c.get_history("p1"))) == 1


def test_fabricated_citation_rejected(direct_vm, direct_deploy):
    c = make(direct_vm, direct_deploy)
    c.submit_evidence("p1", "https://github.com/project/release", "")
    direct_vm.warp("2026-01-03T12:00:00+00:00")
    direct_vm.mock_web(r"github.com", {"status": 200, "body": "No release"})
    direct_vm.mock_llm(r"Evaluate a recorded promise", json.dumps(json.dumps({"checks": [{"state": "met", "reason": "invented", "source": 0, "quote": "fictional release"}] * 2})))
    with pytest.raises(Exception, match="Unsupported citation"):
        c.evaluate("p1")
