import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

export interface CartItem {
  id: string;
  name: string;
  reference: string;
  price: number;
  image_url: string | null;
  quantity: number;
  stock: number;
}

interface CartItemInput {
  id: string;
  name: string;
  reference: string;
  price: number;
  image_url: string | null;
  stock: number;
  quantity?: number;
}

interface CartContextValue {
  cartItems: CartItem[];
  cartCount: number;
  total: number;
  toast: string | null;
  addToCart: (item: CartItemInput) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  clearToast: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const showToast = (message: string) => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    setToast(message);
    timeoutRef.current = window.setTimeout(() => {
      setToast(null);
    }, 2200);
  };

  const addToCart = (item: CartItemInput) => {
    const quantityToAdd = item.quantity ?? 1;

    if (item.stock <= 0) {
      showToast('Rupture de stock');
      return;
    }

    setCartItems((previous) => {
      const existing = previous.find((entry) => entry.id === item.id);

      if (existing) {
        return previous.map((entry) =>
          entry.id === item.id
            ? {
                ...entry,
                quantity: Math.min(entry.quantity + quantityToAdd, item.stock)
              }
            : entry
        );
      }

      return [
        ...previous,
        {
          id: item.id,
          name: item.name,
          reference: item.reference,
          price: item.price,
          image_url: item.image_url,
          quantity: quantityToAdd,
          stock: item.stock
        }
      ];
    });

    showToast('تمت الإضافة');
  };

  const removeFromCart = (id: string) => {
    setCartItems((previous) => previous.filter((entry) => entry.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    setCartItems((previous) =>
      previous
        .map((entry) => (entry.id === id ? { ...entry, quantity: Math.max(quantity, 1) } : entry))
        .filter((entry) => entry.quantity > 0)
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const clearToast = () => {
    setToast(null);
  };

  const cartCount = useMemo(() => cartItems.reduce((total, item) => total + item.quantity, 0), [cartItems]);
  const total = useMemo(() => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0), [cartItems]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        total,
        toast,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        clearToast
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }

  return context;
}
