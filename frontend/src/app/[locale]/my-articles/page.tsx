import MyArticlesPage from "../../my-articles/page";
import { isLocale } from "@/lib/i18n";
import { notFound } from "next/navigation";

export default async function LocalizedMyArticlesPage({ params }: PageProps<"/[locale]/my-articles">) {
  if (!isLocale((await params).locale)) notFound();
  return <MyArticlesPage />;
}
