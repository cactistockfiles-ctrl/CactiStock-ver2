import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import GoogleAuthSuccess from "@/components/GoogleAuthSuccess";

export default function LocaleGoogleAuthSuccessPage({
  params,
}: {
  params: { locale: string };
}) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  return <GoogleAuthSuccess locale={params.locale} />;
}
