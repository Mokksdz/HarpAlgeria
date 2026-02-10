/**
 * ZR Express API Integration (New Platform)
 * API Base URL: https://api.zrexpress.app/api/v1
 * Docs: https://docs.zrexpress.app/reference
 * Auth: X-Tenant + X-Api-Key headers
 */

// ── Types ──────────────────────────────────────────────────────────────

export interface ZRCreateParcel {
  customer: {
    name: string;
    phone: { number1: string; number2?: string };
  };
  deliveryAddress: {
    cityTerritoryId: string;      // UUID wilaya
    districtTerritoryId?: string;  // UUID commune
    street: string;
  };
  orderedProducts: {
    productName: string;
    unitPrice: number;
    quantity: number;
  }[];
  deliveryType: "home" | "pickup-point";
  description?: string;
  amount: number;
  externalId?: string;
}

export interface ZRColisResponse {
  success: boolean;
  tracking?: string;
  parcelId?: string;
  message?: string;
  data?: any;
}

export interface ZRTerritory {
  id: string;
  code: number;
  name: string;
  postalCode?: string;
  level: "city" | "district";
  parentId?: string;
  delivery?: {
    hasHomeDelivery: boolean;
    hasPickupPoint: boolean;
  };
}

export interface ZRRate {
  toTerritoryId: string;
  toTerritoryCode: number;
  toTerritoryName: string;
  deliveryPrices: { deliveryType: string; price: number }[];
}

// ── Configuration ──────────────────────────────────────────────────────

const ZR_CONFIG = {
  baseUrl: process.env.ZR_EXPRESS_API_URL || "https://api.zrexpress.app/api/v1",
  tenantId: process.env.ZR_EXPRESS_TENANT_ID || "",
  apiKey: process.env.ZR_EXPRESS_API_KEY || "",
  // Legacy fallback (old procolis.com credentials)
  legacyToken: process.env.ZR_EXPRESS_TOKEN || "",
  legacyKey: process.env.ZR_EXPRESS_KEY || "",
};

// ── Territory cache (wilaya name → UUID) ───────────────────────────────

const territoryCache = new Map<string, string>();

// ── Client API ─────────────────────────────────────────────────────────

