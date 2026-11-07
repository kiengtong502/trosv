import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowDown } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { useConversationData } from "@/hooks/useConversationData";
import { useConversationRealtime } from "@/hooks/useConversationRealtime";
import { useConversationMessages } from "@/hooks/useConversationMessages";
import { useStickToBottom } from "@/hooks/useStickToBottom";
import { CONV_PREVIEW_EVENT, type ConvPreviewDetail } from "@/constants/events";
import { getEcho } from "@/api/echo";
import { Button } from "@/ui/button";
import { Skeleton } from "@/ui/badge";
import { EmptyState } from "@/ui/empty-state";
import { toast } from "@/ui/toast";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useAuth } from "@/context/AuthContext";
import { GateScreen, MessagesGateIllustration } from "@/components/gates";
import { Footer } from "@/components/shell";
import { ThreadRoomCard } from "@/pages/messages/ThreadRoomCard";
import { TypingDots } from "@/pages/messages/TypingDots";
import { Composer, MESSAGE_MAX } from "@/pages/messages/thread/Composer";
import { MessageRow } from "@/pages/messages/thread/MessageRow";
import { ThreadHeader } from "@/pages/messages/thread/ThreadHeader";
import { layoutRow } from "@/pages/messages/thread/threadLayout";
import { useAttachment } from "@/pages/messages/thread/useAttachment";
import type { Message } from "@/types/api";

/** On opening a thread, only the last few messages ease in (one after another). */
const OPEN_STAGGER_COUNT = 8;

/** Tells the conversation list to refresh its preview line for this thread. */
function announcePreview(conversationId: number, msg: Message, unreadDelta?: number): void {
  window.dispatchEvent(
    new CustomEvent<ConvPreviewDetail>(CONV_PREVIEW_EVENT, {
      detail: {
        conversationId,
        lastMessage: msg.body ?? msg.attachment_name ?? "",
        lastMessageAt: msg.created_at,
        ...(unreadDelta === undefined ? {} : { unreadDelta }),
      },
    }),
  );
}

/** Messages present when the thread first loaded never animate; only later ones do. */
interface Baseline {
  convId: string;
  maxId: number;
  tail: number[];
}

