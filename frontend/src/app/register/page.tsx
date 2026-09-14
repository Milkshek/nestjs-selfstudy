"use client";

import { FormEvent, useState } from "react";
import { getCurrentUser, login, register } from "@/lib/api/authentication";
import { getRegistrationValidationError } from "@/lib/registration";
import { useAuthenticationStore } from "@/stores/authentication-store";
import { toast } from "sonner";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

const inputClassName =
  "w-full rounded border border-stone-300 bg-white px-3 py-2 text-stone-900 placeholder:text-stone-500 focus:border-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-200";
const primaryCtaClassName =
  "cursor-pointer rounded bg-stone-900 px-4 py-2 font-medium text-white transition hover:bg-stone-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60";

export default function RegisterPage() {
  const pathname = usePathname();
  const locale = pathname.startsWith("/en") ? "en" : "fr";
  const isEnglish = locale === "en";
  const router = useRouter();
  const setSession = useAuthenticationStore((state) => state.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = getRegistrationValidationError(password, passwordConfirmation, locale);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsSubmitting(true);
    const registered = await register(email, password);

    if (!registered) {
      toast.error(isEnglish ? "Unable to create the account." : "Impossible de créer le compte.");
      setIsSubmitting(false);
      return;
    }

    const accessToken = await login(email, password);
    const user = accessToken ? await getCurrentUser(accessToken) : null;

    if (!accessToken || !user) {
      toast.error(isEnglish ? "Account created. Please log in." : "Compte créé. Connecte-toi.");
      router.push(`/${locale}`);
      return;
    }

    setSession(accessToken, user);
    toast.success(isEnglish ? "Your account is ready." : "Ton compte est prêt.");
    router.push(`/${locale}/my-articles`);
  }

  return (
    <>
      <SiteHeader locale={locale} />
      <main className="mx-auto max-w-md px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">
          {isEnglish ? "Create your account" : "Créer un compte"}
        </h1>
        <p className="mt-3 text-stone-600">
          {isEnglish ? "Publish and manage your articles." : "Publie et gère tes articles."}
        </p>

        <form className="mt-8 space-y-5" onSubmit={submit}>
          <label className="block space-y-2">
            <span className="font-medium">{isEnglish ? "Email" : "E-mail"}</span>
            <input
              className={inputClassName}
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="block space-y-2">
            <span className="font-medium">{isEnglish ? "Password" : "Mot de passe"}</span>
            <input
              className={inputClassName}
              minLength={8}
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <label className="block space-y-2">
            <span className="font-medium">{isEnglish ? "Confirm password" : "Confirmer le mot de passe"}</span>
            <input
              className={inputClassName}
              minLength={8}
              required
              type="password"
              value={passwordConfirmation}
              onChange={(event) => setPasswordConfirmation(event.target.value)}
            />
          </label>
          <button className={primaryCtaClassName} disabled={isSubmitting} type="submit">
            {isSubmitting
              ? isEnglish
                ? "Creating..."
                : "Création..."
              : isEnglish
                ? "Create account"
                : "Créer mon compte"}
          </button>
        </form>

        <p className="mt-6 text-sm text-stone-600">
          {isEnglish ? "Already have an account?" : "Déjà un compte ?"}{" "}
          <Link className="cursor-pointer font-medium text-amber-700 hover:text-amber-900 hover:underline" href={`/${locale}`}>
            {isEnglish ? "Log in" : "Se connecter"}
          </Link>
        </p>
      </main>
    </>
  );
}
