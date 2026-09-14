import { describe, expect, it } from "vitest";
import { getRegistrationValidationError } from "./registration";

describe("getRegistrationValidationError", () => {
  it("rejects different passwords before calling the API", () => {
    expect(getRegistrationValidationError("secret", "different", "fr")).toBe(
      "Les mots de passe ne correspondent pas.",
    );
  });

  it("accepts matching passwords", () => {
    expect(getRegistrationValidationError("secret", "secret", "en")).toBeNull();
  });
});
