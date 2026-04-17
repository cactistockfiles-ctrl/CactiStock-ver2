import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import { CactusItem } from "@/types/content";

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

  const addToCart = useCallback((cactus: CactusItem) => {
    let wasAdded = false;
    setItems((prev) => {
      const existing = prev.find((item) => item.cactus.id === cactus.id);
      if (existing) {
        wasAdded = false;
        return prev;
      }
      wasAdded = true;
      return [...prev, { cactus, quantity: 1 }];
    });
    return wasAdded;
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.cactus.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.cactus.id !== id));
    } else {
      setItems((prev) =>
        prev.map((item) =>
          item.cactus.id === id
            ? { ...item, quantity: Math.min(1, quantity) }
            : item,
        ),
      );
    }
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

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
