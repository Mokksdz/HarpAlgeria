/**
 * Yalidine API Integration
 * Documentation: https://api.yalidine.app
 * API Base URL: https://api.yalidine.app/v1
 */

// Types Yalidine
export interface YalidineParcel {
  order_id: string;
  from_wilaya_name: string;
  firstname: string;
  familyname: string;
  contact_phone: string;
  address: string;
  to_commune_name: string;
  to_wilaya_name: string;
  product_list: string;
  price: number;
  do_insurance: boolean;
  declared_value: number;
  length: number;
  width: number;
  height: number;
  weight: number;
  freeshipping: boolean;
  is_stopdesk: boolean;
  stopdesk_id?: number;
  has_exchange: boolean;
  product_to_collect?: string;
}

export interface YalidineParcelResponse {
  success: boolean;
  order_id: string;
  tracking: string | null;
  import_id: number | null;
  label: string | null;
  labels: string | null;
  message: string;
}

export interface YalidineTrackingInfo {
  tracking: string;
  order_id: string;
  firstname: string;
  familyname: string;
  contact_phone: string;
  address: string;
  is_stopdesk: number;
  stopdesk_id: number;
  stopdesk_name: string;
  from_wilaya_id: number;
  from_wilaya_name: string;
  to_commune_id: number;
  to_commune_name: string;
  to_wilaya_id: number;
  to_wilaya_name: string;
  product_list: string;
  price: number;
  delivery_fee: number;
  freeshipping: number;
  date_creation: string;
  date_expedition: string | null;
  date_last_status: string;
  last_status: string;
  label: string;
  current_center_name: string;
  current_wilaya_name: string;
  payment_status: string;
}

export interface YalidineHistory {
  date_status: string;
  tracking: string;
  status: string;
  reason: string;
  center_id: number;
  center_name: string;
  wilaya_id: number;
  wilaya_name: string;
  commune_id: number;
  commune_name: string;
}

export interface YalidineWilaya {
  id: number;
  name: string;
  zone: number;
  is_deliverable: boolean;
}

export interface YalidineCommune {
  id: number;
  name: string;
  wilaya_id: number;
  wilaya_name: string;
  has_stop_desk: boolean;
  is_deliverable: boolean;
  delivery_time_parcel: number;
  delivery_time_payment: number;
}

export interface YalidineCenter {
  center_id: number;
  name: string;
  address: string;
  gps: string;
  commune_id: number;
  commune_name: string;
  wilaya_id: number;
  wilaya_name: string;
}

export interface YalidineFees {
  from_wilaya_name: string;
  to_wilaya_name: string;
  zone: number;
  retour_fee: number;
  cod_percentage: number;
  insurance_percentage: number;
  oversize_fee: number;
  per_commune: Record<
    string,
    {
      commune_id: number;
      commune_name: string;
      express_home: number | null;
      express_desk: number | null;
      economic_home: number | null;
      economic_desk: number | null;
    }
  >;
}

// Configuration
const YALIDINE_CONFIG = {
  baseUrl: process.env.YALIDINE_API_URL || "https://api.yalidine.app/v1",
  apiId: process.env.YALIDINE_API_ID || "",
  apiToken: process.env.YALIDINE_API_TOKEN || "",
};

// Client API Yalidine
class YalidineClient {
  private apiId: string;
  private apiToken: string;
  private baseUrl: string;

  constructor(apiId?: string, apiToken?: string) {
    this.apiId = apiId || YALIDINE_CONFIG.apiId;
    this.apiToken = apiToken || YALIDINE_CONFIG.apiToken;
    this.baseUrl = YALIDINE_CONFIG.baseUrl;
  }

