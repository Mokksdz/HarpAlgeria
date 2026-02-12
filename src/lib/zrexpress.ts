/**
 * ZR Express API Integration (New Platform)
 * API Base URL: https://api.zrexpress.app/api/v1
 * Docs: https://docs.zrexpress.app/reference
 * Auth: X-Tenant + X-Api-Key headers
 * Webhooks: Svix-based signature verification
 */

import { createHmac, timingSafeEqual } from "crypto";

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

export interface ZRStateHistoryEntry {
  id?: string;
  stateName: string;
  previousStateName?: string;
  timestamp: string;
  comment?: string;
  hubName?: string;
  deliveryPersonName?: string;
}

export interface ZRWebhookEndpoint {
  id: string;
  url: string;
  description?: string;
  eventTypes: string[];
  headers?: Record<string, string>;
}

export interface ZRWebhookPayload {
  eventType: string;
  data: {
    parcelId?: string;
    trackingNumber?: string;
    newStateId?: string;
    newStateName?: string;
    previousStateName?: string;
    comment?: string;
    timestamp?: string;
    [key: string]: any;
  };
}

// ── Configuration ──────────────────────────────────────────────────────

const ZR_CONFIG = {
  baseUrl: (process.env.ZR_EXPRESS_API_URL || "https://api.zrexpress.app/api/v1").trim(),
  tenantId: (process.env.ZR_EXPRESS_TENANT_ID || "").trim(),
  apiKey: (process.env.ZR_EXPRESS_API_KEY || "").trim(),
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
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "GET",
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
      const items = result.items || [];
      console.log(`[ZR] searchTerritories("${keyword}") → ${items.length} results`, items.map(t => `${t.name} (${t.level})`).slice(0, 10));
      return items;
    } catch (error) {
      console.error(`[ZR] searchTerritories("${keyword}") FAILED:`, error);
      return [];
    }
  }

  async resolveWilayaId(wilayaNameOrCode: string): Promise<string | null> {
    const cacheKey = wilayaNameOrCode.toLowerCase().trim();
    if (territoryCache.has(cacheKey)) {
      return territoryCache.get(cacheKey)!;
    }

    // Look up the wilaya name from our list (handles numeric codes like "16" → "Alger")
    const wilayaEntry = WILAYAS.find(
      (w) =>
        w.id === wilayaNameOrCode ||
        w.name.toLowerCase() === cacheKey ||
        w.name_ar === wilayaNameOrCode,
    );
    const searchTerm = wilayaEntry?.name || wilayaNameOrCode;

    console.log(`[ZR] resolveWilayaId("${wilayaNameOrCode}") → searchTerm: "${searchTerm}" (entry: ${wilayaEntry ? wilayaEntry.name : "none"})`);

    // Helper to find best city match from results
    const findCity = (results: ZRTerritory[]): ZRTerritory | undefined =>
      results.find(
        (t) =>
          t.level === "city" &&
          t.name.toLowerCase() === searchTerm.toLowerCase(),
      ) ||
      results.find(
        (t) =>
          t.level === "city" &&
          t.name.toLowerCase().includes(searchTerm.toLowerCase()),
      ) ||
      results.find((t) => t.level === "city");

    // 1. Try searching by wilaya name
    let results = await this.searchTerritories(searchTerm);
    let city = findCity(results);

    // 2. If no result, try with the Arabic name as fallback
    if (!city && wilayaEntry?.name_ar) {
      results = await this.searchTerritories(wilayaEntry.name_ar);
      city = findCity(results);
    }

    // 3. If still no result and we have a numeric code, try searching with "Wilaya" prefix or code
    if (!city && wilayaEntry) {
      // Try with code as search term (some APIs index by postal/wilaya code)
      results = await this.searchTerritories(wilayaEntry.id);
      city = findCity(results);
    }

    // 4. Last resort: try includeUnavailable=true
    if (!city) {
      try {
        const result = await this.request<{ items: ZRTerritory[] }>(
          "/territories/search",
          "POST",
          { keyword: searchTerm, pageSize: 50, pageNumber: 1, includeUnavailable: true },
        );
        const items = result.items || [];
        console.log(`[ZR] resolveWilayaId fallback (includeUnavailable) for "${searchTerm}" → ${items.length} results`);
        city = items.find(
          (t) => t.level === "city" && t.name.toLowerCase().includes(searchTerm.toLowerCase()),
        ) || items.find((t) => t.level === "city");
      } catch (error) {
        console.error(`[ZR] resolveWilayaId fallback search failed:`, error);
      }
    }

    if (city) {
      territoryCache.set(cacheKey, city.id);
      console.log(`[ZR] Resolved wilaya "${wilayaNameOrCode}" → "${city.name}" (${city.id})`);
      return city.id;
    }

    console.error(`[ZR] Could not resolve wilaya: "${wilayaNameOrCode}" (searched: "${searchTerm}", entry: ${JSON.stringify(wilayaEntry)})`);
    return null;
  }

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
          tracking: result.id,
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
    wilayaId: string;
    commune: string;
    total: number;
    products: string;
    deliveryType: string;
    externalId?: string;
    notes?: string;
  }): Promise<ZRColisResponse> {
    try {
      console.log("[ZR] createShipment input:", JSON.stringify(orderData));

      const cityId = await this.resolveWilayaId(orderData.wilayaId);
      if (!cityId) {
        return {
          success: false,
          message: `Wilaya non trouvée dans ZR Express: "${orderData.wilayaId}". Vérifiez que la wilaya existe dans votre compte ZR Express.`,
        };
      }

      const districtId = await this.resolveCommuneId(orderData.commune, orderData.wilayaId);
      console.log(`[ZR] Resolved territory: wilaya "${orderData.wilayaId}" → ${cityId}, commune "${orderData.commune}" → ${districtId || "(non trouvée)"}`);

      const deliveryType: "home" | "pickup-point" =
        orderData.deliveryType === "STOP_DESK" ||
        orderData.deliveryType === "DESK" ||
        orderData.deliveryType === "pickup-point"
          ? "pickup-point"
          : "home";

      const phone1 = orderData.customerPhone.replace(/\s/g, "");
      if (!phone1 || phone1.length < 9) {
        return {
          success: false,
          message: `Numéro de téléphone invalide: "${phone1}". Minimum 9 chiffres requis.`,
        };
      }

      const parcel: ZRCreateParcel = {
        customer: {
          name: orderData.customerName,
          phone: {
            number1: phone1,
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

      console.log("[ZR] Parcel payload:", JSON.stringify(parcel));

      return await this.createParcel(parcel);
    } catch (error: any) {
      console.error("ZR Express createShipment error:", error);
      return {
        success: false,
        message: error?.message || "Erreur création colis ZR Express",
      };
    }
  }

  // ── Get Parcel by ID ─────────────────────────────────────────────────

  async getParcel(parcelId: string): Promise<any> {
    try {
      return await this.request(`/parcels/${parcelId}`, "GET");
    } catch {
      return null;
    }
  }

  // ── Get Parcel by Tracking Number ────────────────────────────────────

  async getParcelByTracking(trackingNumber: string): Promise<any> {
    try {
      return await this.request(`/parcels/tracking/${trackingNumber}`, "GET");
    } catch {
      return null;
    }
  }

  // ── Get Parcel State History ─────────────────────────────────────────

  async getParcelStateHistory(parcelId: string): Promise<ZRStateHistoryEntry[]> {
    try {
      const result = await this.request<any>(`/parcels/${parcelId}/state-history`, "GET");
      // Normalize response — API may return array directly or wrapped
      const entries = Array.isArray(result) ? result : result?.items || result?.data || [];
      return entries.map((e: any) => ({
        id: e.id,
        stateName: e.stateName || e.newStateName || e.state?.name || "",
        previousStateName: e.previousStateName || e.previousState?.name || "",
        timestamp: e.timestamp || e.createdAt || e.date || "",
        comment: e.comment || "",
        hubName: e.hubName || e.hub?.name || e.arrivalHub?.name || "",
        deliveryPersonName: e.deliveryPersonName || e.deliveryPerson?.name || "",
      }));
    } catch (error) {
      console.error("ZR Express getParcelStateHistory error:", error);
      return [];
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

  // ── Get Workflows (all possible states) ──────────────────────────────

  async getWorkflows(): Promise<any> {
    try {
      return await this.request("/workflows/search", "POST", {
        pageSize: 50,
        pageNumber: 1,
      });
    } catch {
      return null;
    }
  }

  // ── Webhook Management ───────────────────────────────────────────────

  async createWebhook(data: {
    url: string;
    description?: string;
    eventTypes?: string[];
    headers?: Record<string, string>;
  }): Promise<{ id: string } | null> {
    try {
      return await this.request<{ id: string }>("/webhooks/endpoints", "POST", {
        url: data.url,
        description: data.description || "Harp e-commerce webhook",
        eventTypes: data.eventTypes || ["parcel.state.updated"],
        headers: data.headers || {},
      });
    } catch (error) {
      console.error("ZR Express createWebhook error:", error);
      return null;
    }
  }

  async listWebhooks(): Promise<ZRWebhookEndpoint[]> {
    try {
      const result = await this.request<any>("/webhooks/endpoints", "GET");
      return Array.isArray(result) ? result : result?.items || result?.data || [];
    } catch {
      return [];
    }
  }

  async getWebhook(id: string): Promise<ZRWebhookEndpoint | null> {
    try {
      return await this.request<ZRWebhookEndpoint>(`/webhooks/endpoints/${id}`, "GET");
    } catch {
      return null;
    }
  }

  async updateWebhook(id: string, data: {
    url?: string;
    description?: string;
    eventTypes?: string[];
    headers?: Record<string, string>;
  }): Promise<boolean> {
    try {
      await this.request(`/webhooks/endpoints/${id}`, "PUT", data);
      return true;
    } catch {
      return false;
    }
  }

  async deleteWebhook(id: string): Promise<boolean> {
    try {
      await this.request(`/webhooks/endpoints/${id}`, "DELETE");
      return true;
    } catch {
      return false;
    }
  }

  async getWebhookSecret(id: string): Promise<string | null> {
    try {
      const result = await this.request<any>(`/webhooks/endpoints/${id}/secret`, "GET");
      return result?.key || result?.secret || null;
    } catch {
      return null;
    }
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

// ── Svix Webhook Signature Verification ────────────────────────────────

const SVIX_TOLERANCE_SECONDS = 300; // 5 minutes

export function verifySvixSignature(
  payload: string,
  headers: { svixId: string; svixTimestamp: string; svixSignature: string },
  secret: string,
): boolean {
  try {
    const { svixId, svixTimestamp, svixSignature } = headers;

    // Validate timestamp tolerance (prevent replay attacks)
    const ts = parseInt(svixTimestamp, 10);
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - ts) > SVIX_TOLERANCE_SECONDS) {
      console.error("Svix webhook: timestamp too old/new", { ts, now });
      return false;
    }

    // Secret may be base64 with "whsec_" prefix
    const secretBytes = Buffer.from(
      secret.startsWith("whsec_") ? secret.slice(6) : secret,
      "base64",
    );

    // Sign: "{svix-id}.{svix-timestamp}.{body}"
    const signedContent = `${svixId}.${svixTimestamp}.${payload}`;
    const expectedSig = createHmac("sha256", secretBytes)
      .update(signedContent)
      .digest("base64");

    // svix-signature may contain multiple signatures separated by spaces
    const signatures = svixSignature.split(" ");
    for (const sig of signatures) {
      // Each signature is "v1,<base64>"
      const sigValue = sig.startsWith("v1,") ? sig.slice(3) : sig;
      const sigBuf = Buffer.from(sigValue, "base64");
      const expectedBuf = Buffer.from(expectedSig, "base64");

      if (sigBuf.length === expectedBuf.length && timingSafeEqual(sigBuf, expectedBuf)) {
        return true;
      }
    }

    console.error("Svix webhook: signature mismatch");
    return false;
  } catch (error) {
    console.error("Svix webhook verification error:", error);
    return false;
  }
}

// ── Mapper le statut ZR Express vers statut Harp ───────────────────────

export function mapZRStatusToHarpStatus(zrStatus: string): string {
  const statusLower = zrStatus.toLowerCase();

  // Match by keyword for robustness with API state name variations
  if (statusLower.includes("livré") || statusLower.includes("delivered") || statusLower.includes("payé")) {
    return "DELIVERED";
  }
  if (statusLower.includes("retour") || statusLower.includes("annul") || statusLower.includes("cancel") || statusLower.includes("refus")) {
    return "CANCELLED";
  }
  if (
    statusLower.includes("transit") ||
    statusLower.includes("ramass") ||
    statusLower.includes("hub") ||
    statusLower.includes("sorti") ||
    statusLower.includes("livraison") ||
    statusLower.includes("destination") ||
    statusLower.includes("expédi")
  ) {
    return "SHIPPED";
  }
  if (statusLower.includes("préparation") || statusLower.includes("prêt") || statusLower.includes("créé")) {
    return "CONFIRMED";
  }

  return "PENDING";
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
