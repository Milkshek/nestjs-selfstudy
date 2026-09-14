import { describe, expect, it } from "vitest";
import { formatDateTime } from "./date";

describe("formatDateTime", () => {
  it("formats an ISO date for the Paris timezone", () => {
    expect(formatDateTime("2026-09-10T09:00:00.000Z")).toBe("10 septembre 2026 à 11:00");
  });
});
