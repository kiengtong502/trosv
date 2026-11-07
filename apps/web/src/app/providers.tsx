import type React from "react";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/ui/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster />
    </AuthProvider>
  );
}