class ZRExpressClient {
  private tenantId: string;
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.tenantId = ZR_CONFIG.tenantId;
    this.apiKey = ZR_CONFIG.apiKey;
    this.baseUrl = ZR_CONFIG.baseUrl;
  }

  private async request<T>(
    endpoint: string,
    method: "GET" | "POST" | "PATCH" | "DELETE" = "GET",
    body?: any,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "X-Tenant": this.tenantId,
      "X-Api-Key": this.apiKey,
    };

    try {
      console.log(`ZR Express API ${method} ${endpoint}`, body ? JSON.stringify(body).slice(0, 500) : "");

      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      // Handle empty responses (204, etc.)
      const text = await response.text();

      if (!response.ok) {
        console.error(`ZR Express API HTTP ${response.status}:`, text.slice(0, 500));
        // Try to parse error JSON
        try {
          const errorJson = JSON.parse(text);
          throw new Error(errorJson.detail || errorJson.title || errorJson.message || `HTTP ${response.status}`);
        } catch (e) {
          if (e instanceof Error && e.message !== `HTTP ${response.status}`) throw e;
          throw new Error(`ZR Express API HTTP ${response.status}: ${text.slice(0, 200)}`);
        }
      }

      if (!text) return {} as T;
      return JSON.parse(text);
    } catch (error) {
      console.error("ZR Express API Error:", error);
      throw error;
    }
  }

  // ── Connection Test ──────────────────────────────────────────────────

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.request("/users/profile", "GET");
      return { success: true, message: "Connexion réussie" };
    } catch (error: any) {
      return { success: false, message: error?.message || "Échec de connexion" };
    }
  }

  // ── Territories (Wilayas & Communes) ─────────────────────────────────

  async searchTerritories(keyword: string): Promise<ZRTerritory[]> {
    try {
      const result = await this.request<{ items: ZRTerritory[] }>(
        "/territories/search",
        "POST",
        { keyword, pageSize: 50, pageNumber: 1, includeUnavailable: false },
      );
      return result.items || [];
    } catch {
      return [];
    }
  }

  /**
   * Resolve a wilaya name or numeric ID to a territory UUID.
   * Searches the API and caches results.
   */
  async resolveWilayaId(wilayaNameOrCode: string): Promise<string | null> {
    // Check cache
    const cacheKey = wilayaNameOrCode.toLowerCase().trim();
    if (territoryCache.has(cacheKey)) {
      return territoryCache.get(cacheKey)!;
    }

    // Try searching by name first
    const searchTerm = WILAYAS.find(
      (w) =>
        w.id === wilayaNameOrCode ||
        w.name.toLowerCase() === cacheKey ||
        w.name_ar === wilayaNameOrCode,
    )?.name || wilayaNameOrCode;

    const results = await this.searchTerritories(searchTerm);

    // Find a city-level territory (wilaya)
    const city = results.find(
      (t) =>
        t.level === "city" &&
        (t.name.toLowerCase() === searchTerm.toLowerCase() ||
          t.code === parseInt(wilayaNameOrCode)),
    ) || results.find((t) => t.level === "city");

    if (city) {
      territoryCache.set(cacheKey, city.id);
      return city.id;
    }

    return null;
  }

  /**
   * Resolve a commune name within a wilaya to a territory UUID.
   */
  async resolveCommuneId(communeName: string, wilayaName?: string): Promise<string | null> {
    const cacheKey = `commune:${communeName}:${wilayaName || ""}`.toLowerCase();
    if (territoryCache.has(cacheKey)) {
      return territoryCache.get(cacheKey)!;
    }

    const results = await this.searchTerritories(communeName);
    const district = results.find((t) => t.level === "district");

    if (district) {
      territoryCache.set(cacheKey, district.id);
      return district.id;
    }

    return null;
  }

  // ── Delivery Rates ───────────────────────────────────────────────────

  async getRates(): Promise<ZRRate[]> {
    try {
      const result = await this.request<{ rates: ZRRate[] }>("/delivery-pricing/rates", "GET");
      return result.rates || [];
    } catch {
      return [];
    }
  }

  // ── Parcel Creation ──────────────────────────────────────────────────

  async createParcel(parcel: ZRCreateParcel): Promise<ZRColisResponse> {
    try {
      const result = await this.request<{ id: string }>(
        "/parcels",
        "POST",
        parcel,
      );

      console.log("ZR Express createParcel response:", JSON.stringify(result));

      if (result?.id) {
        return {
          success: true,
          parcelId: result.id,
          tracking: result.id, // parcelId serves as reference until tracking is assigned
          message: "Colis créé",
          data: result,
        };
      }

      return {
        success: false,
        message: "Réponse inattendue de ZR Express",
        data: result,
      };
    } catch (error: any) {
      console.error("ZR Express createParcel error:", error);
      return {
        success: false,
        message: error?.message || "Erreur création colis ZR Express",
      };
    }
  }

  // ── High-level: Create Shipment from order data ──────────────────────

  async createShipment(orderData: {
    customerName: string;
    customerPhone: string;
    customerPhoneB?: string;
    address: string;
    wilayaId: string;      // Numeric code or name
    commune: string;
    total: number;
    products: string;
    deliveryType: string;  // "HOME", "DOMICILE", "STOP_DESK", "DESK"
    externalId?: string;
    notes?: string;
  }): Promise<ZRColisResponse> {
    try {
      // Resolve territory UUIDs
      const cityId = await this.resolveWilayaId(orderData.wilayaId);
      if (!cityId) {
        return {
          success: false,
          message: `Wilaya non trouvée: ${orderData.wilayaId}`,
        };
      }

      const districtId = await this.resolveCommuneId(orderData.commune, orderData.wilayaId);

      const deliveryType: "home" | "pickup-point" =
        orderData.deliveryType === "STOP_DESK" ||
        orderData.deliveryType === "DESK" ||
        orderData.deliveryType === "pickup-point"
          ? "pickup-point"
          : "home";

      const parcel: ZRCreateParcel = {
        customer: {
          name: orderData.customerName,
          phone: {
            number1: orderData.customerPhone.replace(/\s/g, ""),
            number2: orderData.customerPhoneB || undefined,
          },
        },
        deliveryAddress: {
          cityTerritoryId: cityId,
          districtTerritoryId: districtId || undefined,
          street: orderData.address,
        },
        orderedProducts: [
          {
            productName: orderData.products || "Articles Harp",
            unitPrice: orderData.total,
            quantity: 1,
          },
        ],
        deliveryType,
        description: orderData.notes || undefined,
        amount: orderData.total,
        externalId: orderData.externalId,
      };

      return await this.createParcel(parcel);
    } catch (error: any) {
      console.error("ZR Express createShipment error:", error);
      return {
        success: false,
        message: error?.message || "Erreur création colis ZR Express",
      };
    }
  }

  // ── Get Parcel (Tracking) ────────────────────────────────────────────

  async getParcel(parcelIdOrTracking: string): Promise<any> {
    try {
      return await this.request(`/parcels/${parcelIdOrTracking}`, "GET");
    } catch {
      return null;
    }
  }

  // ── Search Parcels ───────────────────────────────────────────────────

  async searchParcels(query: string): Promise<any> {
    return this.request("/parcels/search", "POST", {
      keyword: query,
      pageSize: 20,
      pageNumber: 1,
    });
  }
}

