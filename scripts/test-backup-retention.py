"""Check backup.sh's pruning block using disposable files, never real backups."""

from datetime import datetime, timedelta
import os
from pathlib import Path
import subprocess
import tempfile


script = (Path(__file__).resolve().parents[1] / "infra/backup/backup.sh").read_text(encoding="utf-8")
lines = script.splitlines()
start = next(i for i, line in enumerate(lines) if line.startswith("# 4. Xoa ban cu:"))
end = next(i for i, line in enumerate(lines) if line.startswith("# 5. Verify"))
# Exercise the actual pruning block without starting Docker or reading .env.
prune = "\n".join(lines[start + 1:end])
sunday = datetime(2026, 11, 15, 12)
cases = {
    "40 days ending Sunday": [sunday - timedelta(days=i) for i in range(40)],
    "40 days ending Wednesday": [sunday + timedelta(days=3-i) for i in range(40)],
    "fewer than seven": [sunday - timedelta(days=i) for i in range(3)],
    "one backup": [sunday],
    "multiple backups on Sunday": [sunday - timedelta(minutes=i) for i in range(12)],
    "gaps between backups": [sunday - timedelta(days=3*i) for i in range(40)],
}

for name, dates in cases.items():
    with tempfile.TemporaryDirectory(prefix="backup retention ") as directory:
        root = Path(directory)
        dates = sorted(dates, reverse=True)
        retained = set(dates[:7]) | set([day for day in dates if day.weekday() == 6][:4])
        expected = {"unrelated.txt"}
        (root / "unrelated.txt").write_text("keep me", encoding="utf-8")
        for day in dates:
            timestamp = day.strftime("%Y%m%d-%H%M%S")
            for filename in (f"db-{timestamp}.sql.gz", f"uploads-{timestamp}.tar.gz", f"env-{timestamp}.bak"):
                path = root / filename
                path.write_text("test fixture", encoding="utf-8")
                os.utime(path, (day.timestamp(), day.timestamp()))
                if day in retained:
                    expected.add(filename)
        result = subprocess.run(
            ["bash", "-euo", "pipefail", "-c", prune],
            env={**os.environ, "BACKUP_DIR": directory, "KEEP_DAILY": "7", "KEEP_WEEKLY": "4"},
            capture_output=True,
            timeout=10,
            check=False,
        )
        actual = {path.name for path in root.iterdir()}
        if result.returncode != 0 or actual != expected:
            raise AssertionError(
                f"{name}: exit={result.returncode}, missing={sorted(expected-actual)}, extra={sorted(actual-expected)}"
            )
        print(f"PASS: {name}")