  private async request<T>(
    endpoint: string,
    method: "GET" | "POST" | "PATCH" | "DELETE" = "GET",
    body?: any,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "X-API-ID": this.apiId,
      "X-API-TOKEN": this.apiToken,
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
      console.error("Yalidine API Error:", error);
      throw error;
    }
  }

  /**
   * Tester la connexion API
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    // Check if credentials are configured
    if (!this.apiId || !this.apiToken) {
      return { success: false, message: "Identifiants API non configurés" };
    }

    try {
      const result = await this.request<{
        has_more: boolean;
        total_data: number;
        data?: any[];
      }>("/wilayas/?page_size=1");
      const hasData =
        result.total_data > 0 ||
        (Array.isArray(result.data) && result.data.length > 0);
      return {
        success: !!hasData,
        message: hasData ? "Connexion réussie" : "Échec - Aucune donnée",
      };
    } catch (error) {
      console.error("Yalidine connection test error:", error);
      return { success: false, message: "Échec de connexion" };
    }
  }

  /**
   * Récupérer la liste des wilayas
   */
  async getWilayas(): Promise<{ data: YalidineWilaya[] }> {
    return this.request<{ data: YalidineWilaya[] }>("/wilayas/?page_size=100");
  }

  /**
   * Récupérer les communes d'une wilaya
   */
  async getCommunes(wilayaId?: number): Promise<{ data: YalidineCommune[] }> {
    const query = wilayaId
      ? `?wilaya_id=${wilayaId}&page_size=1000`
      : "?page_size=1000";
    return this.request<{ data: YalidineCommune[] }>(`/communes/${query}`);
  }

  /**
   * Récupérer les centres (stop desk)
   */
  async getCenters(wilayaId?: number): Promise<{ data: YalidineCenter[] }> {
    const query = wilayaId
      ? `?wilaya_id=${wilayaId}&page_size=200`
      : "?page_size=200";
    return this.request<{ data: YalidineCenter[] }>(`/centers/${query}`);
  }

  /**
   * Calculer les frais de livraison
   */
  async getFees(
    fromWilayaId: number,
    toWilayaId: number,
  ): Promise<YalidineFees> {
    return this.request<YalidineFees>(
      `/fees/?from_wilaya_id=${fromWilayaId}&to_wilaya_id=${toWilayaId}`,
    );
  }

  /**
   * Créer un ou plusieurs colis
   */
  async createParcels(
    parcels: YalidineParcel[],
  ): Promise<Record<string, YalidineParcelResponse>> {
    return this.request<Record<string, YalidineParcelResponse>>(
      "/parcels/",
      "POST",
      parcels,
    );
  }

  /**
   * Créer un seul colis (helper)
   */
  async createParcel(parcel: YalidineParcel): Promise<YalidineParcelResponse> {
    try {
      const result = await this.createParcels([parcel]);

      // Check if result exists and has the order_id
      if (result && result[parcel.order_id]) {
        return result[parcel.order_id];
      }

      // If result is an object with error message
      if (result && typeof result === "object") {
        const firstKey = Object.keys(result)[0];
        if (firstKey && result[firstKey]) {
          return result[firstKey];
        }
      }

      // Return error response if no valid result
      return {
        success: false,
        order_id: parcel.order_id,
        tracking: null,
        import_id: null,
        label: null,
        labels: null,
        message: "Réponse API invalide",
      };
    } catch (error: any) {
      console.error("createParcel error:", error);
      return {
        success: false,
        order_id: parcel.order_id,
        tracking: null,
        import_id: null,
        label: null,
        labels: null,
        message: error?.message || "Erreur création colis",
      };
    }
  }

  /**
   * Récupérer les détails d'un colis
   */
  async getParcel(tracking: string): Promise<{ data: YalidineTrackingInfo[] }> {
    return this.request<{ data: YalidineTrackingInfo[] }>(
      `/parcels/${tracking}`,
    );
  }

  /**
   * Récupérer plusieurs colis
   */
  async getParcels(
    trackings?: string[],
  ): Promise<{
    data: YalidineTrackingInfo[];
    has_more: boolean;
    total_data: number;
  }> {
    const query = trackings?.length ? `?tracking=${trackings.join(",")}` : "";
    return this.request(`/parcels/${query}`);
  }

  /**
   * Récupérer l'historique d'un colis
   */
  async getHistory(tracking: string): Promise<{ data: YalidineHistory[] }> {
    return this.request<{ data: YalidineHistory[] }>(`/histories/${tracking}`);
  }

  /**
   * Alias pour getHistory
   */
  async getTrackingHistory(
    tracking: string,
  ): Promise<{ data: YalidineHistory[] }> {
    return this.getHistory(tracking);
  }

  /**
   * Modifier un colis (uniquement si statut "En préparation")
   */
  async updateParcel(
    tracking: string,
    updates: Partial<YalidineParcel>,
  ): Promise<YalidineTrackingInfo> {
    return this.request<YalidineTrackingInfo>(
      `/parcels/${tracking}`,
      "PATCH",
      updates,
    );
  }

  /**
   * Supprimer un colis (uniquement si statut "En préparation")
   */
  async deleteParcel(
    tracking: string,
  ): Promise<{ tracking: string; deleted: boolean }> {
    return this.request<{ tracking: string; deleted: boolean }>(
      `/parcels/${tracking}`,
      "DELETE",
    );
  }
}

