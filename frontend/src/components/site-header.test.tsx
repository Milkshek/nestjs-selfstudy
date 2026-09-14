import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SiteHeader } from "./site-header";
import { useAuthenticationStore } from "@/stores/authentication-store";

vi.mock("next/navigation", () => ({ usePathname: () => "/fr" }));
vi.mock("@/lib/api/authentication", () => ({ getCurrentUser: vi.fn(), login: vi.fn(), logout: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

describe("SiteHeader", () => {
  afterEach(() => {
    useAuthenticationStore.setState({ accessToken: null, user: null });
  });

  it("labels the locale link with the destination language", () => {
    render(<SiteHeader locale="fr" />);

    expect(screen.getByRole("link", { name: "EN" }).getAttribute("href")).toBe("/en");
  });
});
