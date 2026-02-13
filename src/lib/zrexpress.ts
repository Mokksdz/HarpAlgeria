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
    customerId: string;           // UUID — created via /customers/individual
    name: string;
    phone: { number1: string; number2?: string };
  };
  deliveryAddress: {
    cityTerritoryId: string;      // UUID wilaya
    districtTerritoryId: string;   // UUID commune — required by API
    street: string;
  };
  orderedProducts: {
    productId: string;            // UUID — created via /products
    productSku: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    stockType: "local" | "warehouse" | "none";
  }[];
  deliveryType: "home" | "pickup-point";
  hubId?: string;                 // UUID — required for pickup-point delivery
  description: string;            // Required by API
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
  level: "wilaya" | "commune" | "city" | "district";
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

// ── Helpers ─────────────────────────────────────────────────────────────

/** Strip diacritics/accents: "Béchar" → "Bechar", "Béjaïa" → "Bejaia" */
function stripDiacritics(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// ── Caches ──────────────────────────────────────────────────────────────

const territoryCache = new Map<string, string>();
const customerCache = new Map<string, string>();   // phone → customerId
let defaultProductId: string | null = null;
const DEFAULT_PRODUCT_SKU = "HARP-GENERAL";
const DEFAULT_PRODUCT_NAME = "Articles Harp";

// ── Client API ─────────────────────────────────────────────────────────

class ZRExpressClient {
  private tenantId: string;
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.tenantId = ZR_CONFIG.tenantId;
    this.apiKey = ZR_CONFIG.apiKey;
    this.baseUrl = ZR_CONFIG.baseUrl;
    // Bug #38: Warn if credentials are missing
    if (!this.tenantId || !this.apiKey) {
      console.warn("[ZR Express] Missing ZR_EXPRESS_TENANT_ID or ZR_EXPRESS_API_KEY");
    }
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
      // Bug #43: Don't log full body (contains PII) — log only endpoint
      if (process.env.NODE_ENV !== "production") {
        console.log(`ZR Express API ${method} ${endpoint}`);
      }

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
    // ZR Express API may store names without diacritics ("Bechar" not "Béchar")
    const searchTermNoDiacritics = stripDiacritics(searchTerm);

    console.log(`[ZR] resolveWilayaId("${wilayaNameOrCode}") → searchTerm: "${searchTerm}" / "${searchTermNoDiacritics}" (entry: ${wilayaEntry ? wilayaEntry.name : "none"})`);

    // Helper to find best wilaya/city match from results
    // ZR Express API uses "wilaya"/"commune" levels (not "city"/"district")
    const isWilayaLevel = (t: ZRTerritory) => t.level === "wilaya" || t.level === "city";
    const matchesName = (name: string) => {
      const n = stripDiacritics(name).toLowerCase();
      const s = searchTermNoDiacritics.toLowerCase();
      return n === s || n.includes(s);
    };
    const findCity = (results: ZRTerritory[]): ZRTerritory | undefined =>
      // Exact match (diacritics-insensitive)
      results.find((t) => isWilayaLevel(t) && stripDiacritics(t.name).toLowerCase() === searchTermNoDiacritics.toLowerCase()) ||
      // Partial match (diacritics-insensitive)
      results.find((t) => isWilayaLevel(t) && matchesName(t.name)) ||
      // Any wilaya-level result
      results.find((t) => isWilayaLevel(t));

    // 1. Try searching by wilaya name (with diacritics)
    let results = await this.searchTerritories(searchTerm);
    let city = findCity(results);

    // 2. If no result, try searching WITHOUT diacritics ("Béchar" → "Bechar")
    if (!city && searchTerm !== searchTermNoDiacritics) {
      results = await this.searchTerritories(searchTermNoDiacritics);
      city = findCity(results);
    }

    // 3. If no result, try with the Arabic name as fallback
    if (!city && wilayaEntry?.name_ar) {
      results = await this.searchTerritories(wilayaEntry.name_ar);
      city = findCity(results);
    }

    // 4. Last resort: try includeUnavailable=true (with no-diacritics term)
    if (!city) {
      try {
        const result = await this.request<{ items: ZRTerritory[] }>(
          "/territories/search",
          "POST",
          { keyword: searchTermNoDiacritics, pageSize: 50, pageNumber: 1, includeUnavailable: true },
        );
        const items = result.items || [];
        console.log(`[ZR] resolveWilayaId fallback (includeUnavailable) for "${searchTermNoDiacritics}" → ${items.length} results`);
        city = findCity(items);
      } catch (error) {
        console.error(`[ZR] resolveWilayaId fallback search failed:`, error);
      }
    }

    if (city) {
      territoryCache.set(cacheKey, city.id);
      console.log(`[ZR] Resolved wilaya "${wilayaNameOrCode}" → "${city.name}" (${city.id})`);
      return city.id;
    }

    console.error(`[ZR] Could not resolve wilaya: "${wilayaNameOrCode}" (searched: "${searchTerm}" / "${searchTermNoDiacritics}", entry: ${JSON.stringify(wilayaEntry)})`);
    return null;
  }

  async resolveCommuneId(communeName: string, wilayaName?: string, cityTerritoryId?: string): Promise<string | null> {
    const cacheKey = `commune:${communeName}:${cityTerritoryId || wilayaName || ""}`.toLowerCase();
    if (territoryCache.has(cacheKey)) {
      return territoryCache.get(cacheKey)!;
    }

    const isCommuneLevel = (t: ZRTerritory) => t.level === "commune" || t.level === "district";

    // Helper: find best commune match, prioritizing ones that belong to the correct wilaya
    const findBestCommune = (items: ZRTerritory[]): ZRTerritory | undefined => {
      const communes = items.filter(isCommuneLevel);
      if (communes.length === 0) return undefined;

      // If we know the wilaya UUID, pick the commune whose parentId matches
      if (cityTerritoryId) {
        const exact = communes.find((t) => t.parentId === cityTerritoryId);
        if (exact) return exact;
      }

      // If only one result, use it
      if (communes.length === 1) return communes[0];

      // Bug #20: Multiple results but no cityTerritoryId to filter — return undefined to avoid picking wrong commune
      if (!cityTerritoryId) return undefined;

      // Multiple results and none matched the wilaya — don't guess
      console.warn(`[ZR] Multiple communes found for "${communeName}" but none match wilaya ${cityTerritoryId}:`, communes.map(c => `${c.name} (parent:${c.parentId})`));
      return undefined;
    };

    // Try with original name
    let results = await this.searchTerritories(communeName);
    let district = findBestCommune(results);

    // Try without diacritics if needed ("Béjaïa" → "Bejaia")
    if (!district) {
      const noDiacritics = stripDiacritics(communeName);
      if (noDiacritics !== communeName) {
        results = await this.searchTerritories(noDiacritics);
        district = findBestCommune(results);
      }
    }

    if (district) {
      console.log(`[ZR] Resolved commune "${communeName}" → "${district.name}" (${district.id}, parent:${district.parentId})`);
      territoryCache.set(cacheKey, district.id);
      return district.id;
    }

    console.warn(`[ZR] Could not resolve commune: "${communeName}" (wilaya: ${cityTerritoryId || wilayaName || "unknown"})`);
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

  // ── Customer Management ─────────────────────────────────────────────

  async getOrCreateCustomer(name: string, phone: string): Promise<string> {
    // Check cache first
    if (customerCache.has(phone)) {
      return customerCache.get(phone)!;
    }

    // Search existing customers by phone
    try {
      const result = await this.request<{ items: { id: string; phone: { number1: string } }[] }>(
        "/customers/search",
        "POST",
        { keyword: phone.replace("+213", "0"), pageSize: 10, pageNumber: 1 },
      );
      const existing = (result.items || []).find(
        (c) => c.phone?.number1 === phone || c.phone?.number1 === phone.replace("+213", "0"),
      );
      if (existing) {
        customerCache.set(phone, existing.id);
        console.log(`[ZR] Found existing customer "${name}" → ${existing.id}`);
        return existing.id;
      }
    } catch {
      // Search failed, try to create
    }

    // Create new customer
    try {
      const result = await this.request<{ id: string }>(
        "/customers/individual",
        "POST",
        { name, phone: { number1: phone } },
      );
      customerCache.set(phone, result.id);
      console.log(`[ZR] Created new customer "${name}" → ${result.id}`);
      return result.id;
    } catch (error: any) {
      const msg = error?.message || "";
      // Provide a clear error message for phone validation failures
      if (msg.includes("phone") || msg.includes("Phone")) {
        throw new Error(`Numéro de téléphone rejeté par ZR Express: "${phone}". Le numéro doit être un numéro mobile algérien valide au format international (+213XXXXXXXXX).`);
      }
      throw error;
    }
  }

  // ── Product Management ─────────────────────────────────────────────

  async getOrCreateDefaultProduct(): Promise<{ productId: string; productSku: string }> {
    if (defaultProductId) {
      return { productId: defaultProductId, productSku: DEFAULT_PRODUCT_SKU };
    }

    // Search for existing product
    try {
      const result = await this.request<{ items: { id: string; sku: string }[] }>(
        "/products/search",
        "POST",
        { keyword: DEFAULT_PRODUCT_SKU, pageSize: 10, pageNumber: 1 },
      );
      const existing = (result.items || []).find((p) => p.sku === DEFAULT_PRODUCT_SKU);
      if (existing) {
        defaultProductId = existing.id;
        console.log(`[ZR] Found existing product "${DEFAULT_PRODUCT_SKU}" → ${existing.id}`);
        return { productId: existing.id, productSku: DEFAULT_PRODUCT_SKU };
      }
    } catch {
      // Search failed, try to create
    }

    // Create the default product
    const result = await this.request<{ id: string }>(
      "/products",
      "POST",
      { name: DEFAULT_PRODUCT_NAME, sku: DEFAULT_PRODUCT_SKU, price: 0, stockType: "none" },
    );
    defaultProductId = result.id;
    console.log(`[ZR] Created default product "${DEFAULT_PRODUCT_SKU}" → ${result.id}`);
    return { productId: result.id, productSku: DEFAULT_PRODUCT_SKU };
  }

  // ── Hub / Pickup Point Management ────────────────────────────────────

  async searchHubs(keyword: string, cityTerritoryId?: string): Promise<{ id: string; name: string; isPickupPoint: boolean }[]> {
    try {
      const body: Record<string, unknown> = { keyword, pageSize: 20, pageNumber: 1 };
      const result = await this.request<{ items: { id: string; name: string; isPickupPoint: boolean; address?: { cityTerritoryId?: string } }[] }>(
        "/hubs/search",
        "POST",
        body,
      );
      let hubs = result.items || [];
      // Filter by city if provided
      if (cityTerritoryId) {
        const filtered = hubs.filter((h) => h.address?.cityTerritoryId === cityTerritoryId);
        if (filtered.length > 0) hubs = filtered;
      }
      console.log(`[ZR] searchHubs("${keyword}") → ${hubs.length} results`);
      return hubs;
    } catch (error) {
      console.error(`[ZR] searchHubs("${keyword}") FAILED:`, error);
      return [];
    }
  }

  async resolveHubId(communeName: string, cityTerritoryId: string, address?: string): Promise<string | null> {
    // ONLY return hubs that are actual pickup points — never return sorting centers (Tri/مركز فرز)
    const findPickupHub = (hubs: { id: string; name: string; isPickupPoint: boolean }[]) =>
      hubs.find((h) => h.isPickupPoint) || null;

    // Strategy 1: Extract pickup point name from address (e.g., "Point de retrait: Birkhadem - Agence de...")
    if (address) {
      const pickupMatch = address.match(/Point de retrait\s*:\s*([^-–,]+)/i);
      if (pickupMatch) {
        const pickupName = pickupMatch[1].trim();
        console.log(`[ZR] Extracted pickup point name from address: "${pickupName}"`);
        const hubs = await this.searchHubs(pickupName);
        const hub = findPickupHub(hubs);
        if (hub) {
          console.log(`[ZR] Resolved hub from address "${pickupName}" → "${hub.name}" (${hub.id})`);
          return hub.id;
        }
        // Don't return non-pickup hubs — continue to next strategy
        console.log(`[ZR] No pickup hub found for "${pickupName}", trying other strategies...`);
      }
    }

    // Strategy 2: Search by commune name, filter by city
    const hubs = await this.searchHubs(communeName, cityTerritoryId);
    const pickupHub = findPickupHub(hubs);
    if (pickupHub) {
      console.log(`[ZR] Resolved hub for "${communeName}" → "${pickupHub.name}" (${pickupHub.id})`);
      return pickupHub.id;
    }

    // Strategy 3: Broad search — get ALL hubs and filter by cityTerritoryId + isPickupPoint
    // This catches cases where keyword search returns sorting centers instead of pickup hubs
    const broadHubs = await this.searchHubs("", cityTerritoryId);
    const broadHub = findPickupHub(broadHubs);
    if (broadHub) {
      console.log(`[ZR] Resolved hub via broad search for wilaya → "${broadHub.name}" (${broadHub.id})`);
      return broadHub.id;
    }

    // Strategy 4: Search by wilaya name from our WILAYAS list
    const wilayaEntry = WILAYAS.find(
      (w) => w.name.toLowerCase() === communeName.toLowerCase() ||
             w.name_ar === communeName,
    );
    if (wilayaEntry) {
      const fallbackHubs = await this.searchHubs(wilayaEntry.name);
      const fallbackHub = findPickupHub(fallbackHubs);
      if (fallbackHub) {
        console.log(`[ZR] Resolved hub via wilaya fallback for "${communeName}" → "${fallbackHub.name}" (${fallbackHub.id})`);
        return fallbackHub.id;
      }
    }

    console.error(`[ZR] Could not resolve pickup hub for commune "${communeName}" (address: "${address || "none"}")`);
    return null;
  }

  // ── Parcel Creation ──────────────────────────────────────────────────

  async createParcel(parcel: ZRCreateParcel): Promise<ZRColisResponse> {
    try {
      const result = await this.request<{ id: string }>(
        "/parcels",
        "POST",
        parcel,
      );

      console.log("[ZR] createParcel POST response:", JSON.stringify(result));

      if (result?.id) {
        // POST /parcels only returns { id }, the real trackingNumber is set server-side.
        // We MUST GET the parcel to retrieve the actual tracking number (e.g. "16-CN5YF1VIVA-ZR")
        let trackingNumber = result.id; // fallback to UUID if GET fails
        try {
          const parcelData = await this.request<{ id: string; trackingNumber?: string }>(
            `/parcels/${result.id}`,
            "GET",
          );
          if (parcelData?.trackingNumber) {
            trackingNumber = parcelData.trackingNumber;
            console.log(`[ZR] Real tracking number: ${trackingNumber} (parcelId: ${result.id})`);
          } else {
            console.warn(`[ZR] GET parcel returned no trackingNumber, using UUID: ${result.id}`);
          }
        } catch (getError) {
          console.warn(`[ZR] Failed to GET parcel after creation, using UUID: ${result.id}`, getError);
        }

        return {
          success: true,
          parcelId: result.id,
          tracking: trackingNumber,
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
      console.error("[ZR] createParcel error:", error);
      return {
        success: false,
        message: error?.message || "Erreur création colis ZR Express",
      };
    }
  }

  // ── High-level: Create Shipment from order data ──────────────────────

  /**
   * Format phone number to international format (+213...)
   * Algerian numbers: 0XXXXXXXXX → +213XXXXXXXXX
   */
  private formatPhoneInternational(phone: string): string {
    let cleaned = phone.replace(/[\s\-().]/g, "");
    // Already international
    if (cleaned.startsWith("+213")) return cleaned;
    // Remove 213 prefix without + (must check before "0" since "213..." doesn't start with "0")
    if (cleaned.startsWith("213") && cleaned.length > 11) cleaned = cleaned.slice(3);
    // Bug #21: Remove leading 0 AFTER stripping "213" prefix (was only done before)
    if (cleaned.startsWith("0")) cleaned = cleaned.slice(1);
    return `+213${cleaned}`;
  }

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

      // 1. Resolve territory
      const cityId = await this.resolveWilayaId(orderData.wilayaId);
      if (!cityId) {
        return {
          success: false,
          message: `Wilaya non trouvée dans ZR Express: "${orderData.wilayaId}". Vérifiez que la wilaya existe dans votre compte ZR Express.`,
        };
      }

      // Resolve commune — required by ZR Express API
      // Pass cityId so we pick the commune that belongs to the correct wilaya
      let districtId = await this.resolveCommuneId(orderData.commune, orderData.wilayaId, cityId);

      // If commune not found, try the wilaya's main commune (same name as wilaya)
      if (!districtId) {
        const wilayaEntry = WILAYAS.find((w) => w.id === orderData.wilayaId || w.name.toLowerCase() === orderData.wilayaId.toLowerCase());
        if (wilayaEntry) {
          const fallbackResults = await this.searchTerritories(wilayaEntry.name);
          // MUST filter by parentId to pick a commune that belongs to the correct wilaya
          const fallbackCommune = fallbackResults.find(
            (t) => (t.level === "commune" || t.level === "district") && t.parentId === cityId
          ) || fallbackResults.find(
            (t) => (t.level === "commune" || t.level === "district")
          );
          if (fallbackCommune) {
            districtId = fallbackCommune.id;
            console.log(`[ZR] Commune fallback: "${orderData.commune}" → "${fallbackCommune.name}" (${fallbackCommune.id}, parent:${fallbackCommune.parentId})`);
          }
        }
      }

      if (!districtId) {
        return {
          success: false,
          message: `Commune non trouvée dans ZR Express: "${orderData.commune}". La commune est requise pour la livraison.`,
        };
      }

      console.log(`[ZR] Resolved territory: wilaya "${orderData.wilayaId}" → ${cityId}, commune "${orderData.commune}" → ${districtId}`);

      // 2. Format & validate phone
      const rawPhone = orderData.customerPhone.replace(/\s/g, "");
      if (!rawPhone || rawPhone.replace(/\D/g, "").length < 9) {
        return {
          success: false,
          message: `Numéro de téléphone invalide: "${rawPhone}". Minimum 9 chiffres requis.`,
        };
      }
      const phone1 = this.formatPhoneInternational(rawPhone);

      // 3. Get or create customer in ZR Express
      const customerId = await this.getOrCreateCustomer(orderData.customerName, phone1);

      // 4. Get or create default product
      const { productId, productSku } = await this.getOrCreateDefaultProduct();

      // 5. Determine delivery type & resolve hub for pickup-point
      const deliveryType: "home" | "pickup-point" =
        orderData.deliveryType === "STOP_DESK" ||
        orderData.deliveryType === "DESK" ||
        orderData.deliveryType === "pickup-point"
          ? "pickup-point"
          : "home";

      let hubId: string | undefined;
      if (deliveryType === "pickup-point") {
        const resolvedHub = await this.resolveHubId(orderData.commune, cityId, orderData.address);
        if (!resolvedHub) {
          return {
            success: false,
            message: `Point relais non trouvé dans ZR Express pour "${orderData.commune}". Vérifiez qu'un hub existe dans cette zone.`,
          };
        }
        hubId = resolvedHub;
      }

      // 6. Build parcel
      const parcel: ZRCreateParcel = {
        customer: {
          customerId,
          name: orderData.customerName,
          phone: {
            number1: phone1,
            number2: orderData.customerPhoneB
              ? this.formatPhoneInternational(orderData.customerPhoneB)
              : undefined,
          },
        },
        deliveryAddress: {
          cityTerritoryId: cityId,
          districtTerritoryId: districtId,
          street: orderData.address,
        },
        hubId,
        orderedProducts: [
          {
            productId,
            productSku,
            productName: orderData.products || DEFAULT_PRODUCT_NAME,
            unitPrice: orderData.total,
            quantity: 1,
            stockType: "none",
          },
        ],
        deliveryType,
        description: orderData.notes || orderData.products || "Commande Harp",
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
    } catch (error: any) {
      // Bug #40: Log the error type (404 vs 500) instead of silently swallowing
      const is404 = error?.message?.includes("404");
      if (!is404) {
        console.error(`[ZR Express] getParcel(${parcelId}) error:`, error?.message);
      }
      return null;
    }
  }

  // ── Get Parcel by Tracking Number ────────────────────────────────────

  async getParcelByTracking(trackingNumber: string): Promise<any> {
    try {
      return await this.request(`/parcels/tracking/${trackingNumber}`, "GET");
    } catch (error: any) {
      const is404 = error?.message?.includes("404");
      if (!is404) {
        console.error(`[ZR Express] getParcelByTracking(${trackingNumber}) error:`, error?.message);
      }
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
