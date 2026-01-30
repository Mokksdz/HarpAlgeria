"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useSyncExternalStore,
} from "react";

export interface CartItem {
  id: string; // unique id for cart item (product + size + color)
  productId: string;
  name: string;
  price: number;
  image: string;
  size: string;
  color: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Hook to detect client-side mounting
function useIsMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

const CART_STORAGE_KEY = "harp-cart";
const CART_VERSION = 1;
const CART_EXPIRY_DAYS = 30;

interface StoredCart {
  version: number;
  updatedAt: number;
  items: CartItem[];
}

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const stored: StoredCart = JSON.parse(raw);
    // Version mismatch → clear
    if (stored.version !== CART_VERSION) {
      localStorage.removeItem(CART_STORAGE_KEY);
      return [];
    }
    // Expiration check (30 days)
    const ageMs = Date.now() - stored.updatedAt;
    if (ageMs > CART_EXPIRY_DAYS * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(CART_STORAGE_KEY);
      return [];
    }
    return Array.isArray(stored.items) ? stored.items : [];
  } catch {
    localStorage.removeItem(CART_STORAGE_KEY);
    return [];
  }
}

function saveCart(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  const stored: StoredCart = {
    version: CART_VERSION,
    updatedAt: Date.now(),
    items,
  };
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(stored));
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const isMounted = useIsMounted();
  const [items, setItems] = useState<CartItem[]>(loadCart);
  const [isOpen, setIsOpen] = useState(false);

  // Keep isMounted for other uses
  void isMounted;

  // Save cart to local storage with versioning
  useEffect(() => {
    saveCart(items);
  }, [items]);

  const addItem = useCallback((newItem: Omit<CartItem, "id">) => {
    const id = `${newItem.productId}-${newItem.size}-${newItem.color}`;
    setItems((prev) => {
      const existing = prev.find((item) => item.id === id);
      if (existing) {
        return prev.map((item) =>
          item.id === id
            ? { ...item, quantity: item.quantity + newItem.quantity }
            : item,
        );
      }
      return [...prev, { ...newItem, id }];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity < 1) return;
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item)),
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        total,
        isOpen,
        setIsOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
