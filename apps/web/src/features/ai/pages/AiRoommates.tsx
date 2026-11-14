import { PageHeader } from "@/shared/ui/page-header";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES, route } from "@/shared/constants/routes";
import { aiRoommates } from "@/features/ai/api/aiApi";
import { errMessage, errStatus } from "@/shared/api/axiosClient";
import type { AiRoommate } from "@/shared/types/api";
import { Button } from "@/shared/ui/button";
import { Avatar } from "@/shared/ui/avatar";
import { EmptyState } from "@/shared/ui/empty-state";
import { AiUnavailableIllustration } from "@/shared/ui/icons";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { startDirectConversation } from "@/features/messaging/api/messagingApi";
import { formatHobby } from "@/features/profile/lib/hobbies";
import { aiErrorMessage } from "../lib/aiErrorMessage";
import { toast } from "@/shared/ui/toast";

export default function AiRoommates() {
  useDocumentTitle("Gợi ý bạn cùng phòng · TROSV");
  const navigate = useNavigate();
  const [rows, setRows] = useState<AiRoommate[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ status: number | null; message: string } | null>(null);

  useEffect(() => {
    aiRoommates()
      .then(setRows)
      .catch((err: unknown) => {
        setError({ status: errStatus(err), message: aiErrorMessage(err) });
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  async function messageUser(userId: number | undefined): Promise<void> {
    if (userId == null) return;
    try {
      const conv = await startDirectConversation(userId);
      void navigate(route(ROUTES.CONVERSATION, { id: conv.id }));
    } catch (err) {
      toast(errMessage(err, "Không mở được cuộc trò chuyện. Bạn thử lại nhé."));
    }
  }

  return (
    <>
      <PageHeader
        title="Bạn"
        highlight="cùng phòng"
        description="Trợ lý AI đề xuất sinh viên có sở thích gần giống bạn nhất, dựa trên hồ sơ của hai bên."
        className="max-w-4xl px-5 sm:px-5 lg:px-5"
      />

      <div className="mx-auto max-w-4xl p-5 pb-16">
        {loading ? (
          <div className="mt-8 flex flex-col items-center gap-3" aria-live="polite">
            <div
              className="size-8 animate-spin rounded-full border-2 border-plate border-t-transparent"
              aria-hidden
            />
            <p className="text-sm text-muted">Trợ lý AI đang tìm bạn cùng phòng phù hợp…</p>
          </div>
        ) : error ? (
          <EmptyState
            illustration={<AiUnavailableIllustration />}
            title="Chưa tìm được bạn cùng phòng"
            description={error.message}
            action={
              error.status === 422 ? (
                <Button asChild variant="outline">
                  <a href={ROUTES.PROFILE}>Mở hồ sơ</a>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    location.reload();
                  }}
                >
                  Thử lại
                </Button>
              )
            }
            className="pt-10"
          />
        ) : !rows || rows.length === 0 ? (
          <EmptyState
            title="Chưa có gợi ý nào"
            description="Chưa có sinh viên đang tìm bạn cùng phòng trong cùng tỉnh/thành phố và khoảng ngân sách của bạn."
            className="pt-10"
          />
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {rows.map((r, i) => (
              <div
                key={r.user_id ?? i}
                className="rounded-xl border border-line bg-card p-5 shadow-xs hover:border-line-strong transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={r.name ?? "Bạn"} size={48} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink text-base">{r.name}</p>
                    <p className="text-xs text-muted">{r.school ?? "Chưa rõ trường"}</p>
                  </div>
                  <span className="rounded-full bg-flyer/30 border border-flyer/70 px-2.5 py-1 text-xs font-bold tabular-nums text-ink">
                    {(typeof r.score === "number" ? r.score : Number(r.score ?? 0)).toFixed(0)}% phù
                    hợp
                  </span>
                </div>
                <p className="mt-3 text-sm text-ink-2 leading-relaxed">{r.reason ?? ""}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(r.interests_shared ?? []).map((x) => {
                    const h = formatHobby(x);
                    return (
                      <span
                        key={x}
                        className="inline-flex items-center gap-1 rounded-md bg-plate-tint border border-plate/25 px-2 py-0.5 text-xs font-semibold text-plate shadow-xs"
                        title="Sở thích chung"
                      >
                        <span>{h.label}</span>
                        <span className="text-[10px] font-normal text-plate/75">★ chung</span>
                      </span>
                    );
                  })}
                  {(r.interests ?? [])
                    .filter((x) => !(r.interests_shared ?? []).includes(x))
                    .map((x) => {
                      const h = formatHobby(x);
                      return (
                        <span
                          key={x}
                          className="inline-flex items-center rounded-md border border-line bg-paper px-2 py-0.5 text-xs font-medium text-ink-2"
                        >
                          <span>{h.label}</span>
                        </span>
                      );
                    })}
                </div>
                <div className="mt-4 flex justify-end">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      void messageUser(r.user_id);
                    }}
                  >
                    Nhắn tin
                  </Button>
                </div>
              </div>
            ))}
            <p className="col-span-full text-xs text-muted">Gợi ý tham khảo do AI tạo ra</p>
          </div>
        )}
      </div>
    </>
  );
}
