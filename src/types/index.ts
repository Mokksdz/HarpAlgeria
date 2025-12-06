// Product Types
export interface Product {
  id: string;
  nameFr: string;
  nameAr: string;
  descriptionFr: string;
  descriptionAr: string;
  price: number;
  images: string; // JSON string - use parseImages() to get string[]
  sizes: string; // JSON string - use parseSizes() to get string[]
  colors: string; // JSON string - use parseColors() to get string[]
  stock: number;
  isActive: boolean;
  collectionId: string | null;
  collection?: Collection | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductWithParsedData extends Omit<
  Product,
  "images" | "sizes" | "colors"
> {
  images: string[];
  sizes: string[];
  colors: string[];
}

// Collection Types
export interface Collection {
  id: string;
  nameFr: string;
  nameAr: string;
  image: string | null;
  products?: Product[];
  createdAt: Date;
  updatedAt: Date;
}

// Order Types
export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
  customerWilaya: string;
  deliveryProvider: string | null;
  deliveryType: string | null;
  shippingPrice: number | null;
  total: number;
  status: OrderStatus;
  items: OrderItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string | null;
  productName: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
}

// Cart Types
export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  size: string;
  color: string;
  quantity: number;
}

// Delivery Types
export type DeliveryProvider = "ZR Express" | "Yalidine";
export type DeliveryType = "HOME" | "DESK";

export interface DeliveryRate {
  wilayaCode: number;
  wilayaName: string;
  zrExpressHome: number;
  zrExpressDesk: number;
  yalidineHome: number;
  yalidineDesk: number;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  details?: string[];
}

// Form Types
export interface ProductFormData {
  nameFr: string;
  nameAr: string;
  descriptionFr: string;
  descriptionAr: string;
  price: string;
  sizes: string;
  colors: string;
  stock: string;
  collectionId: string;
}

export interface CollectionFormData {
  nameFr: string;
  nameAr: string;
  image: string;
}

export interface CheckoutFormData {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  wilaya: string;
}

// Helper Functions
export function parseProductData(product: Product): ProductWithParsedData {
  return {
    ...product,
    images: JSON.parse(product.images),
    sizes: JSON.parse(product.sizes),
    colors: JSON.parse(product.colors),
  };
}

export function getStatusColor(status: OrderStatus): string {
  const colors: Record<OrderStatus, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-blue-100 text-blue-800",
    SHIPPED: "bg-purple-100 text-purple-800",
    DELIVERED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

export function getStatusLabel(
  status: OrderStatus,
  lang: "fr" | "ar" = "fr",
): string {
  const labels: Record<OrderStatus, { fr: string; ar: string }> = {
    PENDING: { fr: "En attente", ar: "في الانتظار" },
    CONFIRMED: { fr: "Confirmée", ar: "مؤكدة" },
    SHIPPED: { fr: "Expédiée", ar: "تم الشحن" },
    DELIVERED: { fr: "Livrée", ar: "تم التوصيل" },
    CANCELLED: { fr: "Annulée", ar: "ملغاة" },
  };
  return labels[status]?.[lang] || status;
}
