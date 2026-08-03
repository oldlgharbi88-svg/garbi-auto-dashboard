import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { fetchCartCustomPricesFromSupabase, syncCartCustomPriceToSupabase } from '../lib/supabase';
import { useCartTotals, type DiscountType as CartTotalsDiscountType } from '../hooks/useCartTotals';

const CART_STORAGE_KEY = 'garbi_cart_items';
const DISCOUNT_STORAGE_KEY = 'garbi_cart_discount';
const TAX_RATE = 0.2;

type DiscountType = CartTotalsDiscountType;

export interface CartItem {
  id: string;
  name: string;
  reference: string;
  price: number;
  image_url: string | null;
  quantity: number;
  stock: number;
  price_modified?: boolean;
  original_price?: number;
  modification_reason?: string | null;
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
  subtotal: number;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  totalTTC: number;
  toast: string | null;
  addToCart: (item: CartItemInput) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateCartItemPrice: (id: string, newPrice: number, options?: { reason?: string; priceModified?: boolean; originalPrice?: number }) => void;
  setDiscount: (type: DiscountType, value: number) => void;
  clearDiscount: () => void;
  clearCart: () => void;
  clearToast: () => void;
  showToast: (message: string) => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [discountType, setDiscountType] = useState<DiscountType>('none');
  const [discountValue, setDiscountValue] = useState(0);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const hydrateCart = async () => {
      try {
        const savedCart = window.localStorage.getItem(CART_STORAGE_KEY);
        if (savedCart) {
          const parsed = JSON.parse(savedCart) as CartItem[];
          if (Array.isArray(parsed)) {
            setCartItems(parsed);
          }
        }
      } catch {
        window.localStorage.removeItem(CART_STORAGE_KEY);
      }

      try {
        const savedDiscount = window.localStorage.getItem(DISCOUNT_STORAGE_KEY);
        if (savedDiscount) {
          const parsed = JSON.parse(savedDiscount) as { type?: DiscountType; value?: number };
          if (parsed?.type) {
            setDiscountType(parsed.type);
            setDiscountValue(Number(parsed.value) || 0);
          }
        }
      } catch {
        window.localStorage.removeItem(DISCOUNT_STORAGE_KEY);
      }

      try {
        const customPrices = await fetchCartCustomPricesFromSupabase();
        if (Object.keys(customPrices).length > 0) {
          setCartItems((previous) =>
            previous.map((item) => {
              const customPrice = customPrices[item.id];
              if (typeof customPrice === 'number' && customPrice > 0) {
                return {
                  ...item,
                  price: customPrice,
                  original_price: item.original_price ?? item.price,
                  price_modified: true,
                  modification_reason: item.modification_reason ?? 'Synced from Supabase'
                };
              }

              return item;
            })
          );
        }
      } catch (error) {
        console.error('Failed to hydrate cart from Supabase', error);
      }
    };

    void hydrateCart();

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== CART_STORAGE_KEY || !event.newValue) {
        return;
      }

      try {
        const parsed = JSON.parse(event.newValue) as CartItem[];
        if (Array.isArray(parsed)) {
          setCartItems(parsed);
        }
      } catch {
        window.localStorage.removeItem(CART_STORAGE_KEY);
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(DISCOUNT_STORAGE_KEY, JSON.stringify({ type: discountType, value: discountValue }));
  }, [discountType, discountValue]);

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
      showToast('Rupture de stock — pièce indisponible');
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

  const updateCartItemPrice = (id: string, newPrice: number, options?: { reason?: string; priceModified?: boolean; originalPrice?: number }) => {
    const normalizedPrice = Number.isFinite(newPrice) ? Math.max(newPrice, 0.01) : 0.01;

    setCartItems((previous) =>
      previous.map((entry) => {
        if (entry.id !== id) {
          return entry;
        }

        return {
          ...entry,
          price: normalizedPrice,
          original_price: entry.original_price ?? options?.originalPrice ?? entry.price,
          price_modified: options?.priceModified ?? true,
          modification_reason: options?.reason ?? entry.modification_reason ?? null
        };
      })
    );

    void syncCartCustomPriceToSupabase(id, normalizedPrice);
  };

  const setDiscount = (type: DiscountType, value: number) => {
    if (type === 'percentage') {
      const normalizedValue = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
      setDiscountType('percentage');
      setDiscountValue(normalizedValue);
      return;
    }

    if (type === 'fixed') {
      const normalizedValue = Math.max(0, Number.isFinite(value) ? value : 0);
      setDiscountType('fixed');
      setDiscountValue(normalizedValue);
      return;
    }

    setDiscountType('none');
    setDiscountValue(0);
  };

  const clearDiscount = () => {
    setDiscountType('none');
    setDiscountValue(0);
  };

  const clearCart = () => {
    setCartItems([]);
    clearDiscount();
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(CART_STORAGE_KEY);
    }
  };

  const clearToast = () => {
    setToast(null);
  };

  const cartCount = useMemo(() => cartItems.reduce((total, item) => total + item.quantity, 0), [cartItems]);
  const { subtotal, remiseAmount, htAfterRemise, tvaAmount, totalTTC } = useCartTotals({
    items: cartItems.map((item) => ({ price: item.price, quantity: item.quantity })),
    discountType,
    discountValue,
    taxRate: TAX_RATE,
    taxEnabled: true,
    currency: 'MAD'
  });
  const discountAmount = remiseAmount;
  const netAmount = htAfterRemise;
  const taxAmount = tvaAmount;
  const total = totalTTC;

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        total,
        subtotal,
        discountType,
        discountValue,
        discountAmount,
        taxRate: TAX_RATE,
        taxAmount,
        totalTTC,
        toast,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateCartItemPrice,
        setDiscount,
        clearDiscount,
        clearCart,
        clearToast,
        showToast
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
