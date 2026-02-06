import { getSiteSettings } from "@/lib/site/settings.service";
import AdminHeroEditor from "@/components/admin/AdminHeroEditor";
import AdminFeaturedEditor from "@/components/admin/AdminFeaturedEditor";
import { Palette } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CustomizationPage() {
  const settings = await getSiteSettings();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-harp-brown flex items-center gap-3">
          <Palette size={28} />
          Personnalisation
        </h1>
        <p className="text-gray-500 mt-1">
          Configurez l&apos;apparence de votre site
        </p>
      </div>

      {/* Hero Section */}
      <div className="bg-gray-50 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-harp-brown mb-4">
          Section Hero
        </h2>
        <AdminHeroEditor initial={settings} />
      </div>

      {/* Featured Product Section */}
      <div className="bg-gray-50 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-harp-brown mb-4">
          Section Produit Vedette
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Modifiez la photo et le texte de la section &quot;La Pièce du
          Moment&quot; / &quot;L&apos;Ensemble Signature&quot; sur la page
          d&apos;accueil.
        </p>
        <AdminFeaturedEditor initial={settings} />
      </div>
    </div>
  );
}
