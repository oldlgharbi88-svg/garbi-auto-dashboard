import { useMemo } from 'react';

export type DiscountType = 'none' | 'percentage' | 'fixed';

export interface CartTotalsItem {
  price: number;
  quantity: number;
}

export interface UseCartTotalsParams {
  items: CartTotalsItem[];
  discountType?: DiscountType;
  discountValue?: number;
  taxRate?: number;
  taxEnabled?: boolean;
  currency?: string;
}

const roundCurrency = (value: number) => Math.round(value * 100) / 100;

export function calculateCartTotals({
  items,
  discountType = 'none',
  discountValue = 0,
  taxRate = 0.2,
  taxEnabled = true,
  currency = 'MAD'
}: UseCartTotalsParams) {
  const subtotal = roundCurrency(items.reduce((sum, item) => sum + item.price * item.quantity, 0));

  const remiseAmount = (() => {
    if (discountType === 'percentage') {
      const percentage = Math.max(0, Math.min(100, Number.isFinite(discountValue) ? discountValue : 0));
      return roundCurrency(subtotal * (percentage / 100));
    }

    if (discountType === 'fixed') {
      const fixedAmount = Math.max(0, Number.isFinite(discountValue) ? discountValue : 0);
      return roundCurrency(Math.min(fixedAmount, subtotal));
    }

    return 0;
  })();

  const htAfterRemise = roundCurrency(Math.max(subtotal - remiseAmount, 0));

  const tvaAmount = taxEnabled ? roundCurrency(htAfterRemise * taxRate) : 0;
  const totalTTC = roundCurrency(htAfterRemise + tvaAmount);

  return {
    subtotal,
    remiseAmount,
    htAfterRemise,
    tvaAmount,
    totalTTC,
    currency
  };
}

export function useCartTotals({
  items,
  discountType = 'none',
  discountValue = 0,
  taxRate = 0.2,
  taxEnabled = true,
  currency = 'MAD'
}: UseCartTotalsParams) {
  const totals = useMemo(() => calculateCartTotals({ items, discountType, discountValue, taxRate, taxEnabled, currency }), [items, discountType, discountValue, taxRate, taxEnabled, currency]);

  return totals;
}
