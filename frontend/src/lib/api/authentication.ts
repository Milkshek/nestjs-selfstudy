const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export type AuthenticatedUser = { id: number; email: string; role: "USER" | "ADMIN" };

async function request(path: string, options?: RequestInit): Promise<Response | null> {
  try {
    return await fetch(`${apiUrl}${path}`, { ...options, credentials: "include" });
  } catch {
    return null;
  }
}

export async function refreshAccessToken(): Promise<string | null> {
  const response = await request("/authentication/refresh", { method: "POST" });
  if (!response?.ok) return null;
  return (await response.json() as { accessToken: string }).accessToken;
}

export async function getCurrentUser(accessToken: string): Promise<AuthenticatedUser | null> {
  const response = await request("/authentication/me", { headers: { Authorization: `Bearer ${accessToken}` } });
  return response?.ok ? await response.json() as AuthenticatedUser : null;
}

export async function login(email: string, password: string): Promise<string | null> {
  const response = await request("/authentication/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
  return response?.ok ? (await response.json() as { accessToken: string }).accessToken : null;
}

export async function register(email: string, password: string): Promise<boolean> {
  const response = await request("/authentication/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
  return response?.ok ?? false;
}

export async function logout(): Promise<void> { await request("/authentication/logout", { method: "POST" }); }

export async function changePassword(accessToken: string, currentPassword: string, newPassword: string): Promise<boolean> {
  const response = await request("/authentication/password", { method: "PATCH", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword }) });
  return response?.ok ?? false;
}
