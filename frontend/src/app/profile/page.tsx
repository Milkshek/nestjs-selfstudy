"use client";
import { FormEvent, useEffect, useState } from "react";
import { changePassword, logout } from "@/lib/api/authentication";
import { useAuthenticationStore } from "@/stores/authentication-store";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

export default function ProfilePage() {
  const { accessToken, user, clearSession } = useAuthenticationStore(); const router = useRouter(); const locale = usePathname().startsWith("/en") ? "en" : "fr";
  const [currentPassword, setCurrentPassword] = useState(""); const [newPassword, setNewPassword] = useState("");
  useEffect(() => { if (!accessToken || !user) router.replace(`/${locale}`); }, [accessToken, locale, router, user]);
  if (!accessToken || !user) return null;
  const authenticatedAccessToken = accessToken;
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!(await changePassword(authenticatedAccessToken, currentPassword, newPassword))) { toast.error("Mot de passe actuel invalide."); return; } await logout(); clearSession(); toast.success("Mot de passe modifié. Reconnecte-toi."); router.push(`/${locale}`); }
  return <main className="mx-auto max-w-md p-8"><h1 className="text-3xl font-bold">Mon profil</h1><p className="mt-2 text-stone-600">{user.email}</p><form className="mt-8 space-y-4" onSubmit={submit}><input className="w-full rounded border p-2" required type="password" placeholder="Mot de passe actuel" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /><input className="w-full rounded border p-2" minLength={12} required type="password" placeholder="Nouveau mot de passe" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /><button className="rounded bg-stone-900 px-4 py-2 text-white" type="submit">Modifier le mot de passe</button></form></main>;
}
