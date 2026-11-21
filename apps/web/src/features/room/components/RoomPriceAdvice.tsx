import { useState } from "react";
import { Sparkles } from "lucide-react";
import { aiPriceAdvice } from "@/features/ai/api/aiApi";
import { Button } from "@/shared/ui/button";
import { useAuth } from "@/features/auth/context/AuthContext";
import { formatVnd } from "@/shared/lib/format";
import { errMessage, errStatus } from "@/shared/api/axiosClient";
import type { AiPriceAdvice } from "@/shared/types/api";

/** 422 (too few similar rooms) and 429 (rate limit) carry a reason worth showing as is. */
function adviceError(err: unknown): string {
  const status = errStatus(err);
  return status === 422 || status === 429
    ? errMessage(err)
    : "Trợ lý AI đang bận. Bạn thử lại sau ít phút nhé.";
}

/** Fair range, the first tip and how wide the comparison was. */
function AdviceResult({ advice }: { advice: AiPriceAdvice }) {
  return (
    <div data-testid="ai-price">
      <p className="font-bold text-ink">
        Khoảng giá hợp lý: {formatVnd(advice.fair_min ?? 0)} – {formatVnd(advice.fair_max ?? 0)}
        /tháng
      </p>
      <p className="mt-1 text-sm text-ink-2">
        {advice.tips?.[0] ?? advice.message ?? "Giá phòng phù hợp với mặt bằng chung khu vực."}
      </p>
      <p className="mt-2 text-xs text-muted">
        * Tham khảo, dựa trên {advice.stats?.count ?? 0} phòng tương tự cùng{" "}
        {advice.stats?.scope === "city" ? "thành phố" : "phường"}.
      </p>
    </div>
  );
}

/** "Gợi ý giá": students ask the AI whether this room's price is fair. */
export function RoomPriceAdvice({ listingId }: { listingId: number }) {
  const { user } = useAuth();
  const [advice, setAdvice] = useState<AiPriceAdvice | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function ask(): Promise<void> {
    setBusy(true);
    setError("");
    try {
      setAdvice(await aiPriceAdvice(listingId));
    } catch (err) {
      setError(adviceError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-xl border border-moss/25 bg-moss-tint p-5 shadow-card">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-moss">
        <Sparkles className="size-3.5" aria-hidden />
        Gợi ý giá
      </div>
      {user?.role !== "student" ? (
        <p className="text-sm text-ink-2">
          Đăng nhập bằng tài khoản sinh viên để xem mức giá hợp lý từ trợ lý AI.
        </p>
      ) : advice ? (
        <AdviceResult advice={advice} />
      ) : (
        <div className="flex flex-col items-start gap-2">
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button variant="outline" size="sm" loading={busy} onClick={() => void ask()}>
            <Sparkles className="size-4 text-plate" aria-hidden />
            Hỏi giá phòng này
          </Button>
        </div>
      )}
    </section>
  );
}
