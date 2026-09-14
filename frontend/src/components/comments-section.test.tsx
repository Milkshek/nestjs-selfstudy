import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CommentsSection } from "./comments-section";
import { useAuthenticationStore } from "@/stores/authentication-store";
import { createComment } from "@/lib/api/articles";

vi.mock("next/navigation", () => ({ usePathname: () => "/fr/articles/1" }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@/lib/api/articles", () => ({
  createComment: vi.fn(),
  deleteComment: vi.fn(),
  updateComment: vi.fn(),
}));

describe("CommentsSection", () => {
  afterEach(() => {
    useAuthenticationStore.setState({ accessToken: null, user: null });
    vi.clearAllMocks();
  });

  it("publishes and displays a comment from the authenticated user", async () => {
    useAuthenticationStore.setState({
      accessToken: "access-token",
      user: { id: 2, email: "author@example.com", role: "USER" },
    });
    vi.mocked(createComment).mockResolvedValue({
      id: 8,
      content: "Useful article",
      createdAt: "2026-09-14T08:00:00.000Z",
      author: { id: 2, email: "author@example.com" },
    });

    render(<CommentsSection articleId={4} initialComments={[]} />);
    fireEvent.change(screen.getByLabelText("Ajouter un commentaire"), { target: { value: "Useful article" } });
    fireEvent.click(screen.getByRole("button", { name: "Publier le commentaire" }));

    await waitFor(() => expect(createComment).toHaveBeenCalledWith("access-token", 4, "Useful article"));
    expect(screen.getByText("Useful article")).toBeTruthy();
  });
});
