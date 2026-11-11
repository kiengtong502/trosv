import api from "@/shared/api/axiosClient";
import { envelope } from "@/shared/api/envelope";
import type { AuthResponse, RegisterPayload, User } from "@/shared/types/api";

// API_CONTRACT §4 - "Xác thực và hồ sơ"
export const login = (email: string, password: string): Promise<AuthResponse> =>
  api.post("/login", { email, password }).then((r) => envelope<AuthResponse>(r).data);

export const register = (payload: RegisterPayload): Promise<AuthResponse> =>
  api.post("/register", payload).then((r) => envelope<AuthResponse>(r).data);

export const logout = (): Promise<unknown> => api.post("/logout");

export const me = (): Promise<User> => api.get("/me").then((r) => envelope<User>(r).data);

export const updateProfile = (payload: Partial<User>): Promise<User> =>
  api.put("/profile", payload).then((r) => envelope<User>(r).data);
