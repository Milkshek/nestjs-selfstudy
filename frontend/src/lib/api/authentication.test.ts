import { afterEach, describe, expect, it, vi } from "vitest";
import { changePassword, login, refreshAccessToken } from "./authentication";

describe("changePassword", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("sends the current and new passwords with the access token", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await changePassword("access-token", "current-password", "new-password");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/authentication/password",
      expect.objectContaining({ method: "PATCH", headers: { Authorization: "Bearer access-token", "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: "current-password", newPassword: "new-password" }) }),
    );
  });
});

describe("refreshAccessToken", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("treats an unavailable API as an anonymous session", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    await expect(refreshAccessToken()).resolves.toBeNull();
  });
});

describe("login", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("treats an unavailable API as a failed login", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    await expect(login("reader@example.com", "development-password")).resolves.toBeNull();
  });
});
