import type React from "react";
import { AuthProvider } from "@/features/auth/context/AuthContext";
import { Toaster } from "@/shared/ui/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster />
    </AuthProvider>
  );
}
