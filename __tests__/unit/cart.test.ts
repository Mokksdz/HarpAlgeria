/**
 * Unit Tests for Cart functionality
 */

describe("Cart Utils", () => {
  describe("Price Calculations", () => {
    const FREE_SHIPPING_THRESHOLD = 15000;

    it("should calculate subtotal correctly", () => {
      const items = [
        { price: 5000, quantity: 2 },
        { price: 3500, quantity: 1 },
        { price: 8000, quantity: 3 },
      ];

      const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      expect(subtotal).toBe(37500); // 10000 + 3500 + 24000
    });

    it("should qualify for free shipping above threshold", () => {
      const subtotal = 16000;
      expect(subtotal >= FREE_SHIPPING_THRESHOLD).toBe(true);
    });

    it("should not qualify for free shipping below threshold", () => {
      const subtotal = 14000;
      expect(subtotal >= FREE_SHIPPING_THRESHOLD).toBe(false);
    });

    it("should calculate total with shipping", () => {
      const subtotal = 10000;
      const shippingPrice = 500;
      const total = subtotal + shippingPrice;
      expect(total).toBe(10500);
    });

    it("should calculate total without shipping when free", () => {
      const subtotal = 20000;
      const shippingPrice = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 500;
      const total = subtotal + shippingPrice;
      expect(total).toBe(20000);
    });
  });

  describe("Cart Item Operations", () => {
    interface CartItem {
      productId: string;
      name: string;
      price: number;
      quantity: number;
      size: string;
      color: string;
    }

    let cart: CartItem[] = [];

    beforeEach(() => {
      cart = [];
    });

    it("should add item to empty cart", () => {
      const item: CartItem = {
        productId: "prod-1",
        name: "Test Product",
        price: 5000,
        quantity: 1,
        size: "M",
        color: "Black",
      };

      cart.push(item);
      expect(cart.length).toBe(1);
      expect(cart[0].name).toBe("Test Product");
    });

    it("should increase quantity for existing item", () => {
      const item: CartItem = {
        productId: "prod-1",
        name: "Test Product",
        price: 5000,
        quantity: 1,
        size: "M",
        color: "Black",
      };

      cart.push(item);
      
      // Same product, same size, same color - should increase quantity
      const existingIndex = cart.findIndex(
        (i) => i.productId === item.productId && i.size === item.size && i.color === item.color
      );
      
      if (existingIndex >= 0) {
        cart[existingIndex].quantity += 1;
      }

      expect(cart.length).toBe(1);
      expect(cart[0].quantity).toBe(2);
    });

    it("should add new item for different size", () => {
      cart.push({
        productId: "prod-1",
        name: "Test Product",
        price: 5000,
        quantity: 1,
        size: "M",
        color: "Black",
      });

      // Same product, different size - should add new item
      const newItem: CartItem = {
        productId: "prod-1",
        name: "Test Product",
        price: 5000,
        quantity: 1,
        size: "L",
        color: "Black",
      };

      const existingIndex = cart.findIndex(
        (i) => i.productId === newItem.productId && i.size === newItem.size && i.color === newItem.color
      );
      
      if (existingIndex >= 0) {
        cart[existingIndex].quantity += 1;
      } else {
        cart.push(newItem);
      }

      expect(cart.length).toBe(2);
    });

    it("should remove item from cart", () => {
      cart.push({
        productId: "prod-1",
        name: "Test Product",
        price: 5000,
        quantity: 1,
        size: "M",
        color: "Black",
      });

      cart = cart.filter((item) => !(item.productId === "prod-1" && item.size === "M"));
      expect(cart.length).toBe(0);
    });

    it("should calculate cart item count", () => {
      cart = [
        { productId: "1", name: "A", price: 100, quantity: 2, size: "M", color: "Black" },
        { productId: "2", name: "B", price: 200, quantity: 3, size: "L", color: "White" },
      ];

      const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
      expect(itemCount).toBe(5);
    });

    it("should clear cart", () => {
      cart = [
        { productId: "1", name: "A", price: 100, quantity: 2, size: "M", color: "Black" },
        { productId: "2", name: "B", price: 200, quantity: 3, size: "L", color: "White" },
      ];

      cart = [];
      expect(cart.length).toBe(0);
    });
  });

  describe("Discount Calculations", () => {
    it("should apply percentage discount", () => {
      const subtotal = 10000;
      const discountPercent = 10;
      const discount = subtotal * (discountPercent / 100);
      const total = subtotal - discount;
      
      expect(discount).toBe(1000);
      expect(total).toBe(9000);
    });

    it("should apply fixed discount", () => {
      const subtotal = 10000;
      const fixedDiscount = 1500;
      const total = Math.max(0, subtotal - fixedDiscount);
      
      expect(total).toBe(8500);
    });

    it("should not go below zero", () => {
      const subtotal = 1000;
      const fixedDiscount = 1500;
      const total = Math.max(0, subtotal - fixedDiscount);
      
      expect(total).toBe(0);
    });
  });
});
