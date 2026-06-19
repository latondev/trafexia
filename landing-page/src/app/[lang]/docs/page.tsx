import { redirect } from "next/navigation";
import { Locale } from "@/lib/translations";

interface PageProps {
  params: Promise<{ lang: string }>;
}

export default async function DocsPage({ params }: PageProps) {
  const { lang } = (await params) as { lang: Locale };
  redirect(`/${lang}/docs/getting-started`);
}
