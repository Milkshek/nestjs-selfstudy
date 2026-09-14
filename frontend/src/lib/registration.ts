import type { Locale } from "./i18n";

export function getRegistrationValidationError(
  password: string,
  passwordConfirmation: string,
  locale: Locale,
): string | null {
  if (password === passwordConfirmation) return null;

  return locale === "en" ? "Passwords do not match." : "Les mots de passe ne correspondent pas.";
}
