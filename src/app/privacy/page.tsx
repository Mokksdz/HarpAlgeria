"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { Shield, Lock, Eye, Mail, Trash2, UserCheck } from "lucide-react";

export default function PrivacyPage() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const content = {
    fr: {
      title: "Politique de Confidentialité",
      lastUpdate: "Dernière mise à jour : Novembre 2025",
      intro:
        "Chez Harp, nous accordons une importance primordiale à la protection de vos données personnelles. Cette politique explique en toute transparence comment nous collectons, utilisons et protégeons vos informations.",
      sections: [
        {
          icon: Eye,
          title: "1. Données collectées",
          content: `Nous collectons uniquement les informations nécessaires au traitement de vos commandes :
                    
• **Identité** : Nom, prénom, numéro de téléphone
• **Livraison** : Adresse postale, ville, wilaya
• **Commande** : Détails des produits achetés

Nous ne collectons **JAMAIS** vos informations bancaires (paiement à la livraison uniquement) ni de données sensibles.`,
        },
        {
          icon: Lock,
          title: "2. Utilisation des données",
          content: `Vos données sont utilisées exclusivement pour :

• Expédier vos commandes
• Vous notifier de l'avancement de la livraison
• Assurer le service après-vente

Nous ne vendons, ne louons et ne partageons vos données avec aucun tiers à des fins commerciales.`,
        },
        {
          icon: Shield,
          title: "3. Protection des données",
          content: `La sécurité de vos données est notre priorité :

• Stockage sur des serveurs sécurisés
• Accès strictement limité au personnel autorisé
• Connexions chiffrées (HTTPS)`,
        },
        {
          icon: UserCheck,
          title: "4. Vos droits",
          content: `Conformément à la réglementation, vous disposez d'un droit d'accès, de rectification et de suppression de vos données.

Pour exercer ces droits, contactez simplement notre service client.`,
        },
        {
          icon: Trash2,
          title: "5. Conservation",
          content: `Vos données de commande sont conservées durant la durée légale obligatoire (3 ans). Vos coordonnées sont conservées tant que vous souhaitez rester en contact avec nous.

Vous pouvez demander leur suppression à tout moment.`,
        },
        {
          icon: Mail,
          title: "6. Contact",
          content: `Pour toute question relative à vos données :

• **Email** : contact@harpalgeria.com
• **WhatsApp** : Service Client

Nous nous engageons à vous répondre sous 48h.`,
        },
      ],
    },
    ar: {
      title: "سياسة الخصوصية",
      lastUpdate: "آخر تحديث: نوفمبر 2025",
      intro:
        "في هارب، نولي أهمية قصوى لحماية بياناتك الشخصية. تشرح هذه السياسة بشفافية كيفية جمع واستخدام وحماية معلوماتك.",
      sections: [
        {
          icon: Eye,
          title: "1. البيانات التي نجمعها",
          content: `نجمع فقط المعلومات الضرورية لمعالجة طلباتك:
                    
• **الهوية**: الاسم، اللقب، رقم الهاتف
• **التوصيل**: العنوان، المدينة، الولاية
• **الطلب**: تفاصيل المنتجات المشتراة

لا نجمع **أبداً** معلوماتك البنكية (الدفع عند الاستلام فقط) أو أي بيانات حساسة.`,
        },
        {
          icon: Lock,
          title: "2. استخدام البيانات",
          content: `تستخدم بياناتك حصرياً لـ:

• شحن طلباتك
• إعلامك بتقدم التوصيل
• ضمان خدمة ما بعد البيع

لا نبيع ولا نؤجر ولا نشارك بياناتك مع أي طرف ثالث لأغراض تجارية.`,
        },
        {
          icon: Shield,
          title: "3. حماية البيانات",
          content: `أمن بياناتك هو أولويتنا:

• تخزين على خوادم آمنة
• وصول مقيد بدقة للموظفين المصرح لهم
• اتصالات مشفرة (HTTPS)`,
        },
        {
          icon: UserCheck,
          title: "4. حقوقك",
          content: `وفقاً للقوانين، لديك الحق في الوصول إلى بياناتك وتصحيحها وحذفها.

لممارسة هذه الحقوق، تواصل ببساطة مع خدمة العملاء.`,
        },
        {
          icon: Trash2,
          title: "5. الاحتفاظ بالبيانات",
          content: `يتم الاحتفاظ ببيانات طلبك للمدة القانونية الإلزامية (3 سنوات). يتم الاحتفاظ بمعلومات الاتصال طالما رغبت في البقاء على تواصل معنا.

يمكنك طلب حذفها في أي وقت.`,
        },
        {
          icon: Mail,
          title: "6. الاتصال",
          content: `لأي سؤال يتعلق ببياناتك:

• **البريد الإلكتروني**: contact@harpalgeria.com
• **واتساب**: خدمة العملاء

نلتزم بالرد عليك خلال 48 ساعة.`,
        },
      ],
    },
  };

  const t = isAr ? content.ar : content.fr;

  return (
    <div className={`min-h-screen bg-white pt-32 pb-20 ${isAr ? "rtl" : ""}`}>
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-4 block">
            Légal
          </span>
          <h1 className="text-3xl md:text-5xl font-serif font-medium text-gray-900 mb-6">
            {t.title}
          </h1>
          <p className="text-gray-500 font-light">{t.lastUpdate}</p>
        </div>

        {/* Intro */}
        <div className="mb-16 text-center">
          <p className="text-lg text-gray-600 font-light leading-relaxed max-w-2xl mx-auto">
            {t.intro}
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-12">
          {t.sections.map((section, index) => (
            <div key={index} className="group border-t border-gray-100 pt-12">
              <div className="flex flex-col md:flex-row gap-6 md:gap-12">
                <div className="md:w-1/3 flex items-start gap-4">
                  <section.icon
                    size={20}
                    className="text-gray-400 mt-1 group-hover:text-gray-900 transition-colors"
                  />
                  <h2 className="text-xl font-serif font-medium text-gray-900">
                    {section.title}
                  </h2>
                </div>
                <div className="md:w-2/3">
                  <div className="text-gray-500 font-light leading-relaxed whitespace-pre-line">
                    {section.content.split("**").map((part, i) =>
                      i % 2 === 1 ? (
                        <strong key={i} className="text-gray-900 font-medium">
                          {part}
                        </strong>
                      ) : (
                        part
                      ),
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
