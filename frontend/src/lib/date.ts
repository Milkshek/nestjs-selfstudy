export function formatDateTime(value: string, locale = "fr"): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", {
    dateStyle: "long", timeStyle: "short", timeZone: "Europe/Paris",
  }).format(new Date(value));
}
