const E8 = 100000000n;
const E18_PER_E8 = 10000000000n;

export const parseDecimalToE8 = (value: string): bigint => {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error('Value is required.');
  }

  const isValid = /^\d+(\.\d{0,18})?$/.test(trimmed);
  if (!isValid) {
    throw new Error('Invalid numeric value.');
  }

  const [whole, fraction = ''] = trimmed.split('.');
  const normalizedFraction = (fraction + '00000000').slice(0, 8);
  return BigInt(whole) * E8 + BigInt(normalizedFraction);
};

export const formatE8ToDecimal = (value: bigint, decimals = 4): string => {
  const whole = value / E8;
  const fraction = (value % E8).toString().padStart(8, '0').slice(0, decimals);
  return `${whole.toString()}.${fraction}`;
};

export const toToken18FromE8 = (valueE8: bigint): bigint => valueE8 * E18_PER_E8;

export const quoteNotionalToken18 = (priceE8: bigint, amountE8: bigint): bigint => {
  const quoteE8 = (priceE8 * amountE8) / E8;
  return toToken18FromE8(quoteE8);
};

export const truncateAddress = (address: string | null | undefined): string => {
  if (!address) {
    return 'Not Connected';
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};
