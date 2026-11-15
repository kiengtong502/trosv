"""Exercise the resolved Compose startup command with fake PHP/server binaries.

Run: docker compose config --format json | python3 scripts/test-backend-startup.py
"""

import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile


config = json.load(sys.stdin)
# Compose escapes literal dollars in its config output, then unescapes on start.
command = [part.replace("$$", "$") for part in config["services"]["backend"]["command"]]
cases = [
    ("migration failure", "0", "migrate", 1, ["migrate"]),
    ("seed failure", "1", "db:seed", 1, ["migrate", "db:seed"]),
    ("storage link failure", "0", "storage:link", 1, ["migrate", "storage:link"]),
    ("success without seed", "0", "", 0, ["migrate", "storage:link", "server"]),
    ("success with seed", "1", "", 0, ["migrate", "db:seed", "storage:link", "server"]),
    ("success with existing storage link", "0", "", 0, ["migrate", "server"]),
]

for name, seed, failure, expected_code, expected_steps in cases:
    with tempfile.TemporaryDirectory() as directory:
        root = Path(directory)
        (root / "storage/app").mkdir(parents=True)
        (root / "storage/app/public").mkdir()
        if name == "success with existing storage link":
            (root / "public").mkdir()
            (root / "public/storage").symlink_to("../storage/app/public", target_is_directory=True)
        binaries = root / "bin"
        binaries.mkdir()
        for binary, source in {
            "php": '#!/bin/sh\nprintf "%s\\n" "$2" >> "$STARTUP_LOG"\n[ "$2" != "$FAIL_STEP" ]\n',
            "frankenphp": '#!/bin/sh\nprintf "server\\n" >> "$STARTUP_LOG"\n',
        }.items():
            path = binaries / binary
            path.write_text(source, encoding="utf-8")
            path.chmod(0o755)
        log = root / "steps.log"
        result = subprocess.run(
            command,
            cwd=root,
            env={
                **os.environ,
                "PATH": f"{binaries}{os.pathsep}{os.defpath}",
                "SEED_ON_BOOT": seed,
                "FAIL_STEP": failure,
                "STARTUP_LOG": str(log),
            },
            capture_output=True,
            timeout=10,
            check=False,
        )
        steps = log.read_text(encoding="utf-8").splitlines() if log.exists() else []
        if result.returncode != expected_code or steps != expected_steps:
            raise AssertionError(f"{name}: exit={result.returncode}, steps={steps}")
        print(f"PASS: {name}")
