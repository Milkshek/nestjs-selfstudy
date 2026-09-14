import { describe, expect, it } from "vitest";
import { isLocale, locales, messages } from "./i18n";

describe("i18n", () => {
  it("supports French and English only", () => {
    expect(locales).toEqual(["fr", "en"]);
    expect(isLocale("fr")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("de")).toBe(false);
  });

  it("provides a translated article action for each locale", () => {
    expect(messages.fr.read).toBe("Lire l’article");
    expect(messages.en.read).toBe("Read article");
  });
});
