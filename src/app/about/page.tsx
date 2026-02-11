import { getSiteSettings } from "@/lib/site/settings.service";
import AboutPageClient from "@/components/about/AboutPageClient";

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const settings = await getSiteSettings();

  return <AboutPageClient settings={settings} />;
}
