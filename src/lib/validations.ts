// Validation utilities for API routes

export interface ProductInput {
  nameFr: string;
  nameAr: string;
  descriptionFr: string;
  descriptionAr: string;
  price: number;
  images: string[];
  sizes: string[];
  colors: string[];
  collectionId?: string | null;
  stock?: number;
}

export interface CollectionInput {
  nameFr: string;
  nameAr: string;
  image?: string | null;
}

export interface OrderInput {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
  customerWilaya: string;
  deliveryProvider?: string;
  deliveryType?: string;
  shippingPrice?: number;
  total: number;
  items: {
    productId?: string;
    productName: string;
    size: string;
    color: string;
    quantity: number;
    price: number;
  }[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Product validation
export function validateProduct(data: any): ValidationResult {
  const errors: string[] = [];

  if (
    !data.nameFr ||
    typeof data.nameFr !== "string" ||
    data.nameFr.trim().length < 2
  ) {
    errors.push("Le nom français est requis (min 2 caractères)");
  }

  if (
    !data.nameAr ||
    typeof data.nameAr !== "string" ||
    data.nameAr.trim().length < 2
  ) {
    errors.push("Le nom arabe est requis (min 2 caractères)");
  }

  if (!data.descriptionFr || typeof data.descriptionFr !== "string") {
    errors.push("La description française est requise");
  }

  if (!data.descriptionAr || typeof data.descriptionAr !== "string") {
    errors.push("La description arabe est requise");
  }

  const price = parseFloat(data.price);
  if (isNaN(price) || price <= 0) {
    errors.push("Le prix doit être un nombre positif");
  }

  if (
    data.promoPrice !== undefined &&
    data.promoPrice !== null &&
    data.promoPrice !== ""
  ) {
    const promo = parseFloat(data.promoPrice);
    if (isNaN(promo) || promo <= 0) {
      errors.push("Le prix promo doit être un nombre positif");
    }
    if (!isNaN(promo) && !isNaN(price) && promo >= price) {
      errors.push("Le prix promo doit être inférieur au prix normal");
    }
  }

  if (!Array.isArray(data.images) || data.images.length === 0) {
    errors.push("Au moins une image est requise");
  } else {
    for (const img of data.images) {
      if (typeof img !== "string" || !isValidUrl(img)) {
        errors.push("Les URLs des images doivent être valides");
        break;
      }
    }
  }

  if (!Array.isArray(data.sizes) || data.sizes.length === 0) {
    errors.push("Au moins une taille est requise");
  }

  if (!Array.isArray(data.colors) || data.colors.length === 0) {
    errors.push("Au moins une couleur est requise");
  }

  if (
    data.stock !== undefined &&
    (typeof data.stock !== "number" || data.stock < 0)
  ) {
    errors.push("Le stock doit être un nombre positif ou zéro");
  }

  return { valid: errors.length === 0, errors };
}

// Collection validation
export function validateCollection(data: any): ValidationResult {
  const errors: string[] = [];

  if (
    !data.nameFr ||
    typeof data.nameFr !== "string" ||
    data.nameFr.trim().length < 2
  ) {
    errors.push("Le nom français est requis (min 2 caractères)");
  }

  if (
    !data.nameAr ||
    typeof data.nameAr !== "string" ||
    data.nameAr.trim().length < 2
  ) {
    errors.push("Le nom arabe est requis (min 2 caractères)");
  }

  if (data.image && typeof data.image === "string" && !isValidUrl(data.image)) {
    errors.push("L'URL de l'image doit être valide");
  }

  return { valid: errors.length === 0, errors };
}

// Order validation
export function validateOrder(data: any): ValidationResult {
  const errors: string[] = [];

  if (
    !data.customerName ||
    typeof data.customerName !== "string" ||
    data.customerName.trim().length < 2
  ) {
    errors.push("Le nom du client est requis");
  }

  if (!data.customerPhone || !isValidPhone(data.customerPhone)) {
    errors.push("Un numéro de téléphone valide est requis");
  }

  if (!data.customerCity || typeof data.customerCity !== "string") {
    errors.push("La ville est requise");
  }

  if (!data.customerWilaya || typeof data.customerWilaya !== "string") {
    errors.push("La wilaya est requise");
  }

  const total = parseFloat(data.total);
  if (isNaN(total) || total <= 0) {
    errors.push("Le total doit être un nombre positif");
  }

  if (!Array.isArray(data.items) || data.items.length === 0) {
    errors.push("Au moins un article est requis");
  } else {
    for (const item of data.items) {
      if (
        !item.productName ||
        !item.size ||
        !item.color ||
        !item.quantity ||
        !item.price
      ) {
        errors.push(
          "Tous les articles doivent avoir un nom, taille, couleur, quantité et prix",
        );
        break;
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// Order status validation
export function validateOrderStatus(status: string): boolean {
  const validStatuses = [
    "PENDING",
    "CONFIRMED",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ];
  return validStatuses.includes(status);
}

// Helper functions
function isValidUrl(string: string): boolean {
  // Allow relative URLs starting with /
  if (string.startsWith("/")) return true;

  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

function isValidPhone(phone: string): boolean {
  // Allow various phone formats (Algeria)
  const cleaned = phone.replace(/[\s\-\.\(\)]/g, "");
  return /^(\+?213|0)?[5-7]\d{8}$/.test(cleaned);
}

// Sanitize string input
export function sanitizeString(str: string): string {
  return str.trim().replace(/<[^>]*>/g, "");
}
