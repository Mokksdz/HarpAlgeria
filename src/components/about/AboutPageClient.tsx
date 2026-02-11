"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  Sparkles,
  Quote,
  Truck,
  MapPin,
  Star,
  Package,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

// Default content (fallbacks when admin hasn't set values)
const DEFAULTS = {
  heroTitle: "L'Élégance Intemporelle,\nRedéfinie.",
  heroSubtitle:
    "Une ode à la femme moderne qui ne choisit jamais entre pudeur et style. Harp incarne une vision nouvelle de la mode algérienne.",
  storyTitle: "Une histoire de passion et d'exigence.",
  storyP1:
    "est née d'une volonté simple mais ambitieuse : offrir aux femmes algériennes une mode qui célèbre leur identité avec raffinement.",
  storyP2:
    "Loin de la fast-fashion, nous prenons le temps. Le temps de dessiner, de choisir, d'ajuster. Fondée en Algérie, notre maison s'inspire de l'héritage local tout en regardant vers l'avenir.",
  storyP3:
    "Nos collections sont le fruit d'un savoir-faire artisanal, où chaque couture raconte une histoire de dévouement et de précision.",
  quote:
    "L'élégance n'est pas une question de vêtements, c'est une attitude. Harp vous donne simplement l'assurance de l'exprimer.",
  quoteAuthor: "L'Équipe Harp",
  image1:
    "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80",
  image2:
    "https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=600&q=80",
  image3:
    "https://images.unsplash.com/photo-1551232864-3f0890e580d9?w=1200&q=80",
};

const DEFAULTS_AR = {
  heroTitle: "الأناقة الخالدة،\nمُعاد تعريفها.",
  heroSubtitle:
    "تكريم للمرأة العصرية التي لا تختار أبداً بين الاحتشام والأناقة. هارب تجسد رؤية جديدة للموضة الجزائرية.",
  storyTitle: "قصة شغف ودقة.",
  storyP1:
    "وُلدت من رغبة بسيطة لكن طموحة: تقديم أزياء للمرأة الجزائرية تحتفي بهويتها برقي.",
  storyP2:
    "بعيداً عن الموضة السريعة، نأخذ وقتنا. وقت التصميم، والاختيار، والتعديل. تأسست في الجزائر، دارنا تستلهم من التراث المحلي مع التطلع نحو المستقبل.",
  storyP3:
    "مجموعاتنا ثمرة حرفية يدوية، حيث كل غرزة تروي قصة تفانٍ ودقة.",
  quote:
    "الأناقة ليست مسألة ملابس، إنها موقف. هارب تمنحك ببساطة الثقة للتعبير عنها.",
  quoteAuthor: "فريق هارب",
};

interface AboutSettings {
  aboutHeroTitle?: string | null;
  aboutHeroSubtitle?: string | null;
  aboutStoryTitle?: string | null;
  aboutStoryP1?: string | null;
  aboutStoryP2?: string | null;
  aboutStoryP3?: string | null;
  aboutQuote?: string | null;
  aboutQuoteAuthor?: string | null;
  aboutImage1Url?: string | null;
  aboutImage2Url?: string | null;
  aboutImage3Url?: string | null;
  // Arabic fields
  aboutHeroTitleAr?: string | null;
  aboutHeroSubtitleAr?: string | null;
  aboutStoryTitleAr?: string | null;
  aboutStoryP1Ar?: string | null;
  aboutStoryP2Ar?: string | null;
  aboutStoryP3Ar?: string | null;
  aboutQuoteAr?: string | null;
  aboutQuoteAuthorAr?: string | null;
}

