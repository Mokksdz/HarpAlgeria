// Textes de la promo "Livraison gratuite du jeudi soir au samedi soir"

export const promoTexts = {
  // Top Banner (3 versions)
  banner: {
    fr: [
      "Livraison offerte · Du jeudi soir au samedi soir",
      "Ce week-end, on vous livre gratuitement",
      "🚚 Livraison gratuite jusqu'à samedi soir",
    ],
    ar: [
      "التوصيل مجاني · من مساء الخميس إلى مساء السبت",
      "هذا الأسبوع، نوصّلك مجاناً",
      "🚚 توصيل مجاني حتى مساء السبت",
    ],
  },

  // Hero Section
  hero: {
    title: {
      fr: "La livraison est pour nous.",
      ar: "التوصيل علينا.",
    },
    subtitle: {
      fr: "Du jeudi soir au samedi soir, profitez de la livraison offerte sur toute la collection.",
      ar: "من مساء الخميس إلى مساء السبت، استمتعي بتوصيل مجاني على كامل التشكيلة.",
    },
    cta: {
      fr: "Découvrir la collection",
      ar: "اكتشفي التشكيلة",
    },
  },

  // Badge produit
  productBadge: {
    fr: "🚚 Livraison offerte ce week-end",
    ar: "🚚 توصيل مجاني هذا الأسبوع",
  },

  // Panier
  cart: {
    line: {
      fr: "✓ Livraison gratuite appliquée",
      ar: "✓ تم تطبيق التوصيل المجاني",
    },
    message: {
      fr: "Bonne nouvelle — votre commande est livrée gratuitement jusqu'à samedi soir.",
      ar: "خبر سار — طلبك سيُوصَل مجاناً حتى مساء السبت.",
    },
  },

  // Checkout
  checkout: {
    message: {
      fr: "Livraison offerte jusqu'à samedi soir",
      ar: "توصيل مجاني حتى مساء السبت",
    },
  },

  // Durée limitée
  duration: {
    full: {
      fr: "Offre valable du jeudi soir au samedi soir uniquement.",
      ar: "العرض ساري من مساء الخميس إلى مساء السبت فقط.",
    },
    short: {
      fr: "Jusqu'à samedi soir.",
      ar: "حتى مساء السبت.",
    },
  },
};

// Helper pour vérifier si on est dans la période promo (jeudi 18h → samedi 23h59)
export function isWithinPromoTime(): boolean {
  const now = new Date();
  const day = now.getDay(); // 0 = dimanche, 4 = jeudi, 6 = samedi
  const hour = now.getHours();

  // Jeudi après 18h
  if (day === 4 && hour >= 18) return true;
  // Vendredi toute la journée
  if (day === 5) return true;
  // Samedi jusqu'à 23h59
  if (day === 6) return true;

  return false;
}
