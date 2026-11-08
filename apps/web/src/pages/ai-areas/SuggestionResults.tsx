import { Button } from "@/ui/button";
import { EmptyState } from "@/ui/empty-state";
import { AiUnavailableIllustration } from "@/ui/icons";
import { SuggestionCard } from "./SuggestionCard";
import type { AreaSuggestions } from "./useAreaSuggestions";

/** Below the form: a spinner, the error states, or the suggested areas. */
export function SuggestionResults({ s }: { s: AreaSuggestions }) {
  if (s.busy) {
    return (
      <div className="mt-8 flex flex-col items-center gap-3" aria-live="polite">
        <div
          className="size-8 animate-spin rounded-full border-2 border-plate border-t-transparent"
          aria-hidden
        />
        <p className="text-sm text-muted">Trợ lý AI đang phân tích các khu vực…</p>
      </div>
    );
  }
  if (s.error === "unavailable") {
    return (
      <EmptyState
        illustration={<AiUnavailableIllustration />}
        title="Trợ lý AI đang bận"
        description="Bạn thử lại sau ít phút nhé."
        action={
          <Button
            variant="outline"
            onClick={() => {
              location.reload();
            }}
          >
            Thử lại
          </Button>
        }
        className="pt-10"
      />
    );
  }
  if (s.error === "input") {
    return (
      <EmptyState
        title="Chưa đủ thông tin"
        description="Bạn chọn trường hoặc khoảng ngân sách rồi thử lại nhé."
        className="pt-10"
      />
    );
  }
  if (!s.rows) return null;
  return (
    <div className="mt-8 flex flex-col gap-4">
      {s.rows.length === 0 ? (
        <EmptyState
          title="Chưa có gợi ý nào"
          description="Thử thêm trường hoặc nới khoảng ngân sách rồi chạy lại."
          className="pt-6"
        />
      ) : (
        s.rows.map((area, i) => <SuggestionCard key={area.ward_id ?? i} area={area} />)
      )}
      <p className="text-xs text-muted">Gợi ý tham khảo do AI tạo ra</p>
    </div>
  );
}
