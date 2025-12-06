// Site Configuration
// Change these values to customize your site

export const siteConfig = {
  // Brand
  name: "Harp",
  tagline: "Une élégance qui résonne",

  // Contact - UPDATE THESE VALUES
  whatsapp: {
    number: "213561777397", // Format: country code + number without +
    display: "0561 77 73 97", // Display format
  },
  email: "contact@harpalgeria.com",

  // Social Media
  social: {
    instagram: "https://www.instagram.com/harp_algeria",
    facebook: "https://www.facebook.com/profile.php?id=61566880453440",
    tiktok: "https://www.tiktok.com/@harp.algeria",
  },

  // Location
  location: {
    city: "Alger",
    country: "Algérie",
  },

  // Business Hours
  hours: {
    days: "Dimanche - Jeudi",
    time: "9h - 18h",
  },
};

// Helper to get WhatsApp link
export const getWhatsAppLink = (message?: string) => {
  const base = `https://wa.me/${siteConfig.whatsapp.number}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
};
