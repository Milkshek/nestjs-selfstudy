import ProfilePage from "../../profile/page";
import { isLocale } from "@/lib/i18n";
import { notFound } from "next/navigation";
export default async function LocalizedProfilePage({ params }: PageProps<"/[locale]/profile">) { if (!isLocale((await params).locale)) notFound(); return <ProfilePage />; }