// Singleton instance
let yalidineClient: YalidineClient | null = null;

export function getYalidineClient(): YalidineClient {
  if (!yalidineClient) {
    yalidineClient = new YalidineClient();
  }
  return yalidineClient;
}

// Mapping wilaya ID → nom (format Yalidine)
export const WILAYA_ID_TO_NAME: Record<string, string> = {
  "1": "Adrar",
  "2": "Chlef",
  "3": "Laghouat",
  "4": "Oum El Bouaghi",
  "5": "Batna",
  "6": "Béjaïa",
  "7": "Biskra",
  "8": "Béchar",
  "9": "Blida",
  "10": "Bouira",
  "11": "Tamanrasset",
  "12": "Tébessa",
  "13": "Tlemcen",
  "14": "Tiaret",
  "15": "Tizi Ouzou",
  "16": "Alger",
  "17": "Djelfa",
  "18": "Jijel",
  "19": "Sétif",
  "20": "Saïda",
  "21": "Skikda",
  "22": "Sidi Bel Abbès",
  "23": "Annaba",
  "24": "Guelma",
  "25": "Constantine",
  "26": "Médéa",
  "27": "Mostaganem",
  "28": "M'Sila",
  "29": "Mascara",
  "30": "Ouargla",
  "31": "Oran",
  "32": "El Bayadh",
  "33": "Illizi",
  "34": "Bordj Bou Arreridj",
  "35": "Boumerdès",
  "36": "El Tarf",
  "37": "Tindouf",
  "38": "Tissemsilt",
  "39": "El Oued",
  "40": "Khenchela",
  "41": "Souk Ahras",
  "42": "Tipaza",
  "43": "Mila",
  "44": "Aïn Defla",
  "45": "Naâma",
  "46": "Aïn Témouchent",
  "47": "Ghardaïa",
  "48": "Relizane",
  "49": "El MGhair",
  "50": "El Meniaa",
  "51": "Ouled Djellal",
  "52": "Bordj Badji Mokhtar",
  "53": "Béni Abbès",
  "54": "Timimoun",
  "55": "Touggourt",
  "56": "Djanet",
  "57": "In Salah",
  "58": "In Guezzam",
};

// Fonction pour convertir ID ou nom en nom Yalidine
export function getWilayaName(wilayaIdOrName: string): string {
  // Si c'est déjà un nom connu, le retourner
  const normalizedInput = wilayaIdOrName.trim();

  // Chercher par ID
  if (WILAYA_ID_TO_NAME[normalizedInput]) {
    return WILAYA_ID_TO_NAME[normalizedInput];
  }

  // Chercher par nom (insensible à la casse)
  const lowerInput = normalizedInput.toLowerCase();
  for (const [id, name] of Object.entries(WILAYA_ID_TO_NAME)) {
    if (name.toLowerCase() === lowerInput) {
      return name;
    }
  }

  // Retourner tel quel si non trouvé (l'API donnera une erreur plus explicite)
  return normalizedInput;
}