function Thread({ id }: { id: string }) {
  const { user } = useAuth();
  const data = useConversationData(id);
  const realtime = useConversationRealtime(id, data.setMessages, data.lastIdRef, (msg) => {
    announcePreview(Number(id), msg);
  });
  const actions = useConversationMessages(id, data.setMessages, data.lastIdRef);
  /* The thread element's ref is owned here (not by a hook) so attaching
     it and passing it down never touches a hook-returned ref in render. */
  const threadRef = useRef<HTMLDivElement>(null);
  const isReady = data.loaded && Boolean(data.conversation);
  const stick = useStickToBottom(threadRef, data.messages, isReady, id);

  const setThreadNode = useCallback(
    (node: HTMLDivElement | null) => {
      (threadRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      if (node) {
        stick.notifyMounted(node);
      }
    },
    [stick],
  );

  const [draft, setDraft] = useState("");
  const [atBottom, setAtBottom] = useState(true);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const attachment = useAttachment();

  useDocumentTitle(
    data.conversation
      ? `${data.conversation.other_user?.name ?? "Tin nhắn"} · TROSV`
      : "Tin nhắn · TROSV",
  );

  /* Whisper typing while the composer has text. */
  useEffect(() => {
    const e = getEcho();
    const chan = e?.private(`conversation.${id}`);
    if (!chan) return;

    const ch = chan as unknown as { whisper: (ev: string, data: unknown) => void };
    ch.whisper("typing", { user_id: -1 });
  }, [draft, id]);

  const [baseline, setBaseline] = useState<Baseline | null>(null);
  if (isReady && (baseline === null || baseline.convId !== id)) {
    setBaseline({
      convId: id,
      maxId: data.messages.reduce((max, msg) => Math.max(max, msg.id), 0),
      tail: data.messages.slice(-OPEN_STAGGER_COUNT).map((msg) => msg.id),
    });
  }
  const current = baseline?.convId === id ? baseline : null;

  if (!data.loaded) {
    return (
      <div className="flex flex-col gap-3 p-4">
        <Skeleton className="h-14" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }
  if (!data.conversation) {
    return (
      <EmptyState
        title="Không tìm thấy hội thoại"
        description="Hội thoại này không tồn tại hoặc bạn không có quyền xem."
        action={
          <Button variant="outline" asChild>
            <Link to={ROUTES.MESSAGES}>Về tin nhắn</Link>
          </Button>
        }
        className="min-h-[50vh]"
      />
    );
  }

  const otherUser = data.conversation.other_user;
  /* Suggested first questions: students talking to a landlord who has not replied yet. */
  const showQuickReplies =
    user?.role === "student" &&
    otherUser?.role === "landlord" &&
    !data.messages.some((m) => m.sender_id !== user.id);

  async function send(): Promise<void> {
    const text = draft.trim();
    if (!text && !attachment.file) return;
    if (text.length > MESSAGE_MAX) {
      toast(`Tin nhắn tối đa ${MESSAGE_MAX} ký tự.`);
      return;
    }
    const msg = await actions.send(text, attachment.file);
    if (msg) {
      setDraft("");
      attachment.remove();
      setAtBottom(true);
      stick.scrollToBottom();
      announcePreview(Number(id), msg, 0);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col h-full max-h-full overflow-hidden bg-card">
      <ThreadHeader otherUser={otherUser} />

      {/* Messages: day separators + grouped bubbles */}
      <div
        ref={setThreadNode}
        onScroll={() => {
          setAtBottom(stick.handleScroll());
        }}
        className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-4 bg-paper/30"
        data-testid="thread"
      >
        {data.conversation.listing ? <ThreadRoomCard listing={data.conversation.listing} /> : null}
        {data.messages.map((m, i) => (
          <MessageRow
            key={m.id}
            msg={m}
            layout={layoutRow(data.messages, i)}
            isNew={current !== null && m.id > current.maxId}
            tailIndex={current?.tail.indexOf(m.id) ?? -1}
            currentUserId={user?.id}
            onReact={(mm, e) => {
              void actions.react(mm, e, user?.id ?? m.sender_id);
            }}
            onUnsend={(mm) => {
              void actions.remove(mm, "unsent");
            }}
            onDeleteSelf={(mm) => {
              void actions.remove(mm, "self");
            }}
          />
        ))}
        {realtime.otherTyping ? <TypingDots /> : null}
      </div>

      {/* Scroll-to-latest */}
      {!atBottom ? (
        <button
          type="button"
          onClick={() => {
            stick.scrollToBottom();
          }}
          aria-label="Xuống tin nhắn mới nhất"
          className={
            "animate-pop-in self-center flex items-center gap-1.5 -mt-10 mb-2 z-10 rounded-full " +
            "border border-line bg-card px-3 py-1.5 text-xs font-medium text-ink shadow-sm transition hover:bg-tint"
          }
        >
          <ArrowDown className="size-3.5" aria-hidden />
          <span>Mới nhất</span>
        </button>
      ) : null}

      <Composer
        draft={draft}
        onDraftChange={(value) => {
          setDraft(value);
          realtime.setOtherTyping(false);
        }}
        onSend={() => void send()}
        sending={actions.sending}
        error={actions.error}
        attachment={attachment}
        textRef={textRef}
        showQuickReplies={showQuickReplies}
      />
    </div>
  );
}

export default function ConversationDetail() {
  const { id } = useParams();
  const { user, loading } = useAuth();
  useDocumentTitle("Tin nhắn · TROSV");
  if (loading) return null;
  /* Logged-out guests see the messages gate (SPEC), not a login
     redirect — the route is intentionally left outside ProtectedRoute. */
  if (!user) {
    return (
      <div className="flex flex-1 flex-col bg-card">
        <GateScreen
          testId="messages-gate"
          title="Trung tâm tin nhắn"
          description={
            "Mọi cuộc trò chuyện với chủ nhà và sinh viên đều ở đây " +
            "để bạn không bỏ lỡ tin nào. Đăng nhập để bắt đầu nhắn tin."
          }
          illustration={<MessagesGateIllustration />}
        />
        <div className="mt-auto">
          <Footer />
        </div>
      </div>
    );
  }
  if (id == null) return null;
  return <Thread id={id} />;
}
