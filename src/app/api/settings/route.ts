import { NextResponse } from "next/server";

// GET site settings
export async function GET() {
  // Return default settings - can be extended to use database
  const settings = {
    promoBanner: {
      enabled: true,
      message: "Livraison gratuite à partir de 5000 DZD",
      link: "/shop",
      backgroundColor: "#000000",
      textColor: "#ffffff",
    },
    site: {
      name: "HARP",
      tagline: "Mode Algérienne Contemporaine",
      currency: "DZD",
      locale: "fr-DZ",
    },
    shipping: {
      freeShippingThreshold: 5000,
      defaultProvider: "yalidine",
    },
    social: {
      instagram: "https://instagram.com/harp.dz",
      facebook: "https://facebook.com/harp.dz",
    },
  };

  return NextResponse.json(settings);
}
