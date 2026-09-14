"use client";

import { create } from "zustand";
import type { AuthenticatedUser } from "@/lib/api/authentication";

type AuthenticationState = {
  accessToken: string | null;
  user: AuthenticatedUser | null;
  setSession: (accessToken: string, user: AuthenticatedUser) => void;
  clearSession: () => void;
};

export const useAuthenticationStore = create<AuthenticationState>((set) => ({
  accessToken: null,
  user: null,
  setSession: (accessToken, user) => set({ accessToken, user }),
  clearSession: () => set({ accessToken: null, user: null }),
}));
