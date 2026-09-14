export type Article = {
  id: number;
  title: string;
  content: string;
  imagePath: string | null;
  publishedAt: string | null;
  category: { name: string; slug: string } | null;
  tags: { name: string; slug: string }[];
};

export type Comment = {
  id: number;
  content: string;
  createdAt: string;
  author: { id: number; email: string };
};

export type ModerationComment = Comment & { articleId: number };

export type Taxonomy = { id: number; name: string; slug: string };
export type ArticleTaxonomyInput = { categorySlug?: string; tagSlugs?: string[] };
export type TaxonomyResource = "categories" | "tags";

export type ArticleFilters = { category?: string; tag?: string; search?: string; sortBy?: "id" | "title" | "publishedAt"; sortDirection?: "ASC" | "DESC"; page?: number };

export type PaginatedArticles = {
  data: Article[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

const browserApiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

async function browserRequest(path: string, options?: RequestInit): Promise<Response | null> {
  try {
    return await fetch(`${browserApiUrl}${path}`, options);
  } catch {
    return null;
  }
}

export async function getPublishedArticles(filters: ArticleFilters = {}): Promise<PaginatedArticles> {
  const emptyResponse: PaginatedArticles = {
    data: [],
    meta: { page: filters.page ?? 1, limit: 12, total: 0, totalPages: 0 },
  };

  try {
    const searchParameters = new URLSearchParams({ limit: "12" });
    if (filters.category) searchParameters.set("category", filters.category);
    if (filters.tag) searchParameters.set("tag", filters.tag);
    if (filters.search) searchParameters.set("search", filters.search);
    if (filters.sortBy) searchParameters.set("sortBy", filters.sortBy);
    if (filters.sortDirection) searchParameters.set("sortDirection", filters.sortDirection);
    if (filters.page) searchParameters.set("page", String(filters.page));

    const response = await fetch(`${process.env.API_URL ?? 'http://localhost:3000'}/articles?${searchParameters}`, {
      next: { revalidate: 60 },
    });
    if (!response.ok) return emptyResponse;
    return await response.json() as PaginatedArticles;
  } catch {
    return emptyResponse;
  }
}

export async function getCategories(): Promise<Taxonomy[]> {
  const response = await browserRequest('/categories');
  return response?.ok ? (await response.json() as Taxonomy[]) : [];
}

export async function getTags(): Promise<Taxonomy[]> {
  const response = await browserRequest('/tags');
  return response?.ok ? (await response.json() as Taxonomy[]) : [];
}

export async function createTaxonomy(
  accessToken: string,
  resource: TaxonomyResource,
  data: Pick<Taxonomy, "name" | "slug">,
): Promise<Taxonomy | null> {
  const response = await browserRequest(`/${resource}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return response?.ok ? (await response.json() as Taxonomy) : null;
}

export async function deleteTaxonomy(accessToken: string, resource: TaxonomyResource, id: number): Promise<boolean> {
  const response = await browserRequest(`/${resource}/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response?.ok ?? false;
}

export async function updateTaxonomy(accessToken: string, resource: TaxonomyResource, id: number, data: Pick<Taxonomy, "name" | "slug">): Promise<Taxonomy | null> {
  const response = await browserRequest(`/${resource}/${id}`, { method: "PUT", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return response?.ok ? await response.json() as Taxonomy : null;
}

export async function getPublishedArticle(id: number): Promise<Article | null> {
  try {
    const response = await fetch(`${process.env.API_URL ?? "http://localhost:3000"}/articles/${id}`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as Article;
  } catch {
    return null;
  }
}

export async function getCommentsByArticle(id: number): Promise<Comment[]> {
  try {
    const response = await fetch(
      `${process.env.API_URL ?? "http://localhost:3000"}/articles/${id}/comments`,
      { next: { revalidate: 60 } },
    );

    if (!response.ok) {
      return [];
    }

    return (await response.json()) as Comment[];
  } catch {
    return [];
  }
}

export async function getCommentsForModeration(accessToken: string): Promise<ModerationComment[]> {
  const response = await browserRequest('/admin/comments', { headers: { Authorization: `Bearer ${accessToken}` } });
  return response?.ok ? await response.json() as ModerationComment[] : [];
}

export async function createComment(
  accessToken: string,
  articleId: number,
  content: string,
): Promise<Comment | null> {
  try {
    const response = await fetch(
      `${browserApiUrl}/articles/${articleId}/comments`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      },
    );

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as Comment;
  } catch {
    return null;
  }
}

export async function updateComment(
  accessToken: string,
  articleId: number,
  commentId: number,
  content: string,
): Promise<Comment | null> {
  try {
    const response = await fetch(
      `${browserApiUrl}/articles/${articleId}/comments/${commentId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      },
    );

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as Comment;
  } catch {
    return null;
  }
}

export async function deleteComment(
  accessToken: string,
  articleId: number,
  commentId: number,
): Promise<boolean> {
  try {
    const response = await fetch(
      `${browserApiUrl}/articles/${articleId}/comments/${commentId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    return response.ok;
  } catch {
    return false;
  }
}

export async function getMyArticles(accessToken: string): Promise<Article[]> {
  const response = await browserRequest('/articles/mine', { headers: { Authorization: `Bearer ${accessToken}` } });
  return response?.ok ? await response.json() as Article[] : [];
}

export async function createArticle(
  accessToken: string,
  title: string,
  content: string,
  taxonomy: ArticleTaxonomyInput = {},
): Promise<Article | null> {
  const response = await browserRequest('/articles', { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ title, content, ...taxonomy }) });
  return response?.ok ? await response.json() as Article : null;
}

export async function uploadArticleImage(accessToken: string, articleId: number, image: File): Promise<Article | null> {
  const formData = new FormData();
  formData.append("image", image);
  const response = await browserRequest(`/articles/${articleId}/image`, { method: "POST", headers: { Authorization: `Bearer ${accessToken}` }, body: formData });
  return response?.ok ? await response.json() as Article : null;
}

export async function updateArticle(
  accessToken: string,
  id: number,
  title: string,
  content: string,
  taxonomy: ArticleTaxonomyInput = {},
): Promise<Article | null> {
  try {
    const response = await fetch(
      `${browserApiUrl}/articles/${id}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, content, ...taxonomy }),
      },
    );

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as Article;
  } catch {
    return null;
  }
}

export async function deleteArticle(accessToken: string, id: number): Promise<boolean> {
  try {
    const response = await fetch(
      `${browserApiUrl}/articles/${id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    return response.ok;
  } catch {
    return false;
  }
}

export async function setArticlePublication(accessToken: string, id: number, published: boolean): Promise<Article | null> {
  const response = await browserRequest(`/articles/${id}/publication`, { method: "PATCH", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ published }) });
  return response?.ok ? await response.json() as Article : null;
}
