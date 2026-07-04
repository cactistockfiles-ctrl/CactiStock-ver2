import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { CactusItem } from "@/types/content";

const CART_STORAGE_KEY = "cactistock_cart";

interface CartItem {
  cactus: CactusItem;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (cactus: CactusItem) => boolean;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const didMountRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      console.log("[CartContext] loading cart from localStorage");
      const raw = window.localStorage.getItem(CART_STORAGE_KEY);
      if (raw) {
        console.log("[CartContext] raw cart data found", raw.slice(0, 200));
        setItems(JSON.parse(raw) as CartItem[]);
      }
    } catch (e) {
      console.log("[CartContext] error reading localStorage", String(e));
    }
  }, []);

  useEffect(() => {
    // Skip persisting on initial mount to avoid overwriting existing storage
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      console.log(
        "[CartContext] persisted cart on items change",
        JSON.stringify(items).slice(0, 200),
      );
    } catch (e) {
      console.log("[CartContext] error persisting localStorage", String(e));
    }
  }, [items]);

  const addToCart = useCallback((cactus: CactusItem) => {
    let wasAdded = false;
    setItems((prev) => {
      const existing = prev.find((item) => item.cactus.id === cactus.id);
      if (existing) {
        wasAdded = false;
        return prev;
      }
      const next = [...prev, { cactus, quantity: 1 }];
      try {
        if (typeof window !== "undefined") {
          const rawNext = JSON.stringify(next);
          console.debug(
            "[CartContext] persisting cart to localStorage",
            rawNext.slice(0, 200),
          );
          window.localStorage.setItem(CART_STORAGE_KEY, rawNext);
        }
      } catch {
        // ignore
      }
      wasAdded = true;
      return next;
    });
    return wasAdded;
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((item) => item.cactus.id !== id);
      try {
        if (typeof window !== "undefined") {
          const rawNext = JSON.stringify(next);
          console.debug(
            "[CartContext] persisting cart to localStorage (remove)",
            rawNext.slice(0, 200),
          );
          window.localStorage.setItem(CART_STORAGE_KEY, rawNext);
        }
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => {
        const next = prev.filter((item) => item.cactus.id !== id);
        try {
          if (typeof window !== "undefined") {
            const rawNext = JSON.stringify(next);
            console.debug(
              "[CartContext] persisting cart to localStorage (updateQuantity)",
              rawNext.slice(0, 200),
            );
            window.localStorage.setItem(CART_STORAGE_KEY, rawNext);
          }
        } catch {
          // ignore
        }
        return next;
      });
    } else {
      setItems((prev) => {
        const next = prev.map((item) =>
          item.cactus.id === id
            ? { ...item, quantity: Math.max(1, quantity) }
            : item,
        );
        try {
          if (typeof window !== "undefined") {
            window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(next));
          }
        } catch {
          // ignore
        }
        return next;
      });
    }
  }, []);

  const clearCart = useCallback(() => {
    setItems(() => {
      try {
        if (typeof window !== "undefined") {
          console.debug("[CartContext] clearing cart localStorage");
          window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([]));
        }
      } catch {
        // ignore
      }
      return [];
    });
  }, []);

  const value = useMemo(
    () => ({
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice: items.reduce(
        (sum, item) => sum + item.cactus.price * item.quantity,
        0,
      ),
    }),
    [items, addToCart, removeFromCart, updateQuantity, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};
