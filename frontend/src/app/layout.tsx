import type { Metadata } from "next";
import "./globals.css";
import { AuthenticationProvider } from "@/components/authentication-provider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "BlogNest",
  description: "Le journal technique BlogNest",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html className="h-full antialiased" lang="fr">
      <body className="min-h-full flex flex-col">
        <AuthenticationProvider>{children}</AuthenticationProvider>
        <Toaster richColors />
      </body>
    </html>
  );
}
