import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SUGGESTER_PATH = PROJECT_ROOT / "scripts" / "cat_tag_suggester.py"


def load_cases(path_arg):
    return json.loads(Path(path_arg).read_text(encoding="utf-8"))


def run_case(case):
    payload = {
        "personality": case.get("personality", ""),
        "health": case.get("health", ""),
        "notes": case.get("notes", ""),
        "limit": 5,
    }

    with tempfile.NamedTemporaryFile("w", encoding="utf-8", suffix=".json", delete=False) as handle:
        handle.write(json.dumps(payload, ensure_ascii=False))
        temp_path = handle.name

    try:
        completed = subprocess.run(
            [sys.executable, str(SUGGESTER_PATH), temp_path],
            cwd=str(PROJECT_ROOT),
            capture_output=True,
            text=True,
            check=False,
        )

        if completed.returncode != 0:
            raise RuntimeError(completed.stderr or completed.stdout or "tag suggester failed")

        result = json.loads(completed.stdout or "{}")
        if not result.get("success"):
            raise RuntimeError(result.get("message") or "tag suggester returned failure")

        return result
    finally:
        try:
            os.unlink(temp_path)
        except FileNotFoundError:
            pass


def main():
    sample_path = Path(sys.argv[1]) if len(sys.argv) > 1 else PROJECT_ROOT / "scripts" / "cat_tag_suggester_samples.json"
    cases = load_cases(sample_path)

    total = len(cases)
    top1_hits = 0
    top3_hits = 0
    detailed_rows = []

    for case in cases:
        result = run_case(case)
        predicted = [item["tag"] for item in result.get("suggested_tags", [])]
        expected = case.get("expected_tags", [])

        top1_hit = bool(predicted[:1] and predicted[0] in expected)
        top3_hit = bool(set(predicted[:3]).intersection(expected))

        if top1_hit:
            top1_hits += 1
        if top3_hit:
            top3_hits += 1

        detailed_rows.append(
            {
                "name": case.get("name"),
                "expected_tags": expected,
                "predicted_tags": predicted[:5],
                "top1_hit": top1_hit,
                "top3_hit": top3_hit,
            }
        )

    report = {
        "total_cases": total,
        "top1_hit_rate": round(top1_hits / total, 4) if total else 0,
        "top3_hit_rate": round(top3_hits / total, 4) if total else 0,
        "cases": detailed_rows,
    }

    sys.stdout.write(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
