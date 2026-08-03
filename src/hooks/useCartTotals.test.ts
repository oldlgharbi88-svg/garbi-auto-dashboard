import { describe, expect, it } from 'vitest';
import { calculateCartTotals } from './useCartTotals';

describe('useCartTotals', () => {
  const renderTotals = (items: Array<{ price: number; quantity: number }>, discountType: 'none' | 'percentage' | 'fixed' = 'none', discountValue = 0, taxEnabled = true) => {
    return calculateCartTotals({ items, discountType, discountValue, taxRate: 0.2, taxEnabled, currency: 'MAD' });
  };

  it('returns the expected total with 0% discount', () => {
    const totals = renderTotals([{ price: 300, quantity: 2 }]);

    expect(totals.subtotal).toBe(600);
    expect(totals.remiseAmount).toBe(0);
    expect(totals.htAfterRemise).toBe(600);
    expect(totals.tvaAmount).toBe(120);
    expect(totals.totalTTC).toBe(720);
  });

  it('applies a 50% discount correctly', () => {
    const totals = renderTotals([{ price: 300, quantity: 2 }], 'percentage', 50);

    expect(totals.remiseAmount).toBe(300);
    expect(totals.htAfterRemise).toBe(300);
    expect(totals.tvaAmount).toBe(60);
    expect(totals.totalTTC).toBe(360);
  });

  it('returns zero for a 100% discount', () => {
    const totals = renderTotals([{ price: 300, quantity: 2 }], 'percentage', 100);

    expect(totals.remiseAmount).toBe(600);
    expect(totals.htAfterRemise).toBe(0);
    expect(totals.tvaAmount).toBe(0);
    expect(totals.totalTTC).toBe(0);
  });

  it('skips VAT when disabled', () => {
    const totals = renderTotals([{ price: 300, quantity: 2 }], 'percentage', 20, false);

    expect(totals.remiseAmount).toBe(120);
    expect(totals.htAfterRemise).toBe(480);
    expect(totals.tvaAmount).toBe(0);
    expect(totals.totalTTC).toBe(480);
  });
});
