#!/usr/bin/env bash
# PR Guard: tu dong kiem tra quy tac PR cua trosv.
# Vi pham -> review REQUEST_CHANGES (auto reject). Khong vi pham -> im lang.
# Cach dung: pr-guard.sh <so_pr>  (yeu cau: GH_TOKEN, GITHUB_REPOSITORY, gh CLI)
set -euo pipefail

REPO="${GITHUB_REPOSITORY:?GITHUB_REPOSITORY not set}"
PR="${1:?usage: pr-guard.sh <pr_number>}"
endpoint="repos/$REPO/pulls/$PR"

body="$(gh api "$endpoint" --jq '.body // ""')"

# lockfile khong tinh vao gioi han kich thuoc diff
skip_lock='.[] | select((.filename | test("package-lock\\.json$|composer\\.lock$")) | not)'

# moi dong ket qua la "additions<TAB>deletions" cua 1 file
metrics="$(gh api --paginate --jq "$skip_lock | [.additions, .deletions] | @tsv" "$endpoint/files")"
lines="$(awk '{s += $1 + $2} END {print s + 0}' <<<"$metrics")"
file_count="$(awk 'END {print NR + 0}' <<<"$metrics")"

apps="$(gh api --paginate --jq \
  '.[] | .filename | if startswith("apps/api/") then "apps/api"
    elif startswith("apps/web/") then "apps/web"
    elif startswith("apps/ai-service/") then "apps/ai-service"
    else "chore" end' \
  "$endpoint/files" | sort -u)"
app_count="$(grep -c . <<<"$apps" || true)"

violations=()
if (( lines > 400 )); then
  violations+=("• Diff vượt giới hạn: **${lines}** dòng thay đổi (tối đa **400**, không tính lockfile). Hãy tách PR nhỏ hơn.")
fi
if (( file_count > 15 )); then
  violations+=("• Diff vượt giới hạn: **${file_count}** file (tối đa **15**, không tính lockfile). Hãy tách PR nhỏ hơn.")
fi
if (( app_count > 1 )); then
  list="$(printf '%s, ' $apps)"
  violations+=("• PR thay đổi nhiều hơn một app: **${list%, }**. Mỗi PR chỉ được thay đổi một app — hãy tách PR riêng cho từng app.")
fi
if grep -q '^apps/web$' <<<"$apps" && ! grep -qiE 'user-attachments|!\[|\.(png|jpe?g|webp|gif)' <<<"$body"; then
  violations+=("• Có thay đổi ở \`apps/web/\` nhưng chưa dán **ảnh chụp màn hình (trước/sau)** vào phần Mô tả của PR. Không có ảnh → PR bị từ chối.")
fi

if (( ${#violations[@]} == 0 )); then
  exit 0
fi

joined="$(printf '%s\n' "${violations[@]}")"
review_body="## 🤖 PR Guard — tự động yêu cầu thay đổi

PR này vi phạm quy tắc PR của dự án (xem [.github/PULL_REQUEST_TEMPLATE.md](https://github.com/${REPO}/blob/unstable/.github/PULL_REQUEST_TEMPLATE.md)):

${joined}

**Cách sửa:**
- Tách PR nhỏ hơn / một app mỗi PR.
- Thay đổi \`apps/web/\` → dán ảnh chụp màn hình trước/sau vào phần Mô tả.

Sau khi sửa và push lại, bot sẽ tự chạy lại và bỏ qua nếu không còn vi phạm."

gh api -X POST "$endpoint/reviews" \
  -f event="${REVIEW_EVENT:-REQUEST_CHANGES}" \
  -f body="$review_body" >/dev/null
