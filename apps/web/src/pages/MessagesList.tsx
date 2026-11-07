import { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useParams } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { getConversations } from "@/api/socialApi";
import type { Conversation } from "@/types/api";
import { CONV_PREVIEW_EVENT, type ConvPreviewDetail } from "@/constants/events";
import { Skeleton } from "@/ui/badge";
import { EmptyState } from "@/ui/empty-state";
import { cn } from "@/lib/utils";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useAuth } from "@/context/AuthContext";
import { Search } from "lucide-react";
import { ConversationListItem } from "@/pages/messages/ConversationListItem";

/*
  Two panes from 890px (sidebar + thread), single pane on mobile where
  selecting a conversation navigates to /messages/:id as its own screen.
  Sidebar rows stay in sync while a thread is open via CONV_PREVIEW_EVENT
  dispatches from the thread (Messenger-style).
*/

export default function MessagesList() {
  const { id } = useParams();
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const { user } = useAuth();

  useDocumentTitle("Tin nhắn · TROSV");

  useEffect(() => {
    let active = true;
    getConversations()
      .then((rows) => {
        if (active) setConvs(rows);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  /* Thread -> sidebar preview sync while the thread is open. */
  useEffect(() => {
    function onPreview(e: Event): void {
      const detail = (e as CustomEvent<ConvPreviewDetail>).detail;
      setConvs((rows) =>
        rows.map((c): Conversation =>
          c.id === detail.conversationId
            ? {
                ...c,
                last_message: {
                  ...c.last_message,
                  body: detail.lastMessage ?? c.last_message?.body ?? null,
                  created_at: detail.lastMessageAt ?? c.last_message?.created_at ?? "",
                },
                unread_count:
                  detail.unreadDelta != null
                    ? Math.max(0, (c.unread_count ?? 0) + detail.unreadDelta)
                    : (c.unread_count ?? 0),
              }
            : c
        )
      );
    }
    window.addEventListener(CONV_PREVIEW_EVENT, onPreview);
    return () => { window.removeEventListener(CONV_PREVIEW_EVENT, onPreview); };
  }, []);

  const isThreadOpen = id != null;

  const isLandlord = user?.role === "landlord";
  const unreadTotal = convs.reduce((n, c) => n + (c.unread_count ?? 0), 0);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return convs;
    return convs.filter((c) =>
      [c.other_user?.name, c.last_message?.body, c.listing?.title]
        .filter((part): part is string => typeof part === "string")
        .some((part) => part.toLowerCase().includes(q))
    );
  }, [convs, query]);

  const sidebar = useMemo(
    () => (
      <div
        data-testid="conversation-list"
        className={cn(
          "flex min-w-0 flex-1 flex-col md:max-w-[372px] md:flex-none border-r border-line bg-card h-full max-h-full overflow-hidden",
          isThreadOpen ? "hidden md:flex" : "animate-fade-in md:animate-none"
        )}
      >
        <div className="shrink-0 px-4 pb-3 pt-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-[22px] font-extrabold tracking-tight text-ink">Tin nhắn</h2>
            {convs.length > 0 ? (
              <span
                data-testid="unread-pill"
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  unreadTotal > 0 ? "bg-plate-tint text-plate" : "bg-tint text-muted"
                )}
              >
                {unreadTotal > 0 ? `${unreadTotal} chưa đọc` : "Đã đọc hết"}
              </span>
            ) : null}
          </div>
          {convs.length > 0 ? (
            <label className="mt-3 flex h-11 items-center gap-2 rounded-[10px] border border-line-strong bg-paper px-3 text-muted transition-colors focus-within:border-plate focus-within:ring-2 focus-within:ring-plate-tint">
              <Search className="size-[18px] flex-none" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => { setQuery(e.target.value); }}
                placeholder="Tìm cuộc trò chuyện"
                aria-label="Tìm cuộc trò chuyện"
                className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
              />
            </label>
          ) : null}
        </div>
        {loading ? (
          <div className="flex flex-col gap-2 p-3">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
        ) : convs.length === 0 ? (
          <EmptyState
            title="Chưa có cuộc trò chuyện nào"
            description={
              isLandlord
                ? "Khi sinh viên nhắn tin về tin đăng của bạn, cuộc trò chuyện sẽ hiện ở đây."
                : "Mở một tin đăng và nhấn Nhắn tin cho chủ nhà để bắt đầu."
            }
            action={
              <Link
                to={isLandlord ? ROUTES.LANDLORD : ROUTES.ROOMS}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-plate px-5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-plate-hover"
              >
                {isLandlord ? "Quản lý tin đăng" : "Tìm phòng ngay"}
              </Link>
            }
            className="py-10"
          />
        ) : visible.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted">Không tìm thấy cuộc trò chuyện nào.</p>
        ) : (
          <ul className="motion-stagger flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2.5 pb-3">
            {visible.map((c) => (
              <li key={c.id}>
                <ConversationListItem
                  conversation={c}
                  active={isThreadOpen && c.id === Number(id)}
                  viewerId={user?.id}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    ),
    [convs, visible, loading, id, isThreadOpen, isLandlord, unreadTotal, query, user?.id]
  );

  return (
    <div
      className={cn(
        "flex flex-col md:flex-row min-h-0 flex-1 bg-card h-full max-h-full overflow-hidden"
      )}
    >
      {sidebar}
      {/* Thread pane on desktop; on mobile the /messages/:id route renders
          inside the same Outlet region when a conversation is selected. */}
      <div
        data-testid="thread-pane"
        className={cn(
          "min-w-0 flex-1 border-l border-line flex flex-col h-full max-h-full min-h-0 overflow-hidden",
          isThreadOpen ? "animate-slide-in-right md:animate-none" : "hidden md:flex"
        )}
      >
        <Outlet />
      </div>
    </div>
  );
}
