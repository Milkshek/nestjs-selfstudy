import { afterEach, describe, expect, it, vi } from "vitest";
import { createArticle, createComment, createTaxonomy, getPublishedArticles } from "./articles";

describe("createComment", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("sends the content and access token to the article comments endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 1 }), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    await createComment("access-token", 4, "Useful article");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/articles/4/comments",
      expect.objectContaining({
        method: "POST",
        headers: { Authorization: "Bearer access-token", "Content-Type": "application/json" },
        body: JSON.stringify({ content: "Useful article" }),
      }),
    );
  });
});

describe("getPublishedArticles", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("sends an active category filter to the published articles endpoint", async () => {
    const paginatedResponse = { data: [], meta: { page: 1, limit: 12, total: 0, totalPages: 0 } };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(paginatedResponse), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("API_URL", "http://localhost:3000");

    await expect(getPublishedArticles({ category: "nestjs" })).resolves.toEqual(paginatedResponse);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/articles?limit=12&category=nestjs",
      expect.objectContaining({ next: { revalidate: 60 } }),
    );
  });

  it("sends search, sorting, and page parameters", async () => {
    const paginatedResponse = { data: [], meta: { page: 2, limit: 12, total: 13, totalPages: 2 } };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(paginatedResponse), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("API_URL", "http://localhost:3000");

    await expect(getPublishedArticles({ search: "Nest", sortBy: "title", sortDirection: "ASC", page: 2 })).resolves.toEqual(paginatedResponse);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/articles?limit=12&search=Nest&sortBy=title&sortDirection=ASC&page=2",
      expect.anything(),
    );
  });
});

describe("createArticle", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("sends the selected category and tags with a new article", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 1 }), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    await createArticle("access-token", "A title", "Content", {
      categorySlug: "nestjs",
      tagSlugs: ["typescript", "testing"],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/articles",
      expect.objectContaining({
        body: JSON.stringify({
          title: "A title",
          content: "Content",
          categorySlug: "nestjs",
          tagSlugs: ["typescript", "testing"],
        }),
      }),
    );
  });
});

describe("createTaxonomy", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("sends an authenticated category creation request", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 1 }), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    await createTaxonomy("access-token", "categories", { name: "Testing", slug: "testing" });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/categories",
      expect.objectContaining({
        method: "POST",
        headers: { Authorization: "Bearer access-token", "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Testing", slug: "testing" }),
      }),
    );
  });
});
