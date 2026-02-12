"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { FAQJsonLd } from "@/components/JsonLd";
import { getWhatsAppLink } from "@/lib/config";
import {
  Truck,
  CreditCard,
  RefreshCw,
  ShoppingBag,
  Package,
  ChevronDown,
  MessageCircle,
  HelpCircle,
} from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  icon: typeof Truck;
  title: string;
  items: FAQItem[];
}

export default function FAQPage() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  const content = {
    fr: {
      badge: "FAQ",
      title: "Questions Fréquentes",
      subtitle:
        "Retrouvez les réponses aux questions les plus posées par nos clientes. Si vous ne trouvez pas votre réponse, contactez-nous directement.",
      categories: [
        {
          icon: Truck,
          title: "Livraison",
          items: [
            {
              question: "Dans quelles wilayas livrez-vous ?",
              answer:
                "Nous livrons dans les 69 wilayas d'Algérie via nos partenaires Yalidine et ZR Express. Que vous soyez à Alger, Oran, Constantine ou n'importe quelle autre wilaya, nous vous livrons.",
            },
            {
              question: "Quels sont les délais de livraison ?",
              answer:
                "Les délais varient de 1 à 7 jours ouvrés selon votre wilaya et le mode de livraison choisi. En général, les grandes villes sont livrées sous 24 à 72 heures.",
            },
            {
              question:
                "Quelle est la différence entre livraison à domicile et stop-desk ?",
              answer:
                "La livraison à domicile : le livreur vous apporte le colis chez vous. Le stop-desk (point relais) : vous récupérez votre colis dans un centre de retrait. Le stop-desk est généralement moins cher.",
            },
            {
              question: "Comment suivre mon colis ?",
              answer:
                'Après expédition, vous recevez un numéro de suivi par email. Vous pouvez suivre votre colis en temps réel sur notre page "Suivi de commande" ou directement sur le site du transporteur (Yalidine ou ZR Express).',
            },
          ],
        },
        {
          icon: CreditCard,
          title: "Paiement",
          items: [
            {
              question: "Quels modes de paiement acceptez-vous ?",
              answer:
                "Nous acceptons exclusivement le paiement à la livraison (Cash on Delivery). Vous payez en espèces au livreur lors de la réception de votre colis.",
            },
            {
              question: "Les prix incluent-ils les frais de livraison ?",
              answer:
                "Non, les prix affichés sont hors frais de livraison. Les frais de livraison sont calculés automatiquement lors du checkout en fonction de votre wilaya et du mode de livraison (domicile ou stop-desk).",
            },
            {
              question: "Les prix sont-ils en Dinars Algériens ?",
              answer:
                "Oui, tous nos prix sont affichés en Dinars Algériens (DZD) toutes taxes comprises.",
            },
          ],
        },
        {
          icon: RefreshCw,
          title: "Échanges & Retours",
          items: [
            {
              question: "Puis-je échanger un article ?",
              answer:
                "Oui, vous disposez de 2 jours après réception pour demander un échange (taille, défaut ou non-conformité). Le produit doit être neuf, non porté, avec ses étiquettes et son emballage d'origine.",
            },
            {
              question: "Comment demander un échange ?",
              answer:
                "Contactez-nous sur WhatsApp avec votre numéro de commande et la raison de l'échange. Notre équipe vous guidera pour la procédure.",
            },
            {
              question: "Les remboursements sont-ils possibles ?",
              answer:
                "Nous n'effectuons pas de remboursements. Seuls les échanges sont acceptés dans les conditions mentionnées ci-dessus.",
            },
            {
              question: "Qui paie les frais de retour ?",
              answer:
                "En cas d'erreur de notre part (mauvaise taille envoyée, article défectueux), Harp prend en charge les frais de retour. Dans les autres cas, les frais sont à la charge du client.",
            },
          ],
        },
        {
          icon: ShoppingBag,
          title: "Produits",
          items: [
            {
              question: "Comment choisir ma taille ?",
              answer:
                'Un guide des tailles est disponible sur chaque fiche produit. Cliquez sur "Guide des tailles" pour consulter les mesures détaillées. En cas de doute, n\'hésitez pas à nous contacter sur WhatsApp.',
            },
            {
              question:
                "Les couleurs des photos correspondent-elles à la réalité ?",
              answer:
                "Nous faisons notre maximum pour que les photos reflètent fidèlement nos produits. Cependant, de légères variations de couleur sont possibles selon les écrans. Les photos sont non contractuelles.",
            },
            {
              question: "Comment entretenir mes vêtements Harp ?",
              answer:
                "Nous recommandons un lavage délicat à 30°C, pas de sèche-linge, et un repassage à température modérée. Les instructions d'entretien spécifiques sont indiquées sur l'étiquette de chaque vêtement.",
            },
          ],
        },
        {
          icon: Package,
          title: "Commandes",
          items: [
            {
              question: "Comment passer commande ?",
              answer:
                "Choisissez vos articles, sélectionnez taille et couleur, ajoutez au panier puis validez votre commande avec vos informations de livraison. Vous recevrez une confirmation par email.",
            },
            {
              question: "Ma commande est-elle confirmée immédiatement ?",
              answer:
                "Votre commande est enregistrée immédiatement mais devient définitive après confirmation téléphonique de notre service client sous 24 à 48 heures.",
            },
            {
              question: "Puis-je annuler ma commande ?",
              answer:
                "Oui, vous pouvez annuler votre commande avant son expédition en nous contactant sur WhatsApp. Une fois le colis expédié, l'annulation n'est plus possible.",
            },
            {
              question: "Comment suivre l'état de ma commande ?",
              answer:
                'Rendez-vous sur notre page "Suivi de commande" et entrez votre numéro de suivi. Vous verrez l\'historique complet de votre colis en temps réel.',
            },
          ],
        },
      ] as FAQCategory[],
      cta: {
        title: "Vous n'avez pas trouvé votre réponse ?",
        desc: "Notre équipe est disponible du dimanche au jeudi, 9h-18h.",
        contact: "Nous contacter",
        whatsapp: "Écrire sur WhatsApp",
      },
    },
    ar: {
      badge: "الأسئلة الشائعة",
      title: "الأسئلة المتكررة",
      subtitle:
        "اعثري على إجابات الأسئلة الأكثر شيوعاً. إذا لم تجدي إجابتك، تواصلي معنا مباشرة.",
      categories: [
        {
          icon: Truck,
          title: "التوصيل",
          items: [
            {
              question: "إلى أي ولايات توصلون؟",
              answer:
                "نوصل إلى 69 ولاية عبر شركائنا Yalidine و ZR Express. سواء كنت في الجزائر العاصمة، وهران، قسنطينة أو أي ولاية أخرى، نوصل لك.",
            },
            {
              question: "ما هي آجال التوصيل؟",
              answer:
                "تتراوح الآجال من يوم إلى 7 أيام عمل حسب ولايتك وطريقة التوصيل. عموماً، المدن الكبرى تُوصَّل خلال 24 إلى 72 ساعة.",
            },
            {
              question: "ما الفرق بين التوصيل للمنزل ونقطة الاستلام؟",
              answer:
                "التوصيل للمنزل: يأتيك المُوصِّل للباب. نقطة الاستلام (Stop-desk): تستلمين طردك من مركز الاستلام. نقطة الاستلام عادة أرخص.",
            },
            {
              question: "كيف أتابع طردي؟",
              answer:
                'بعد الشحن، تتلقين رقم تتبع عبر البريد الإلكتروني. يمكنك تتبع طردك في الوقت الفعلي على صفحة "تتبع الطلب" أو مباشرة على موقع الناقل.',
            },
          ],
        },
        {
          icon: CreditCard,
          title: "الدفع",
          items: [
            {
              question: "ما هي طرق الدفع المتاحة؟",
              answer:
                "نقبل حصرياً الدفع عند الاستلام. تدفعين نقداً للموصل عند استلام طردك.",
            },
            {
              question: "هل الأسعار تشمل تكاليف التوصيل؟",
              answer:
                "لا، الأسعار المعروضة لا تشمل تكاليف التوصيل. تُحسب تكاليف التوصيل تلقائياً عند إتمام الطلب حسب ولايتك وطريقة التوصيل.",
            },
            {
              question: "هل الأسعار بالدينار الجزائري؟",
              answer:
                "نعم، جميع أسعارنا معروضة بالدينار الجزائري شاملة جميع الرسوم.",
            },
          ],
        },
        {
          icon: RefreshCw,
          title: "الاستبدال والإرجاع",
          items: [
            {
              question: "هل يمكنني استبدال منتج؟",
              answer:
                "نعم، لديك يومان بعد الاستلام لطلب استبدال (مقاس، عيب أو عدم مطابقة). يجب أن يكون المنتج جديداً، غير ملبوس، مع العلامات والتغليف الأصلي.",
            },
            {
              question: "كيف أطلب استبدال؟",
              answer:
                "تواصلي معنا عبر واتساب مع رقم طلبك وسبب الاستبدال. فريقنا سيرشدك للإجراءات.",
            },
            {
              question: "هل يمكن استرداد المبلغ؟",
              answer:
                "لا نقوم باسترداد الأموال. يُقبل الاستبدال فقط وفق الشروط المذكورة أعلاه.",
            },
            {
              question: "من يدفع تكاليف الإرجاع؟",
              answer:
                "في حالة خطأ من جانبنا (مقاس خاطئ، منتج معيب)، تتحمل هارب تكاليف الإرجاع. في الحالات الأخرى، التكاليف على العميل.",
            },
          ],
        },
        {
          icon: ShoppingBag,
          title: "المنتجات",
          items: [
            {
              question: "كيف أختار مقاسي؟",
              answer:
                'دليل المقاسات متوفر في كل صفحة منتج. انقري على "دليل المقاسات" لمعرفة القياسات المفصلة. في حالة الشك، لا تترددي في التواصل معنا عبر واتساب.',
            },
            {
              question: "هل ألوان الصور تطابق الواقع؟",
              answer:
                "نبذل قصارى جهدنا لتعكس الصور منتجاتنا بدقة. لكن اختلافات طفيفة في اللون ممكنة حسب الشاشات. الصور غير تعاقدية.",
            },
            {
              question: "كيف أعتني بملابس هارب؟",
              answer:
                "ننصح بالغسل اللطيف عند 30 درجة، عدم استخدام المجفف، والكي بدرجة حرارة معتدلة. تعليمات العناية مذكورة على ملصق كل قطعة.",
            },
          ],
        },
        {
          icon: Package,
          title: "الطلبات",
          items: [
            {
              question: "كيف أقوم بطلب؟",
              answer:
                "اختاري منتجاتك، حددي المقاس واللون، أضيفي للسلة ثم أكملي طلبك بمعلومات التوصيل. ستتلقين تأكيداً عبر البريد الإلكتروني.",
            },
            {
              question: "هل يتم تأكيد طلبي فوراً؟",
              answer:
                "يُسجَّل طلبك فوراً لكنه يصبح نهائياً بعد التأكيد الهاتفي من خدمة العملاء خلال 24 إلى 48 ساعة.",
            },
            {
              question: "هل يمكنني إلغاء طلبي؟",
              answer:
                "نعم، يمكنك إلغاء طلبك قبل شحنه بالتواصل معنا عبر واتساب. بمجرد شحن الطرد، لا يمكن الإلغاء.",
            },
            {
              question: "كيف أتابع حالة طلبي؟",
              answer:
                'توجهي إلى صفحة "تتبع الطلب" وأدخلي رقم التتبع. سترين السجل الكامل لطردك في الوقت الفعلي.',
            },
          ],
        },
      ] as FAQCategory[],
      cta: {
        title: "لم تجدي إجابتك؟",
        desc: "فريقنا متاح من الأحد إلى الخميس، 9سا-18سا.",
        contact: "تواصلي معنا",
        whatsapp: "اكتبي على واتساب",
      },
    },
  };

  const t = isAr ? content.ar : content.fr;

  // Flatten all Q&A for JSON-LD
  const allQuestions = t.categories.flatMap((cat) =>
    cat.items.map((item) => ({
      question: item.question,
      answer: item.answer,
    }))
  );

  return (
    <>
      <FAQJsonLd questions={allQuestions} />

      <div
        className={`min-h-screen bg-white pt-32 pb-20 ${isAr ? "rtl" : ""}`}
      >
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Hero */}
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-4 block">
              {t.badge}
            </span>
            <h1 className="text-3xl md:text-5xl font-serif font-medium text-gray-900 mb-6">
              {t.title}
            </h1>
            <p className="text-lg text-gray-500 font-light leading-relaxed max-w-2xl mx-auto">
              {t.subtitle}
            </p>
          </div>

          {/* FAQ Categories */}
          <div className="space-y-12">
            {t.categories.map((category, catIndex) => (
              <div key={catIndex} className="border-t border-gray-100 pt-12">
                {/* Category Header */}
                <div className="flex items-center gap-4 mb-8">
                  <category.icon
                    size={20}
                    className="text-gray-400"
                  />
                  <h2 className="text-xl font-serif font-medium text-gray-900">
                    {category.title}
                  </h2>
                </div>

                {/* Questions Accordion */}
                <div className="space-y-0">
                  {category.items.map((item, itemIndex) => {
                    const id = `${catIndex}-${itemIndex}`;
                    const isOpen = openId === id;

                    return (
                      <div
                        key={id}
                        className="border-b border-gray-100 last:border-b-0"
                      >
                        <button
                          onClick={() => toggle(id)}
                          className={`w-full flex items-start justify-between gap-4 py-5 text-${isAr ? "right" : "left"} group`}
                        >
                          <span
                            className={`text-base font-medium transition-colors ${
                              isOpen
                                ? "text-gray-900"
                                : "text-gray-600 group-hover:text-gray-900"
                            }`}
                          >
                            {item.question}
                          </span>
                          <ChevronDown
                            size={18}
                            className={`text-gray-400 mt-1 flex-shrink-0 transition-transform duration-300 ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        <div
                          className={`overflow-hidden transition-all duration-300 ease-in-out ${
                            isOpen ? "max-h-96 pb-5" : "max-h-0"
                          }`}
                        >
                          <p className="text-gray-500 font-light leading-relaxed">
                            {item.answer}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="mt-20 text-center border-t border-gray-100 pt-16">
            <HelpCircle size={32} className="text-gray-300 mx-auto mb-6" />
            <h3 className="text-2xl font-serif font-medium text-gray-900 mb-3">
              {t.cta.title}
            </h3>
            <p className="text-gray-500 font-light mb-8">{t.cta.desc}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/contact"
                className="px-8 py-3.5 bg-gray-900 text-white rounded-full font-medium text-sm uppercase tracking-wider hover:bg-gray-800 transition-colors"
              >
                {t.cta.contact}
              </Link>
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-8 py-3.5 bg-[#25D366] text-white rounded-full font-medium text-sm uppercase tracking-wider hover:bg-[#20bd5a] transition-colors"
              >
                <MessageCircle size={18} />
                {t.cta.whatsapp}
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
