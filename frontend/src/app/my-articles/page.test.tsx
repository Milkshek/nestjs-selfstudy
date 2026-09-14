import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MyArticlesPage from "./page";
import { useAuthenticationStore } from "@/stores/authentication-store";
import { getCategories, getMyArticles, getTags, type Article } from "@/lib/api/articles";

vi.mock("next/navigation", () => ({ usePathname: () => "/fr/my-articles" }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@/lib/api/articles", () => ({
  createArticle: vi.fn(),
  deleteArticle: vi.fn(),
  getMyArticles: vi.fn(),
  getCategories: vi.fn(),
  getTags: vi.fn(),
  setArticlePublication: vi.fn(),
  updateArticle: vi.fn(),
  uploadArticleImage: vi.fn(),
}));

describe("MyArticlesPage", () => {
  beforeEach(() => {
    useAuthenticationStore.setState({
      accessToken: "access-token",
      user: { id: 1, email: "author@example.com", role: "USER" },
    });
    vi.mocked(getMyArticles).mockResolvedValue([]);
    vi.mocked(getCategories).mockResolvedValue([]);
    vi.mocked(getTags).mockResolvedValue([]);
  });

  it("shows an explicit image upload control in the article form", () => {
    render(<MyArticlesPage />);

    expect(screen.getByText("Image de couverture")).toBeTruthy();
    expect(screen.getByLabelText("Ajouter une image")).toBeTruthy();
  });

  it("shows an image upload control while editing an article", async () => {
    const article: Article = {
      id: 1,
      title: "Article existant",
      content: "Contenu",
      imagePath: null,
      publishedAt: null,
      category: null,
      tags: [],
    };
    vi.mocked(getMyArticles).mockResolvedValue([article]);

    render(<MyArticlesPage />);

    fireEvent.click(await screen.findByRole("button", { name: "Modifier" }));

    expect(screen.getByLabelText("Changer l’image")).toBeTruthy();
  });
});
