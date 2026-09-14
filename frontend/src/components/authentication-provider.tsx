"use client";

import { useEffect } from "react";
import { getCurrentUser, refreshAccessToken } from "@/lib/api/authentication";
import { useAuthenticationStore } from "@/stores/authentication-store";

export function AuthenticationProvider({ children }: { children: React.ReactNode }) {
  const setSession = useAuthenticationStore((state) => state.setSession);

  useEffect(() => {
    void (async () => {
      try {
        const accessToken = await refreshAccessToken();
        if (!accessToken) return;
        const user = await getCurrentUser(accessToken);
        if (user) setSession(accessToken, user);
      } catch {
        // A transient API failure leaves the visitor anonymous.
      }
    })();
  }, [setSession]);

  return children;
}
