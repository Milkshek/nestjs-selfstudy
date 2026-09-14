import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  if (!isLocale((await params).locale)) notFound();
  return children;
}
