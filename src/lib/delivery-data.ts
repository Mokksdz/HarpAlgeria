export type DeliveryProvider = "ZR Express" | "Yalidine";
export type DeliveryType = "HOME" | "DESK";

interface DeliveryRate {
  wilayaCode: number;
  wilayaName: string;
  zrExpress: {
    home: number;
    desk: number;
  };
  yalidine: {
    home: number;
    desk: number;
  };
}

export const deliveryRates: DeliveryRate[] = [
  {
    wilayaCode: 1,
    wilayaName: "Adrar",
    zrExpress: { home: 1400, desk: 970 },
    yalidine: { home: 1850, desk: 1750 },
  },
  {
    wilayaCode: 2,
    wilayaName: "Chlef",
    zrExpress: { home: 850, desk: 520 },
    yalidine: { home: 900, desk: 850 },
  },
  {
    wilayaCode: 3,
    wilayaName: "Laghouat",
    zrExpress: { home: 950, desk: 620 },
    yalidine: { home: 1050, desk: 1000 },
  },
  {
    wilayaCode: 4,
    wilayaName: "Oum El Bouaghi",
    zrExpress: { home: 850, desk: 520 },
    yalidine: { home: 900, desk: 850 },
  },
  {
    wilayaCode: 5,
    wilayaName: "Batna",
    zrExpress: { home: 900, desk: 520 },
    yalidine: { home: 900, desk: 850 },
  },
  {
    wilayaCode: 6,
    wilayaName: "Bejaia",
    zrExpress: { home: 800, desk: 520 },
    yalidine: { home: 900, desk: 850 },
  },
  {
    wilayaCode: 7,
    wilayaName: "Biskra",
    zrExpress: { home: 950, desk: 620 },
    yalidine: { home: 1050, desk: 1000 },
  },
  {
    wilayaCode: 8,
    wilayaName: "Bechar",
    zrExpress: { home: 1100, desk: 720 },
    yalidine: { home: 1850, desk: 1750 },
  },
  {
    wilayaCode: 9,
    wilayaName: "Blida",
    zrExpress: { home: 600, desk: 470 },
    yalidine: { home: 700, desk: 650 },
  },
  {
    wilayaCode: 10,
    wilayaName: "Bouira",
    zrExpress: { home: 700, desk: 520 },
    yalidine: { home: 900, desk: 850 },
  },
  {
    wilayaCode: 11,
    wilayaName: "Tamanrasset",
    zrExpress: { home: 1600, desk: 1120 },
    yalidine: { home: 1850, desk: 1750 },
  },
  {
    wilayaCode: 12,
    wilayaName: "Tebessa",
    zrExpress: { home: 900, desk: 570 },
    yalidine: { home: 1050, desk: 1000 },
  },
  {
    wilayaCode: 13,
    wilayaName: "Tlemcen",
    zrExpress: { home: 900, desk: 570 },
    yalidine: { home: 900, desk: 850 },
  },
  {
    wilayaCode: 14,
    wilayaName: "Tiaret",
    zrExpress: { home: 850, desk: 520 },
    yalidine: { home: 900, desk: 850 },
  },
  {
    wilayaCode: 15,
    wilayaName: "Tizi Ouzou",
    zrExpress: { home: 750, desk: 520 },
    yalidine: { home: 900, desk: 850 },
  },
  {
    wilayaCode: 16,
    wilayaName: "Alger",
    zrExpress: { home: 500, desk: 370 },
    yalidine: { home: 600, desk: 550 },
  },
  {
    wilayaCode: 17,
    wilayaName: "Djelfa",
    zrExpress: { home: 950, desk: 570 },
    yalidine: { home: 1050, desk: 1000 },
  },
  {
    wilayaCode: 18,
    wilayaName: "Jijel",
    zrExpress: { home: 900, desk: 520 },
    yalidine: { home: 900, desk: 850 },
  },
  {
    wilayaCode: 19,
    wilayaName: "Setif",
    zrExpress: { home: 800, desk: 520 },
    yalidine: { home: 900, desk: 850 },
  },
  {
    wilayaCode: 20,
    wilayaName: "Saida",
    zrExpress: { home: 900, desk: 570 },
    yalidine: { home: 900, desk: 850 },
  },
  {
    wilayaCode: 21,
    wilayaName: "Skikda",
    zrExpress: { home: 900, desk: 520 },
    yalidine: { home: 900, desk: 850 },
  },
  {
    wilayaCode: 22,
    wilayaName: "Sidi Bel Abbes",
    zrExpress: { home: 900, desk: 520 },
    yalidine: { home: 900, desk: 850 },
  },
  {
    wilayaCode: 23,
    wilayaName: "Annaba",
    zrExpress: { home: 850, desk: 520 },
    yalidine: { home: 900, desk: 850 },
  },
  {
    wilayaCode: 24,
    wilayaName: "Guelma",
    zrExpress: { home: 900, desk: 520 },
    yalidine: { home: 900, desk: 850 },
  },
  {
    wilayaCode: 25,
    wilayaName: "Constantine",
    zrExpress: { home: 800, desk: 520 },
    yalidine: { home: 900, desk: 850 },
  },
  {
    wilayaCode: 26,
    wilayaName: "Medea",
    zrExpress: { home: 800, desk: 520 },
    yalidine: { home: 900, desk: 850 },
  },
  {
    wilayaCode: 27,
    wilayaName: "Mostaganem",
    zrExpress: { home: 900, desk: 520 },
    yalidine: { home: 900, desk: 850 },
  },
  {
    wilayaCode: 28,
    wilayaName: "M'Sila",
    zrExpress: { home: 850, desk: 570 },
    yalidine: { home: 900, desk: 850 },
  },
  {
    wilayaCode: 29,
    wilayaName: "Mascara",
    zrExpress: { home: 900, desk: 520 },
    yalidine: { home: 900, desk: 850 },
  },
  {
    wilayaCode: 30,
    wilayaName: "Ouargla",
    zrExpress: { home: 950, desk: 670 },
    yalidine: { home: 1050, desk: 1000 },
  },
  {
    wilayaCode: 31,
    wilayaName: "Oran",
    zrExpress: { home: 800, desk: 520 },
    yalidine: { home: 900, desk: 850 },
  },
  {
    wilayaCode: 32,
    wilayaName: "El Bayadh",
    zrExpress: { home: 1100, desk: 670 },
    yalidine: { home: 1850, desk: 1750 },
  },
  {
    wilayaCode: 33,
    wilayaName: "Illizi",
    zrExpress: { home: 0, desk: 0 },
    yalidine: { home: 1850, desk: 1750 },
  }, // ZR not available?
  {
    wilayaCode: 34,
    wilayaName: "Bordj Bou Arreridj",
    zrExpress: { home: 800, desk: 520 },
    yalidine: { home: 900, desk: 850 },
  },
  {
    wilayaCode: 35,
    wilayaName: "Boumerdes",
    zrExpress: { home: 700, desk: 520 },
    yalidine: { home: 700, desk: 650 },
  },
  {
    wilayaCode: 36,
    wilayaName: "El Tarf",
    zrExpress: { home: 850, desk: 520 },
    yalidine: { home: 900, desk: 850 },
  },
  {
    wilayaCode: 37,
    wilayaName: "Tindouf",
    zrExpress: { home: 0, desk: 0 },
    yalidine: { home: 1850, desk: 1750 },
  }, // ZR not available?
  {
    wilayaCode: 38,
    wilayaName: "Tissemsilt",
    zrExpress: { home: 900, desk: 0 },
    yalidine: { home: 900, desk: 850 },
  },
  {
    wilayaCode: 39,
    wilayaName: "El Oued",
    zrExpress: { home: 950, desk: 670 },
    yalidine: { home: 1050, desk: 1000 },
  },
  {
    wilayaCode: 40,
    wilayaName: "Khenchela",
    zrExpress: { home: 900, desk: 0 },
    yalidine: { home: 900, desk: 850 },
  },
  {
    wilayaCode: 41,
    wilayaName: "Souk Ahras",
    zrExpress: { home: 900, desk: 520 },
    yalidine: { home: 900, desk: 850 },
  },
  {
    wilayaCode: 42,
    wilayaName: "Tipaza",
    zrExpress: { home: 700, desk: 520 },
    yalidine: { home: 700, desk: 650 },
  },
  {
    wilayaCode: 43,
    wilayaName: "Mila",
    zrExpress: { home: 900, desk: 520 },
    yalidine: { home: 900, desk: 850 },
  },
  {
    wilayaCode: 44,
    wilayaName: "Ain Defla",
    zrExpress: { home: 900, desk: 520 },
    yalidine: { home: 900, desk: 850 },
  },
  {
    wilayaCode: 45,
    wilayaName: "Naama",
    zrExpress: { home: 1100, desk: 670 },
    yalidine: { home: 1850, desk: 1750 },
  },
  {
    wilayaCode: 46,
    wilayaName: "Ain Temouchent",
    zrExpress: { home: 900, desk: 520 },
    yalidine: { home: 900, desk: 850 },
  },
  {
    wilayaCode: 47,
    wilayaName: "Ghardaia",
    zrExpress: { home: 950, desk: 620 },
    yalidine: { home: 1050, desk: 1000 },
  },
  {
    wilayaCode: 48,
    wilayaName: "Relizane",
    zrExpress: { home: 900, desk: 520 },
    yalidine: { home: 900, desk: 850 },
  },
  {
    wilayaCode: 49,
    wilayaName: "Timimoun",
    zrExpress: { home: 1400, desk: 0 },
    yalidine: { home: 1850, desk: 1750 },
  },
  {
    wilayaCode: 50,
    wilayaName: "Bordj Badji Mokhtar",
    zrExpress: { home: 0, desk: 0 },
    yalidine: { home: 1850, desk: 1750 },
  },
  {
    wilayaCode: 51,
    wilayaName: "Ouled Djellal",
    zrExpress: { home: 950, desk: 620 },
    yalidine: { home: 1050, desk: 1000 },
  },
  {
    wilayaCode: 52,
    wilayaName: "Beni Abbes",
    zrExpress: { home: 1100, desk: 970 },
    yalidine: { home: 1850, desk: 1750 },
  },
  {
    wilayaCode: 53,
    wilayaName: "In Salah",
    zrExpress: { home: 1600, desk: 0 },
    yalidine: { home: 1850, desk: 1750 },
  },
  {
    wilayaCode: 54,
    wilayaName: "In Guezzam",
    zrExpress: { home: 1600, desk: 0 },
    yalidine: { home: 1850, desk: 1750 },
  },
  {
    wilayaCode: 55,
    wilayaName: "Touggourt",
    zrExpress: { home: 950, desk: 670 },
    yalidine: { home: 1050, desk: 1000 },
  },
  {
    wilayaCode: 56,
    wilayaName: "Djanet",
    zrExpress: { home: 0, desk: 0 },
    yalidine: { home: 1850, desk: 1750 },
  },
  {
    wilayaCode: 57,
    wilayaName: "M'Ghair",
    zrExpress: { home: 950, desk: 0 },
    yalidine: { home: 1050, desk: 1000 },
  },
  {
    wilayaCode: 58,
    wilayaName: "El Menia",
    zrExpress: { home: 1000, desk: 0 },
    yalidine: { home: 1050, desk: 1000 },
  },
  {
    wilayaCode: 59,
    wilayaName: "Aflou",
    zrExpress: { home: 950, desk: 620 },
    yalidine: { home: 1050, desk: 1000 },
  },
  {
    wilayaCode: 60,
    wilayaName: "Barika",
    zrExpress: { home: 900, desk: 520 },
    yalidine: { home: 900, desk: 850 },
  },
  {
    wilayaCode: 61,
    wilayaName: "Ksar Chellala",
    zrExpress: { home: 850, desk: 520 },
    yalidine: { home: 900, desk: 850 },
  },
  {
    wilayaCode: 62,
    wilayaName: "Messaad",
    zrExpress: { home: 950, desk: 570 },
    yalidine: { home: 1050, desk: 1000 },
  },
  {
    wilayaCode: 63,
    wilayaName: "Ain Oussara",
    zrExpress: { home: 950, desk: 570 },
    yalidine: { home: 1050, desk: 1000 },
  },
  {
    wilayaCode: 64,
    wilayaName: "Bou Saada",
    zrExpress: { home: 850, desk: 570 },
    yalidine: { home: 900, desk: 850 },
  },
  {
    wilayaCode: 65,
    wilayaName: "El Abiodh Sidi Cheikh",
    zrExpress: { home: 1100, desk: 670 },
    yalidine: { home: 1850, desk: 1750 },
  },
  {
    wilayaCode: 66,
    wilayaName: "El Kantara",
    zrExpress: { home: 950, desk: 620 },
    yalidine: { home: 1050, desk: 1000 },
  },
  {
    wilayaCode: 67,
    wilayaName: "Bir El Ater",
    zrExpress: { home: 900, desk: 570 },
    yalidine: { home: 1050, desk: 1000 },
  },
  {
    wilayaCode: 68,
    wilayaName: "Ksar El Boukhari",
    zrExpress: { home: 800, desk: 520 },
    yalidine: { home: 900, desk: 850 },
  },
  {
    wilayaCode: 69,
    wilayaName: "El Aricha",
    zrExpress: { home: 900, desk: 570 },
    yalidine: { home: 900, desk: 850 },
  },
];

export function getDeliveryPrice(
  wilayaCode: number,
  provider: DeliveryProvider,
  type: DeliveryType,
): number {
  const rate = deliveryRates.find((r) => r.wilayaCode === wilayaCode);
  // Bug #25: Return -1 for unknown wilayas instead of 0 (which implies free shipping)
  if (!rate) return -1;

  if (provider === "ZR Express") {
    return type === "HOME" ? rate.zrExpress.home : rate.zrExpress.desk;
  } else {
    return type === "HOME" ? rate.yalidine.home : rate.yalidine.desk;
  }
}

// Bug #25: Check if a provider is available for a given wilaya
export function isProviderAvailable(
  wilayaCode: number,
  provider: DeliveryProvider,
  type: DeliveryType,
): boolean {
  const price = getDeliveryPrice(wilayaCode, provider, type);
  return price > 0;
}