// ── Singleton ──────────────────────────────────────────────────────────

let zrClient: ZRExpressClient | null = null;

export function getZRClient(): ZRExpressClient {
  if (!zrClient) {
    zrClient = new ZRExpressClient();
  }
  return zrClient;
}

// ── Mapper le statut ZR Express vers statut Harp ───────────────────────

export function mapZRStatusToHarpStatus(zrStatus: string): string {
  const statusMap: Record<string, string> = {
    "En préparation": "CONFIRMED",
    "Prêt à expédier": "CONFIRMED",
    "En cours de ramassage": "CONFIRMED",
    Ramassé: "SHIPPED",
    "Au hub": "SHIPPED",
    "En transit": "SHIPPED",
    "Reçu à destination": "SHIPPED",
    "En cours de livraison": "SHIPPED",
    Livré: "DELIVERED",
    "Livré (payé)": "DELIVERED",
    Retourné: "CANCELLED",
    Annulé: "CANCELLED",
  };
  return statusMap[zrStatus] || "PENDING";
}

// ── Liste des 69 wilayas d'Algérie ────────────────────────────────────

export const WILAYAS = [
  { id: "1", name: "Adrar", name_ar: "أدرار" },
  { id: "2", name: "Chlef", name_ar: "الشلف" },
  { id: "3", name: "Laghouat", name_ar: "الأغواط" },
  { id: "4", name: "Oum El Bouaghi", name_ar: "أم البواقي" },
  { id: "5", name: "Batna", name_ar: "باتنة" },
  { id: "6", name: "Béjaïa", name_ar: "بجاية" },
  { id: "7", name: "Biskra", name_ar: "بسكرة" },
  { id: "8", name: "Béchar", name_ar: "بشار" },
  { id: "9", name: "Blida", name_ar: "البليدة" },
  { id: "10", name: "Bouira", name_ar: "البويرة" },
  { id: "11", name: "Tamanrasset", name_ar: "تمنراست" },
  { id: "12", name: "Tébessa", name_ar: "تبسة" },
  { id: "13", name: "Tlemcen", name_ar: "تلمسان" },
  { id: "14", name: "Tiaret", name_ar: "تيارت" },
  { id: "15", name: "Tizi Ouzou", name_ar: "تيزي وزو" },
  { id: "16", name: "Alger", name_ar: "الجزائر" },
  { id: "17", name: "Djelfa", name_ar: "الجلفة" },
  { id: "18", name: "Jijel", name_ar: "جيجل" },
  { id: "19", name: "Sétif", name_ar: "سطيف" },
  { id: "20", name: "Saïda", name_ar: "سعيدة" },
  { id: "21", name: "Skikda", name_ar: "سكيكدة" },
  { id: "22", name: "Sidi Bel Abbès", name_ar: "سيدي بلعباس" },
  { id: "23", name: "Annaba", name_ar: "عنابة" },
  { id: "24", name: "Guelma", name_ar: "قالمة" },
  { id: "25", name: "Constantine", name_ar: "قسنطينة" },
  { id: "26", name: "Médéa", name_ar: "المدية" },
  { id: "27", name: "Mostaganem", name_ar: "مستغانم" },
  { id: "28", name: "M'Sila", name_ar: "المسيلة" },
  { id: "29", name: "Mascara", name_ar: "معسكر" },
  { id: "30", name: "Ouargla", name_ar: "ورقلة" },
  { id: "31", name: "Oran", name_ar: "وهران" },
  { id: "32", name: "El Bayadh", name_ar: "البيض" },
  { id: "33", name: "Illizi", name_ar: "إليزي" },
  { id: "34", name: "Bordj Bou Arreridj", name_ar: "برج بوعريريج" },
  { id: "35", name: "Boumerdès", name_ar: "بومرداس" },
  { id: "36", name: "El Tarf", name_ar: "الطارف" },
  { id: "37", name: "Tindouf", name_ar: "تندوف" },
  { id: "38", name: "Tissemsilt", name_ar: "تيسمسيلت" },
  { id: "39", name: "El Oued", name_ar: "الوادي" },
  { id: "40", name: "Khenchela", name_ar: "خنشلة" },
  { id: "41", name: "Souk Ahras", name_ar: "سوق أهراس" },
  { id: "42", name: "Tipaza", name_ar: "تيبازة" },
  { id: "43", name: "Mila", name_ar: "ميلة" },
  { id: "44", name: "Aïn Defla", name_ar: "عين الدفلى" },
  { id: "45", name: "Naâma", name_ar: "النعامة" },
  { id: "46", name: "Aïn Témouchent", name_ar: "عين تموشنت" },
  { id: "47", name: "Ghardaïa", name_ar: "غرداية" },
  { id: "48", name: "Relizane", name_ar: "غليزان" },
  { id: "49", name: "El M'Ghair", name_ar: "المغير" },
  { id: "50", name: "El Meniaa", name_ar: "المنيعة" },
  { id: "51", name: "Ouled Djellal", name_ar: "أولاد جلال" },
  { id: "52", name: "Bordj Baji Mokhtar", name_ar: "برج باجي مختار" },
  { id: "53", name: "Béni Abbès", name_ar: "بني عباس" },
  { id: "54", name: "Timimoun", name_ar: "تيميمون" },
  { id: "55", name: "Touggourt", name_ar: "تقرت" },
  { id: "56", name: "Djanet", name_ar: "جانت" },
  { id: "57", name: "In Salah", name_ar: "عين صالح" },
  { id: "58", name: "In Guezzam", name_ar: "عين قزام" },
  { id: "59", name: "Aflou", name_ar: "أفلو" },
  { id: "60", name: "Barika", name_ar: "بريكة" },
  { id: "61", name: "Ksar Chellala", name_ar: "قصر الشلالة" },
  { id: "62", name: "Messaad", name_ar: "مسعد" },
  { id: "63", name: "Aïn Oussara", name_ar: "عين وسارة" },
  { id: "64", name: "Bou Saâda", name_ar: "بوسعادة" },
  { id: "65", name: "El Abiodh Sidi Cheikh", name_ar: "الأبيض سيدي الشيخ" },
  { id: "66", name: "El Kantara", name_ar: "القنطرة" },
  { id: "67", name: "Bir El Ater", name_ar: "بئر العاتر" },
  { id: "68", name: "Ksar El Boukhari", name_ar: "قصر البخاري" },
  { id: "69", name: "El Aricha", name_ar: "العريشة" },
];

export default ZRExpressClient;
