// ============================================
// API Types - Yalidine & ZR Express
// ============================================

// ---- Yalidine Types ----

export interface YalidineWilaya {
  id: number;
  name: string;
  name_ar?: string;
}

export interface YalidineCommune {
  id: number;
  name: string;
  name_ar?: string;
  wilaya_id: number;
  wilaya_name?: string;
}

export interface YalidineCentre {
  centre_id: number;
  name: string;
  commune_id: number;
  commune_name: string;
  wilaya_id: number;
  wilaya_name: string;
  address?: string;
  gps_longitude?: string;
  gps_latitude?: string;
}

export interface YalidineDeliveryFee {
  wilaya_id: number;
  wilaya_name: string;
  home_fee: number;
  desk_fee: number;
  is_deliverable: boolean;
}

export interface YalidineParcel {
  tracking: string;
  order_id?: string;
  firstname: string;
  familyname: string;
  contact_phone: string;
  address: string;
  to_commune_name: string;
  to_wilaya_name: string;
  product_list: string;
  price: number;
  freeshipping: boolean;
  is_stopdesk: boolean;
  stopdesk_id?: number;
  has_exchange: boolean;
  product_to_collect?: string;
}

export interface YalidineParcelResponse {
  tracking: string;
  label?: string;
  order_id?: string;
  status?: string;
}

export interface YalidineTrackingEvent {
  date: string;
  status: string;
  status_ar?: string;
  center?: string;
  note?: string;
}

export interface YalidineTrackingResponse {
  tracking: string;
  status: string;
  status_ar?: string;
  history: YalidineTrackingEvent[];
}

export interface YalidineApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ---- ZR Express Types (New API: api.zrexpress.app/api/v1) ----

export interface ZRWilaya {
  id: string; // UUID in new API
  name: string;
  code?: string;
}

export interface ZRCommune {
  id: string; // UUID in new API
  name: string;
  parentId?: string; // wilaya territory ID
}

export interface ZRStopDesk {
  id: string;
  name: string;
  address: string;
  wilayaId?: number;
  phone?: string;
}

export interface ZRParcel {
  id: string;
  trackingNumber?: string;
  state?: { name: string };
  stateName?: string;
  status?: string;
  lastStatus?: string;
  customer?: { name: string };
  deliveryAddress?: {
    street?: string;
    city?: { name: string };
    district?: { name: string };
    cityName?: string;
    districtName?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface ZRParcelResponse {
  success: boolean;
  tracking?: string;
  id?: string;
  message?: string;
  error?: string;
}

export interface ZRTrackingEvent {
  stateName: string;
  timestamp?: string;
  hubName?: string;
}

export interface ZRApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ---- Order Types ----

export interface OrderItem {
  id: string;
  productId?: string;
  productName: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
  customerWilaya: string;
  deliveryProvider?: string;
  deliveryType?: string;
  shippingPrice?: number;
  stopDeskId?: number;
  trackingNumber?: string;
  trackingStatus?: string;
  total: number;
  status: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt?: string;
}

// ---- Product Types ----

export interface Product {
  id: string;
  slug: string;
  nameFr: string;
  nameAr: string;
  descriptionFr: string;
  descriptionAr: string;
  price: number;
  images: string; // JSON string
  sizes: string; // JSON string
  colors: string; // JSON string
  stock: number;
  isActive: boolean;
  collectionId?: string;
  collection?: Collection;
  createdAt: string;
  updatedAt: string;
}

export interface Collection {
  id: string;
  slug: string;
  nameFr: string;
  nameAr: string;
  description?: string;
  image?: string;
  products?: Product[];
  createdAt: string;
  updatedAt: string;
}

// ---- Loyalty Types ----

export interface Customer {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  points: number;
  totalSpent: number;
  totalOrders: number;
  birthday?: string;
  birthdayBonusAt?: string;
  redeemablePoints?: number;
  redeemableValue?: number;
}

export interface LoyaltyTransaction {
  id: string;
  customerId: string;
  type: "EARN" | "REDEEM" | "BONUS" | "BIRTHDAY" | "REVIEW";
  points: number;
  description?: string;
  orderId?: string;
  createdAt: string;
}

export interface LoyaltyConfig {
  pointsPerDinar: number;
  redeemThreshold: number;
  redeemValue: number;
  birthdayBonus: number;
  reviewBonus: number;
  firstOrderBonus: number;
}

// ---- Stock Alert Types ----

export interface StockAlert {
  id: string;
  productId: string;
  email?: string;
  phone?: string;
  size?: string;
  color?: string;
  notified: boolean;
  createdAt: string;
}

// ---- Validation Types ----

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ---- API Response Types ----

export interface ApiError {
  error: string;
  details?: string[];
  status?: number;
}

export interface ApiSuccess<T> {
  data: T;
  message?: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
