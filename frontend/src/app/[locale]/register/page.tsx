import RegisterPage from "../../register/page";
import { isLocale } from "@/lib/i18n";
import { notFound } from "next/navigation";

export default async function LocalizedRegisterPage({ params }: PageProps<"/[locale]/register">) {
  if (!isLocale((await params).locale)) notFound();
  return <RegisterPage />;
}
