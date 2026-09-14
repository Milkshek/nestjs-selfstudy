export function getPublicApiUrl(configuredUrl: string | undefined = process.env.NEXT_PUBLIC_API_URL): string {
  return configuredUrl ?? "http://localhost:3000";
}
