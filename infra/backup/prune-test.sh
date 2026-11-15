#!/usr/bin/env bash
# Test cho prune.sh: 40 ngay backup (02:30 moi dem) -> con 7 ban moi nhat
# + 4 ban chu nhat moi nhat, ca bo (db/uploads/env) bi xoa cung nhau.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIR="$(mktemp -d)"
trap 'rm -rf "$DIR"' EXIT

# 2026-01-01 .. 2026-02-09 (2026-02-09 la thu Hai).
for i in $(seq 0 39); do
    ts="$(date -d "2026-01-01 + $i days" +%Y%m%d)-023000"
    touch "$DIR/db-$ts.sql.gz" "$DIR/uploads-$ts.tar.gz" "$DIR/env-$ts.bak"
done

bash "$HERE/prune.sh" "$DIR"

# 7 ngay moi nhat (03-09/02) + chu nhat 01/02, 25/01, 18/01 (08/02 da nam trong 7 ngay).
expected="20260118 20260125 20260201 20260203 20260204 20260205 20260206 20260207 20260208 20260209"
actual="$(cd "$DIR" && printf '%s\n' db-*.sql.gz | sed 's/^db-\([0-9]*\)-.*/\1/' | sort | xargs)"

if [ "$actual" != "$expected" ]; then
    echo "FAIL: con lai [$actual], mong doi [$expected]" >&2
    exit 1
fi
[ "$(find "$DIR" -name 'uploads-*' | wc -l)" = 10 ] || { echo "FAIL: uploads khong khop db" >&2; exit 1; }
[ "$(find "$DIR" -name 'env-*' | wc -l)" = 10 ] || { echo "FAIL: env khong khop db" >&2; exit 1; }
echo "OK: prune giu 7 ban ngay + 4 ban chu nhat"
