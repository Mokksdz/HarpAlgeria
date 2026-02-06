"use client";

import { useState, useEffect } from "react";
import { Upload, Save, CheckCircle, Image as ImageIcon, Type, Quote } from "lucide-react";

interface AboutSettings {
  aboutImage1Url: string | null;
  aboutImage2Url: string | null;
  aboutImage3Url: string | null;
  aboutHeroTitle: string | null;
  aboutHeroSubtitle: string | null;
  aboutStoryTitle: string | null;
  aboutStoryP1: string | null;
  aboutStoryP2: string | null;
  aboutStoryP3: string | null;
  aboutQuote: string | null;
  aboutQuoteAuthor: string | null;
}

const DEFAULTS: AboutSettings = {
  aboutImage1Url: null,
  aboutImage2Url: null,
  aboutImage3Url: null,
  aboutHeroTitle: "L'Élégance Intemporelle, Redéfinie.",
  aboutHeroSubtitle: "Une ode à la femme moderne qui ne choisit jamais entre pudeur et style. Harp incarne une vision nouvelle de la mode algérienne.",
  aboutStoryTitle: "Une histoire de passion et d'exigence.",
  aboutStoryP1: "Harp est née d'une volonté simple mais ambitieuse : offrir aux femmes algériennes une mode qui célèbre leur identité avec raffinement.",
  aboutStoryP2: "Loin de la fast-fashion, nous prenons le temps. Le temps de dessiner, de choisir, d'ajuster. Fondée en Algérie, notre maison s'inspire de l'héritage local tout en regardant vers l'avenir.",
  aboutStoryP3: "Nos collections sont le fruit d'un savoir-faire artisanal, où chaque couture raconte une histoire de dévouement et de précision.",
  aboutQuote: "L'élégance n'est pas une question de vêtements, c'est une attitude. Harp vous donne simplement l'assurance de l'exprimer.",
  aboutQuoteAuthor: "L'Équipe Harp",
};

export default function AdminAboutEditor({ initialSettings }: { initialSettings?: Partial<AboutSettings> | null }) {
  const [form, setForm] = useState<AboutSettings>({ ...DEFAULTS, ...initialSettings });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v3/site/settings/about")
      .then((r) => r.json())
      .then((data) => {
        setForm((prev) => ({
          ...prev,
          ...Object.fromEntries(
            Object.entries(data).filter(([, v]) => v !== null),
          ),
        }));
      })
      .catch(() => {});
  }, []);

  const handleUpload = async (field: keyof AboutSettings) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setUploading(field);
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.url) {
          setForm((prev) => ({ ...prev, [field]: data.url }));
        }
      } catch (err) {
        console.error("Upload failed:", err);
      } finally {
        setUploading(null);
      }
    };
    input.click();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/v3/site/settings/about", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const renderImageUpload = (field: keyof AboutSettings, label: string) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div
        onClick={() => handleUpload(field)}
        className="relative group cursor-pointer border-2 border-dashed border-gray-200 rounded-xl overflow-hidden hover:border-gray-400 transition-colors"
      >
        {form[field] ? (
          <div className="relative aspect-[4/3]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={form[field] as string}
              alt={label}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-sm font-medium">Changer</span>
            </div>
          </div>
        ) : (
          <div className="aspect-[4/3] flex flex-col items-center justify-center text-gray-400">
            {uploading === field ? (
              <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full" />
            ) : (
              <>
                <Upload size={24} className="mb-2" />
                <span className="text-sm">Télécharger</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderTextField = (field: keyof AboutSettings, label: string, multiline = false) => (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {multiline ? (
        <textarea
          value={(form[field] as string) || ""}
          onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))}
          rows={3}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none resize-none"
        />
      ) : (
        <input
          type="text"
          value={(form[field] as string) || ""}
          onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none"
        />
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Images */}
      <div>
        <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-4">
          <ImageIcon size={16} />
          Photos
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {renderImageUpload("aboutImage1Url", "Photo Origine (gauche)")}
          {renderImageUpload("aboutImage2Url", "Photo Origine (droite)")}
          {renderImageUpload("aboutImage3Url", "Photo Qualité")}
        </div>
      </div>

      {/* Hero Texts */}
      <div>
        <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-4">
          <Type size={16} />
          Section Hero
        </h4>
        <div className="space-y-3">
          {renderTextField("aboutHeroTitle", "Titre principal")}
          {renderTextField("aboutHeroSubtitle", "Sous-titre", true)}
        </div>
      </div>

      {/* Story Section */}
      <div>
        <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-4">
          <Type size={16} />
          Notre Histoire
        </h4>
        <div className="space-y-3">
          {renderTextField("aboutStoryTitle", "Titre de la section")}
          {renderTextField("aboutStoryP1", "Paragraphe 1", true)}
          {renderTextField("aboutStoryP2", "Paragraphe 2", true)}
          {renderTextField("aboutStoryP3", "Paragraphe 3", true)}
        </div>
      </div>

      {/* Quote */}
      <div>
        <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-4">
          <Quote size={16} />
          Citation
        </h4>
        <div className="space-y-3">
          {renderTextField("aboutQuote", "Citation", true)}
          {renderTextField("aboutQuoteAuthor", "Auteur")}
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-lg hover:bg-gray-800 transition-all text-sm font-medium disabled:opacity-50"
      >
        {saved ? (
          <>
            <CheckCircle size={16} />
            Enregistré !
          </>
        ) : (
          <>
            <Save size={16} />
            {saving ? "Enregistrement..." : "Enregistrer"}
          </>
        )}
      </button>
    </div>
  );
}
