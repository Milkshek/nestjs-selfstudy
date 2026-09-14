import AdminPage from "../../admin/page";
import { isLocale } from "@/lib/i18n";
import { notFound } from "next/navigation";

export default async function LocalizedAdminPage({ params }: PageProps<"/[locale]/admin">) {
  if (!isLocale((await params).locale)) notFound();
  return <AdminPage />;
}