// Helper: Convertir une commande Harp en colis Yalidine
export function orderToYalidineParcel(
  order: {
    id: string;
    customerName: string;
    customerPhone: string;
    address: string;
    wilaya: string;
    commune: string;
    total: number;
    items: any[];
    deliveryType?: "DOMICILE" | "STOP_DESK";
    stopDeskId?: number;
    notes?: string;
  },
  fromWilaya: string = "Alger",
): YalidineParcel {
  // Séparer prénom/nom
  const nameParts = order.customerName.trim().split(" ");
  const firstname = nameParts[0] || order.customerName;
  const familyname = nameParts.slice(1).join(" ") || "-";

  // Description des produits
  const productList = order.items
    .map(
      (item: any) =>
        `${item.quantity}x ${item.nameFr || item.productName || item.name}`,
    )
    .join(", ");

  // Convertir wilaya ID en nom
  const toWilayaName = getWilayaName(order.wilaya);
  const fromWilayaName = getWilayaName(fromWilaya);

  return {
    order_id: order.id,
    from_wilaya_name: fromWilayaName,
    firstname,
    familyname,
    contact_phone: order.customerPhone.replace(/\s/g, ""),
    address: order.address,
    to_commune_name: order.commune,
    to_wilaya_name: toWilayaName,
    product_list: productList || "Articles Harp",
    price: Math.round(order.total),
    do_insurance: false,
    declared_value: Math.round(order.total),
    length: 30,
    width: 20,
    height: 10,
    weight: 1,
    freeshipping: false, // Client paie la livraison
    is_stopdesk: order.deliveryType === "STOP_DESK",
    stopdesk_id: order.stopDeskId,
    has_exchange: false,
  };
}

// Mapper le statut Yalidine vers statut Harp
export function mapYalidineStatusToHarpStatus(yalidineStatus: string): string {
  const statusMap: Record<string, string> = {
    "Pas encore expédié": "CONFIRMED",
    "A vérifier": "CONFIRMED",
    "En préparation": "CONFIRMED",
    "Pas encore ramassé": "CONFIRMED",
    "Prêt à expédier": "CONFIRMED",
    "En passation": "CONFIRMED",
    Ramassé: "SHIPPED",
    Transfert: "SHIPPED",
    Expédié: "SHIPPED",
    Centre: "SHIPPED",
    "En localisation": "SHIPPED",
    "Vers Wilaya": "SHIPPED",
    "Reçu à Wilaya": "SHIPPED",
    "En attente du client": "SHIPPED",
    "Prêt pour livreur": "SHIPPED",
    "Sorti en livraison": "SHIPPED",
    "En attente": "SHIPPED",
    "Tentative échouée": "SHIPPED",
    Livré: "DELIVERED",
    "Echèc livraison": "CANCELLED",
    "Retour vers centre": "CANCELLED",
    "Retourné au centre": "CANCELLED",
    "Retour vers vendeur": "CANCELLED",
    "Retourné au vendeur": "CANCELLED",
  };
  return statusMap[yalidineStatus] || "PENDING";
}

// Liste des statuts Yalidine
export const YALIDINE_STATUSES = [
  "Pas encore expédié",
  "A vérifier",
  "En préparation",
  "Pas encore ramassé",
  "Prêt à expédier",
  "En passation",
  "Ramassé",
  "Bloqué",
  "Débloqué",
  "Transfert",
  "Expédié",
  "Centre",
  "En localisation",
  "Vers Wilaya",
  "Reçu à Wilaya",
  "En attente du client",
  "Prêt pour livreur",
  "Sorti en livraison",
  "En attente",
  "En alerte",
  "Tentative échouée",
  "Livré",
  "Echèc livraison",
  "Retour vers centre",
  "Retourné au centre",
  "Retour transfert",
  "Retour groupé",
  "Retour à retirer",
  "Retour vers vendeur",
  "Retourné au vendeur",
  "Echange échoué",
];

export default YalidineClient;
