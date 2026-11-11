import { useAuth } from "@/features/auth/context/AuthContext";
import { GateScreen, MessagesGateIllustration } from "@/shared/layout/gates";
import { Footer } from "@/shared/layout/footer";
import MessagesList from "@/features/messaging/pages/MessagesList";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";

export default function Messages() {
  const { user, loading } = useAuth();
  useDocumentTitle("Tin nhắn · TROSV");

  if (loading) return null;
  if (!user) {
    return (
      <div className="flex flex-1 flex-col bg-card">
        <GateScreen
          testId="messages-gate"
          title="Trung tâm tin nhắn"
          description="Mọi cuộc trò chuyện với chủ nhà và sinh viên đều ở đây để bạn không bỏ lỡ tin nào. Đăng nhập để bắt đầu nhắn tin."
          illustration={<MessagesGateIllustration />}
        />
        <div className="mt-auto">
          <Footer />
        </div>
      </div>
    );
  }
  return <MessagesList />;
}
