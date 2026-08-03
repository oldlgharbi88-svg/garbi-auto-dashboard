import { describe, expect, it } from 'vitest';
import { parseCustomDiscountInput } from './discountInput';

describe('parseCustomDiscountInput', () => {
  it('parses comma-based percentage values', () => {
    const parsed = parseCustomDiscountInput('5,5%');

    expect(parsed.kind).toBe('percentage');
    expect(parsed.value).toBe(5.5);
    expect(parsed.error).toBeNull();
  });

  it('parses amounts with an MAD suffix', () => {
    const parsed = parseCustomDiscountInput('50 MAD');

    expect(parsed.kind).toBe('fixed');
    expect(parsed.value).toBe(50);
    expect(parsed.error).toBeNull();
  });

  it('rejects invalid input', () => {
    const parsed = parseCustomDiscountInput('abc');

    expect(parsed.kind).toBe('invalid');
    expect(parsed.value).toBe(0);
    expect(parsed.error).toBe('Valeur de remise invalide');
  });
});
