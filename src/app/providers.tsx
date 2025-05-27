"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import PendingPaymentCheck from "@/components/PendingPaymentCheck";

export default function ClientAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <PendingPaymentCheck />
      {children}
    </AuthProvider>
  );
}
