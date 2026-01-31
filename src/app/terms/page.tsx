"use client";

import { useLanguage } from "@/components/LanguageProvider";
import {
  FileText,
  ShoppingBag,
  Truck,
  RefreshCw,
  CreditCard,
  AlertCircle,
  Scale,
  HelpCircle,
} from "lucide-react";

export default function TermsPage() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const content = {
    fr: {
      title: "Conditions Générales de Vente",
      lastUpdate: "Dernière mise à jour : Novembre 2025",
      intro:
        "Les présentes Conditions Générales de Vente (CGV) définissent le cadre contractuel de nos relations. En choisissant Harp, vous acceptez ces conditions conçues pour protéger nos intérêts mutuels.",
      sections: [
        {
          icon: FileText,
          title: "1. Objet",
          content: `Ces CGV régissent exclusivement les ventes réalisées sur notre site par Harp, marque algérienne de prêt-à-porter.
                    
Nous nous réservons le droit d'adapter ces conditions. Les CGV applicables sont celles en vigueur au jour de votre commande.`,
        },
        {
          icon: ShoppingBag,
          title: "2. Produits",
          content: `Nos créations sont présentées avec la plus grande précision. 
                    
• **Photos** : Non contractuelles (variations minimes de couleur possibles)
• **Disponibilité** : Dans la limite des stocks. Nous vous informons rapidement en cas de rupture.
• **Tailles** : Consultez notre guide des tailles avant toute commande.`,
        },
        {
          icon: CreditCard,
          title: "3. Prix et Paiement",
          content: `• **Prix** : Indiqués en Dinars Algériens (DZD) TTC. Hors frais de livraison.
• **Paiement** : Exclusivement à la livraison (Cash on Delivery).
• **Validation** : Votre commande est définitive après confirmation téléphonique de notre service client (sous 24-48h).`,
        },
        {
          icon: Truck,
          title: "4. Livraison",
          content: `Nous livrons sur les 69 wilayas via nos partenaires de confiance (Yalidine, ZR Express).

• **Délais** : 1 à 7 jours ouvrés selon la wilaya.
• **Tarifs** : Calculés selon la destination et le mode (domicile/stop-desk).
• **Réception** : Vérifiez l'état du colis devant le livreur. Tout dommage doit être signalé immédiatement.`,
        },
        {
          icon: RefreshCw,
          title: "5. Échanges",
          content: `Vous disposez de **2 jours** après réception pour demander un échange (taille, défaut, non-conformité).

• **Conditions** : Produit neuf, non porté, avec étiquettes et emballage d'origine.
• **Frais** : Pris en charge par Harp en cas d'erreur de notre part.
• **Procédure** : Contactez-nous sur WhatsApp avec votre n° de commande.

*Note : Aucun remboursement n'est effectué, seuls les échanges sont acceptés.*`,
        },
        {
          icon: AlertCircle,
          title: "6. Responsabilité",
          content: `Harp n'est pas responsable des retards de livraison imputables aux transporteurs ou des cas de force majeure.
                    
Nous déclinons toute responsabilité en cas d'utilisation ou d'entretien non conforme de nos produits.`,
        },
        {
          icon: Scale,
          title: "7. Litiges",
          content: `Nous privilégions toujours une solution amiable. Notre service client est à votre écoute pour résoudre tout différend.
                    
À défaut, les tribunaux algériens sont seuls compétents.`,
        },
        {
          icon: HelpCircle,
          title: "8. Contact",
          content: `Notre équipe est à votre disposition du dimanche au jeudi (9h-18h).

• **WhatsApp** : Service Client
• **Email** : contact@harpalgeria.com`,
        },
      ],
    },
    ar: {
      title: "الشروط العامة للبيع",
      lastUpdate: "آخر تحديث: نوفمبر 2025",
      intro:
        "تحدد هذه الشروط العامة للبيع الإطار التعاقدي لعلاقاتنا. باختيارك هارب، فإنك توافق على هذه الشروط المصممة لحماية مصالحنا المشتركة.",
      sections: [
        {
          icon: FileText,
          title: "1. الهدف",
          content: `تحكم هذه الشروط حصرياً المبيعات التي تتم على موقعنا من قبل هارب، العلامة التجارية الجزائرية للملابس الجاهزة.
                    
نحتفظ بالحق في تعديل هذه الشروط. الشروط المطبقة هي تلك السارية يوم طلبك.`,
        },
        {
          icon: ShoppingBag,
          title: "2. المنتجات",
          content: `يتم عرض إبداعاتنا بأكبر قدر من الدقة. 
                    
• **الصور**: غير تعاقدية (اختلافات طفيفة في اللون ممكنة)
• **التوفر**: في حدود المخزون. نبلغكم بسرعة في حالة النفاد.
• **المقاسات**: راجعي دليل المقاسات قبل أي طلب.`,
        },
        {
          icon: CreditCard,
          title: "3. الأسعار والدفع",
          content: `• **الأسعار**: مبينة بالدينار الجزائري شاملة جميع الرسوم. غير شاملة تكاليف التوصيل.
• **الدفع**: حصرياً عند الاستلام.
• **التأكيد**: يصبح طلبك نهائياً بعد التأكيد الهاتفي من خدمة العملاء (خلال 24-48 ساعة).`,
        },
        {
          icon: Truck,
          title: "4. التوصيل",
          content: `نقوم بالتوصيل إلى 58 ولاية عبر شركائنا الموثوقين (Yalidine، ZR Express).

• **الآجال**: 1 إلى 7 أيام عمل حسب الولاية.
• **الأسعار**: تحسب حسب الوجهة والطريقة (المنزل/المكتب).
• **الاستلام**: تحققي من حالة الطرد أمام عامل التوصيل. يجب الإبلاغ عن أي ضرر فوراً.`,
        },
        {
          icon: RefreshCw,
          title: "5. الاستبدال",
          content: `لديك **يومان** بعد الاستلام لطلب استبدال (مقاس، عيب، عدم مطابقة).

• **الشروط**: منتج جديد، غير ملبوس، مع العلامات والتغليف الأصلي.
• **التكاليف**: تتحملها هارب في حالة الخطأ من جانبنا.
• **الإجراء**: تواصل معنا عبر واتساب مع رقم الطلب.

*ملاحظة: لا يتم استرداد الأموال، يقبل الاستبدال فقط.*`,
        },
        {
          icon: AlertCircle,
          title: "6. المسؤولية",
          content: `هارب ليست مسؤولة عن تأخيرات التوصيل المنسوبة للناقلين أو حالات القوة القاهرة.
                    
نخلي مسؤوليتنا في حالة الاستخدام أو العناية غير المطابقة لمنتجاتنا.`,
        },
        {
          icon: Scale,
          title: "7. النزاعات",
          content: `نفضل دائماً الحل الودي. خدمة العملاء لدينا تحت تصرفك لحل أي خلاف.
                    
في حالة عدم التوصل لحل، تكون المحاكم الجزائرية هي المختصة.`,
        },
        {
          icon: HelpCircle,
          title: "8. الاتصال",
          content: `فريقنا تحت تصرفكم من الأحد إلى الخميس (9سا-18سا).

• **واتساب**: خدمة العملاء
• **البريد الإلكتروني**: contact@harpalgeria.com`,
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
