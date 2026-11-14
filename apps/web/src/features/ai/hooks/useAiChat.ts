import { useState } from "react";
import { useAuth } from "@/features/auth/context/AuthContext";
import type { AiChatTurn } from "@/shared/types/api";
import { aiChat } from "../api/aiApi";
import { aiErrorMessage } from "../lib/aiErrorMessage";

const WELCOME: AiChatTurn = {
  role: "assistant",
  content:
    "Chào bạn. Mình là trợ lý AI của TROSV. Bạn hỏi mình về giá phòng, khu vực hay phòng trọ nhé.",
};

export function useAiChat(listingId: number | null) {
  const { user } = useAuth();
  const [turns, setTurns] = useState<AiChatTurn[]>([WELCOME]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  async function send(): Promise<void> {
    const text = draft.trim();
    if (!text || busy) return;
    if (!user) {
      setTurns((cur) => [
        ...cur,
        { role: "assistant", content: "Bạn đăng nhập để sử dụng trợ lý AI nhé." },
      ]);
      return;
    }
    setDraft("");
    const history = turns.filter((turn) => turn !== WELCOME);
    setTurns((cur) => [...cur, { role: "user", content: text }]);
    setBusy(true);
    try {
      const { reply } = await aiChat(text, history, listingId);
      setTurns((cur) => [
        ...cur,
        { role: "assistant", content: reply || "AI chưa trả về câu trả lời. Bạn thử lại nhé." },
      ]);
    } catch (error) {
      setTurns((cur) => [...cur, { role: "assistant", content: aiErrorMessage(error) }]);
    } finally {
      setBusy(false);
    }
  }

  return { turns, draft, setDraft, busy, send };
}
