import { errMessage, errStatus } from "@/shared/api/axiosClient";

export function aiErrorMessage(error: unknown): string {
  if (errStatus(error) === null) {
    return "Không kết nối được dịch vụ AI. Bạn kiểm tra kết nối và thử lại nhé.";
  }
  return errMessage(error, "Không thể xử lý yêu cầu AI lúc này. Bạn thử lại sau nhé.");
}
