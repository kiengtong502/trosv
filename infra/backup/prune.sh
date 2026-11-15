#!/usr/bin/env bash
# ============================================================
# TROSV - xoa ban backup cu (goi tu backup.sh, test: prune-test.sh)
#
#   ./infra/backup/prune.sh <BACKUP_DIR>
#
# Giu: KEEP_DAILY ban moi nhat + KEEP_WEEKLY ban chu nhat moi nhat.
# Moi bo gom db-<TS>.sql.gz, uploads-<TS>.tar.gz, env-<TS>.bak.
# ============================================================
set -euo pipefail

DIR="$1"
KEEP_DAILY="${KEEP_DAILY:-7}"
KEEP_WEEKLY="${KEEP_WEEKLY:-4}"

shopt -s nullglob
# TS = YYYYmmdd-HHMMSS sorts by name: newest first.
mapfile -t dumps < <(printf '%s\n' "$DIR"/db-*.sql.gz | sort -r)
[ -n "${dumps[0]:-}" ] || exit 0

ts_of() { local n; n="$(basename "$1")"; n="${n#db-}"; echo "${n%.sql.gz}"; }

declare -A keep=()
for f in "${dumps[@]:0:KEEP_DAILY}"; do keep["$f"]=1; done

sundays=0
for f in "${dumps[@]}"; do
    [ "$sundays" -lt "$KEEP_WEEKLY" ] || break
    ts="$(ts_of "$f")"
    if [ "$(date -d "${ts:0:8}" +%u)" = 7 ]; then
        keep["$f"]=1
        sundays=$((sundays + 1))
    fi
done

for f in "${dumps[@]}"; do
    [ -z "${keep["$f"]:-}" ] || continue
    ts="$(ts_of "$f")"
    rm -f "$f" "$DIR/uploads-$ts.tar.gz" "$DIR/env-$ts.bak"
done
