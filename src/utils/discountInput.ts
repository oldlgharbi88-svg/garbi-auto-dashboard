export type ParsedDiscountInput =
  | { kind: 'percentage'; value: number; error: null }
  | { kind: 'fixed'; value: number; error: null }
  | { kind: 'invalid'; value: 0; error: string };

export function parseCustomDiscountInput(input: string): ParsedDiscountInput {
  const trimmedInput = input.trim();
  if (!trimmedInput) {
    return { kind: 'invalid', value: 0, error: 'Saisissez une remise à appliquer' };
  }

  const normalizedInput = trimmedInput.replace(/\s+/g, ' ').toUpperCase();
  const hasMadSuffix = normalizedInput.includes('MAD');
  const hasPercentSuffix = normalizedInput.endsWith('%');

  let numericText = normalizedInput;
  if (hasMadSuffix) {
    numericText = numericText.replace(/MAD/g, '').trim();
  }
  if (hasPercentSuffix) {
    numericText = numericText.replace(/%/g, '').trim();
  }

  const numericValue = Number(numericText.replace(/,/g, '.'));
  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return { kind: 'invalid', value: 0, error: 'Valeur de remise invalide' };
  }

  if (hasPercentSuffix) {
    return { kind: 'percentage', value: Math.min(Math.max(numericValue, 0), 100), error: null };
  }

  return { kind: 'fixed', value: numericValue, error: null };
}
