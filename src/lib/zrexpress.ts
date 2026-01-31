/**
 * ZR Express (Procolis) API Integration
 * API Base URL: https://procolis.com/api_v1
 */

// Types
export interface ZRColis {
  Tracking?: string;
  TypeLivraison: "0" | "1"; // 0 = Domicile, 1 = Stop Desk
  TypeColis: "0" | "1"; // 0 = Normal, 1 = Échange
  Confrimee?: "1" | ""; // 1 = Prêt à expédier directement
  Client: string;
  MobileA: string;
  MobileB?: string;
  Adresse: string;
  IDWilaya: string;
  Commune: string;
  Total: string;
  Note?: string;
  TProduit: string;
  id_Externe?: string;
  Source?: string;
}

export interface ZRColisResponse {
  success: boolean;
  tracking?: string;
  message?: string;
  data?: any;
}

export interface ZRTarif {
  wilaya_id: string;
  wilaya_name: string;
  tarif_domicile: number;
  tarif_stopdesk: number;
}

export interface ZRTrackingInfo {
  Tracking: string;
  Situation: string;
  Client: string;
  Wilaya: string;
  Commune: string;
  Total: string;
  DateCreation: string;
  DateMAJ: string;
}

// Configuration
const ZR_CONFIG = {
  baseUrl: process.env.ZR_EXPRESS_API_URL || "https://procolis.com/api_v1",
  token: process.env.ZR_EXPRESS_TOKEN || "",
  key: process.env.ZR_EXPRESS_KEY || "",
};

// Client API
class ZRExpressClient {
  private token: string;
  private key: string;
  private baseUrl: string;

  constructor(token?: string, key?: string) {
    this.token = token || ZR_CONFIG.token;
    this.key = key || ZR_CONFIG.key;
    this.baseUrl = ZR_CONFIG.baseUrl;
  }

  private async request<T>(
    endpoint: string,
    method: "GET" | "POST" = "GET",
    body?: any,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      token: this.token,
      key: this.key,
    };

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("ZR Express API Error:", error);
      throw error;
    }
  }

  /**
   * Tester la connexion API
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.request("/token", "GET");
      return { success: true, message: "Connexion réussie" };
    } catch (error) {
      return { success: false, message: "Échec de connexion" };
    }
  }

  /**
   * Récupérer les tarifs par wilaya
   */
  async getTarification(): Promise<ZRTarif[]> {
    return this.request<ZRTarif[]>("/tarification", "POST");
  }

  /**
   * Ajouter un ou plusieurs colis
   */
  async addColis(colis: ZRColis[]): Promise<any> {
    return this.request<any>("/add_colis", "POST", { Colis: colis });
  }

  /**
   * Ajouter un seul colis (helper)
   */
  async createShipment(colis: ZRColis): Promise<ZRColisResponse> {
    try {
      const result = await this.addColis([colis]);

      // Handle different response formats
      // Format 1: { success: true, tracking: "xxx" }
      if (result?.success && result?.tracking) {
        return result;
      }

      // Format 2: { Colis: [{ Tracking: "xxx" }] }
      if (
        result?.Colis &&
        Array.isArray(result.Colis) &&
        result.Colis[0]?.Tracking
      ) {
        return {
          success: true,
          tracking: result.Colis[0].Tracking,
          message: "Colis créé",
        };
      }

      // Format 3: Array response [{ Tracking: "xxx" }]
      if (Array.isArray(result) && result[0]?.Tracking) {
        return {
          success: true,
          tracking: result[0].Tracking,
          message: "Colis créé",
        };
      }

      // Format 4: Direct tracking in response
      if (result?.Tracking) {
        return {
          success: true,
          tracking: result.Tracking,
          message: "Colis créé",
        };
      }

      // Error response
      return {
        success: false,
        message:
          result?.message || result?.error || "Format de réponse non reconnu",
      };
    } catch (error: any) {
      console.error("ZR Express createShipment error:", error);
      return {
        success: false,
        message: error?.message || "Erreur création colis ZR Express",
      };
    }
  }

  /**
   * Lire les informations de tracking
   */
  async getTrackingInfo(trackingNumbers: string[]): Promise<ZRTrackingInfo[]> {
    const colis = trackingNumbers.map((t) => ({ Tracking: t }));
    return this.request<ZRTrackingInfo[]>("/lire", "POST", { Colis: colis });
  }

  /**
   * Marquer comme prêt à expédier
   */
  async markReadyToShip(trackingNumbers: string[]): Promise<any> {
    const colis = trackingNumbers.map((t) => ({ Tracking: t }));
    return this.request("/pret", "POST", { Colis: colis });
  }

  /**
   * Récupérer les derniers colis mis à jour
   */
  async getLastUpdated(): Promise<ZRTrackingInfo[]> {
    return this.request<ZRTrackingInfo[]>("/tarification", "GET");
  }
}

// Singleton instance
let zrClient: ZRExpressClient | null = null;

export function getZRClient(): ZRExpressClient {
  if (!zrClient) {
    zrClient = new ZRExpressClient();
  }
  return zrClient;
}

// Helper: Convertir une commande Harp en colis ZR Express
export function orderToZRColis(order: {
  id: string;
  customerName: string;
  customerPhone: string;
  address: string;
  wilaya: string;
  commune: string;
  total: number;
  items: any[];
  deliveryType?: "DOMICILE" | "STOP_DESK";
  notes?: string;
}): ZRColis {
  // Extraire le numéro de wilaya (ex: "16" pour Alger)
  const wilayaId =
    WILAYAS.find(
      (w) =>
        w.name.toLowerCase() === order.wilaya.toLowerCase() ||
        w.name_ar === order.wilaya,
    )?.id || "16";

  // Description des produits
  const productDescription = order.items
    .map((item: any) => `${item.quantity}x ${item.nameFr || item.name}`)
    .join(", ");

  return {
    TypeLivraison: order.deliveryType === "STOP_DESK" ? "1" : "0",
    TypeColis: "0",
    Confrimee: "1", // Prêt à expédier
    Client: order.customerName,
    MobileA: order.customerPhone.replace(/\s/g, ""),
    Adresse: order.address,
    IDWilaya: wilayaId,
    Commune: order.commune,
    Total: order.total.toString(),
    Note: order.notes || "",
    TProduit: productDescription,
    id_Externe: order.id,
  };
}

// Mapper le statut ZR Express vers statut Harp
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

// Liste des 69 wilayas d'Algérie
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
