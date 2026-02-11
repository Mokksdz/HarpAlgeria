import { getSiteSettings } from "@/lib/site/settings.service";
import AdminHeroEditor from "@/components/admin/AdminHeroEditor";
import AdminFeaturedEditor from "@/components/admin/AdminFeaturedEditor";
import AdminAboutEditor from "@/components/admin/AdminAboutEditor";
import AdminHomepageCollections from "@/components/admin/AdminHomepageCollections";
import {
  Palette,
  Image as ImageIcon,
  Star,
  LayoutGrid,
  BookOpen,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CustomizationPage() {
  const settings = await getSiteSettings();

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-harp-brown to-harp-caramel flex items-center justify-center">
            <Palette size={20} className="text-white" />
          </div>
          Personnalisation
        </h1>
        <p className="text-gray-500 mt-2 text-sm">
          Configurez l&apos;apparence et le contenu de votre site
        </p>
      </div>

      {/* Section Hero */}
      <section className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <ImageIcon size={16} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Section Hero
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Banni&egrave;re principale en haut de la page d&apos;accueil
              </p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <AdminHeroEditor initial={settings} />
        </div>
      </section>

      {/* Homepage Collections */}
      <section className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
              <LayoutGrid size={16} className="text-purple-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Collections Page d&apos;Accueil
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Choisissez et ordonnez les collections affich&eacute;es sur la page d&apos;accueil
              </p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <AdminHomepageCollections />
        </div>
      </section>

      {/* Featured Product Section */}
      <section className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Star size={16} className="text-amber-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Produit Vedette
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Section &quot;La Pi&egrave;ce du Moment&quot; sur la page d&apos;accueil
              </p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <AdminFeaturedEditor initial={settings} />
        </div>
      </section>

      {/* About Page Section */}
      <section className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
              <BookOpen size={16} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Page &Agrave; Propos
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Photos et textes de la page &quot;&Agrave; Propos&quot;
              </p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <AdminAboutEditor initialSettings={settings} />
        </div>
      </section>
    </div>
  );
}
