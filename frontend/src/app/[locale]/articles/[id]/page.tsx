import ArticlePage from "../../../articles/[id]/page";
import { isLocale } from "@/lib/i18n";
import { notFound } from "next/navigation";

export default async function LocalizedArticlePage({ params }: PageProps<"/[locale]/articles/[id]">) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  return <ArticlePage params={Promise.resolve({ id })} />;
}
