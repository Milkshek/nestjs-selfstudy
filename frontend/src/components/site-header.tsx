"use client";

import { FormEvent, useState } from "react";
import { getCurrentUser, login, logout } from "@/lib/api/authentication";
import { useAuthenticationStore } from "@/stores/authentication-store";
import { toast } from "sonner";
import { messages, type Locale } from "@/lib/i18n";
import Link from "next/link";
import { usePathname } from "next/navigation";

const inputClassName =
  "rounded border border-stone-300 bg-white px-3 py-2 text-stone-900 placeholder:text-stone-500 focus:border-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-200";
const neutralCtaClassName =
  "cursor-pointer rounded px-3 py-2 transition hover:bg-stone-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 active:scale-95";
const primaryCtaClassName =
  "cursor-pointer rounded bg-stone-900 px-4 py-2 text-white transition hover:bg-stone-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 active:scale-95";
const secondaryCtaClassName =
  "cursor-pointer rounded px-3 py-2 text-amber-700 transition hover:bg-amber-50 hover:text-amber-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 active:scale-95";

export function SiteHeader({ locale = "fr" }: { locale?: Locale }) {
  const message = messages[locale];
  const isEnglish = locale === "en";
  const pathname = usePathname();
  const alternateLocale = locale === "fr" ? "en" : "fr";
  const localizedPath = pathname.replace(/^\/(fr|en)(?=\/|$)/, `/${alternateLocale}`);
  const { user, setSession, clearSession } = useAuthenticationStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [open, setOpen] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const token = await login(email, password);

    if (!token) {
      toast.error(isEnglish ? "Invalid credentials." : "Identifiants invalides.");
      return;
    }

    const currentUser = await getCurrentUser(token);

    if (currentUser) {
      setSession(token, currentUser);
      toast.success(isEnglish ? "You are logged in." : "Connexion réussie.");
    } else {
      toast.error(isEnglish ? "Unable to restore the session." : "Impossible de rétablir la session.");
      return;
    }

    setOpen(false);
  }

  function logoutUser() {
    void logout();
    clearSession();
    toast.success(isEnglish ? "You are logged out." : "Déconnexion réussie.");
  }

  return (
    <header className="border-b border-stone-200 px-6 py-5">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <strong className="text-2xl">BlogNest</strong>

        {user ? (
          <div className="flex items-center gap-3">
            <a className={neutralCtaClassName} href={`/${locale}/my-articles`}>
              {message.myArticles.title}
            </a>
            <span>{user.email}</span>
            <Link className={neutralCtaClassName} href={`/${locale}/profile`}>{locale === "en" ? "Profile" : "Profil"}</Link>
            {user.role === "ADMIN" && <Link className={neutralCtaClassName} href={`/${locale}/admin`}>Admin</Link>}
            <button className={secondaryCtaClassName} type="button" onClick={logoutUser}>
              {isEnglish ? "Log out" : "Se déconnecter"}
            </button>
          </div>
        ) : (
          <button
            aria-expanded={open}
            className={neutralCtaClassName}
            type="button"
            onClick={() => setOpen((current) => !current)}
          >
            {message.login}
          </button>
        )}
        <Link className={neutralCtaClassName} href={localizedPath || `/${alternateLocale}`}>
          {alternateLocale.toUpperCase()}
        </Link>
      </div>

      {open && (
        <form className="mx-auto mt-4 flex max-w-6xl gap-2" onSubmit={submit}>
          <input
            className={inputClassName}
            required
            type="email"
            placeholder={isEnglish ? "Email" : "E-mail"}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <input
            className={inputClassName}
            required
            type="password"
            placeholder={isEnglish ? "Password" : "Mot de passe"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button className={primaryCtaClassName} type="submit">
            {isEnglish ? "Log in" : "Connexion"}
          </button>
          <Link className={secondaryCtaClassName} href={`/${locale}/register`} onClick={() => setOpen(false)}>
            {isEnglish ? "Register" : "Inscription"}
          </Link>
        </form>
      )}
    </header>
  );
}
