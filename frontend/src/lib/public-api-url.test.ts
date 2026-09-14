import { describe, expect, it } from "vitest";
import { getPublicApiUrl } from "./public-api-url";

describe("getPublicApiUrl", () => {
  it("uses the browser-facing API URL when it is configured", () => {
    expect(getPublicApiUrl("http://localhost:3000")).toBe("http://localhost:3000");
  });

  it("uses localhost as the development fallback", () => {
    expect(getPublicApiUrl(undefined)).toBe("http://localhost:3000");
  });
});