export default function AboutPageClient({ settings }: { settings: AboutSettings }) {
  const { t, language } = useLanguage();
  const isAr = language === "ar";

  // Content with Arabic fallbacks
  const heroTitle = isAr
    ? (settings.aboutHeroTitleAr || DEFAULTS_AR.heroTitle)
    : (settings.aboutHeroTitle || DEFAULTS.heroTitle);
  const heroSubtitle = isAr
    ? (settings.aboutHeroSubtitleAr || DEFAULTS_AR.heroSubtitle)
    : (settings.aboutHeroSubtitle || DEFAULTS.heroSubtitle);
  const storyTitle = isAr
    ? (settings.aboutStoryTitleAr || DEFAULTS_AR.storyTitle)
    : (settings.aboutStoryTitle || DEFAULTS.storyTitle);
  const storyP1 = isAr
    ? (settings.aboutStoryP1Ar || DEFAULTS_AR.storyP1)
    : (settings.aboutStoryP1 || DEFAULTS.storyP1);
  const storyP2 = isAr
    ? (settings.aboutStoryP2Ar || DEFAULTS_AR.storyP2)
    : (settings.aboutStoryP2 || DEFAULTS.storyP2);
  const storyP3 = isAr
    ? (settings.aboutStoryP3Ar || DEFAULTS_AR.storyP3)
    : (settings.aboutStoryP3 || DEFAULTS.storyP3);
  const quote = isAr
    ? (settings.aboutQuoteAr || DEFAULTS_AR.quote)
    : (settings.aboutQuote || DEFAULTS.quote);
  const quoteAuthor = isAr
    ? (settings.aboutQuoteAuthorAr || DEFAULTS_AR.quoteAuthor)
    : (settings.aboutQuoteAuthor || DEFAULTS.quoteAuthor);

  // Images don't change per language
  const image1 = settings.aboutImage1Url || DEFAULTS.image1;
  const image2 = settings.aboutImage2Url || DEFAULTS.image2;
  const image3 = settings.aboutImage3Url || DEFAULTS.image3;

  const philosophyItems = [
    {
      icon: Heart,
      title: t("about.respectful"),
      desc: t("about.respectfulDesc"),
    },
    {
      icon: Sparkles,
      title: t("about.modern"),
      desc: t("about.modernDesc"),
    },
    {
      icon: Star,
      title: t("about.exclusive"),
      desc: t("about.exclusiveDesc"),
    },
  ];

  const qualityItems = [
    { title: t("about.materials"), desc: t("about.materialsDesc") },
    { title: t("about.finishing"), desc: t("about.finishingDesc") },
    { title: t("about.quality"), desc: t("about.qualityDesc") },
  ];

  const serviceItems = [
    { icon: MapPin, label: isAr ? "58 ولاية" : "58 Wilayas", sub: t("about.coverage") },
    { icon: Truck, label: "24h - 72h", sub: t("about.express") },
    { icon: Package, label: t("about.liveTracking"), sub: t("about.viaPartners") },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-harp-cream/30 to-white" dir={isAr ? "rtl" : "ltr"}>
      {/* Hero Section - Minimalist */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-24 overflow-hidden bg-harp-sand/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center relative z-10">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-4 block">
              {t("about.badge")}
            </span>
            <h1 className="text-4xl md:text-6xl font-serif font-medium text-gray-900 mb-6 leading-tight whitespace-pre-line">
              {heroTitle}
            </h1>
            <p className="text-lg md:text-xl text-gray-500 leading-relaxed font-light max-w-2xl mx-auto">
              {heroSubtitle}
            </p>
          </div>
        </div>

        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-harp-beige/20 rounded-full blur-3xl" />
          <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] bg-harp-gold/5 rounded-full blur-3xl" />
        </div>
      </section>

      {/* Section 1: Origine de la marque - Asymmetrical Layout */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Text Content */}
            <div className={`lg:col-span-5 order-2 ${isAr ? "lg:order-2" : "lg:order-1"}`}>
              <h2 className="text-3xl md:text-4xl font-serif font-medium text-gray-900 mb-8">
                {storyTitle}
              </h2>

              <div className="space-y-6 text-gray-600 font-light leading-relaxed">
                <p>
                  <strong className="text-gray-900 font-medium">Harp</strong>{" "}
                  {storyP1}
                </p>
                <p>{storyP2}</p>
                <p>{storyP3}</p>
              </div>

              <div className="flex gap-12 mt-12 pt-8 border-t border-gray-100">
                <div>
                  <p className="text-3xl font-serif font-medium text-gray-900">
                    2024
                  </p>
                  <p className="text-xs uppercase tracking-widest text-gray-400 mt-1">
                    {t("about.foundation")}
                  </p>
                </div>
                <div>
                  <p className="text-3xl font-serif font-medium text-gray-900">
                    100%
                  </p>
                  <p className="text-xs uppercase tracking-widest text-gray-400 mt-1">
                    {t("about.algerian")}
                  </p>
                </div>
              </div>
            </div>

            {/* Visual Composition */}
            <div className={`lg:col-span-6 ${isAr ? "lg:col-start-1 order-1 lg:order-1" : "lg:col-start-7 order-1 lg:order-2"} relative`}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4 mt-12">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-sm">
                    <Image
                      src={image1}
                      alt="Création Harp"
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-sm">
                    <Image
                      src={image2}
                      alt="Style Harp"
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Vision - Clean Grid */}
      <section className="py-24 bg-[#F9F9F9]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-medium text-gray-900 mb-6">
              {t("about.philosophy")}
            </h2>
            <p className="text-lg text-gray-500 font-light">
              {t("about.philosophyDesc")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {philosophyItems.map((item, i) => (
              <div
                key={i}
                className="bg-white p-10 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] transition-transform hover:-translate-y-1 duration-300"
              >
                <item.icon size={24} className="text-gray-900 mb-6" />
                <h3 className="font-serif font-medium text-xl text-gray-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed font-light">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote Section - Minimal */}
      <section className="py-32 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Quote size={32} className="text-gray-300 mx-auto mb-8" />
            <blockquote className="text-2xl md:text-4xl font-serif text-gray-900 leading-relaxed mb-8">
              &ldquo;{quote}&rdquo;
            </blockquote>
            <cite className="text-sm uppercase tracking-widest text-gray-400 not-italic">
              — {quoteAuthor}
            </cite>
          </div>
        </div>
      </section>

      {/* Section 3: Engagement Qualité - Split */}
      <section className="py-0 bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className={`relative aspect-square lg:aspect-auto lg:h-full min-h-[500px] ${isAr ? "lg:order-2" : ""}`}>
            <Image
              src={image3}
              alt="Qualité Harp"
              fill
              className="object-cover"
            />
          </div>
          <div className={`flex items-center justify-center p-12 lg:p-24 bg-gray-50 ${isAr ? "lg:order-1" : ""}`}>
            <div className="max-w-md">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-4 block">
                {t("about.promise")}
              </span>
              <h2 className="text-3xl md:text-4xl font-serif font-medium text-gray-900 mb-8">
                {t("about.excellence")}
              </h2>

              <div className="space-y-8">
                {qualityItems.map((item, i) => (
                  <div key={i}>
                    <h4 className="text-lg font-serif font-medium text-gray-900 mb-2">
                      {item.title}
                    </h4>
                    <p className="text-gray-500 font-light text-sm">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Livraison - Minimal Data */}
      <section className="py-24 bg-white border-t border-gray-100">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-medium text-gray-900 mb-16">
            {t("about.service")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {serviceItems.map((item, i) => (
              <div key={i} className="group p-6">
                <item.icon
                  size={28}
                  className="text-gray-900 mx-auto mb-4 group-hover:scale-110 transition-transform"
                />
                <p className="text-lg font-medium text-gray-900 mb-1">
                  {item.label}
                </p>
                <p className="text-xs text-gray-500 uppercase tracking-wider">
                  {item.sub}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-16">
            <Link
              href="/shop"
              className="inline-block border-b border-gray-900 pb-1 text-sm uppercase tracking-widest hover:text-gray-600 hover:border-gray-600 transition-all"
            >
              {t("about.discoverCollections")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
