export const DIGIT_TO_CODE = {
  '1': 'B', '2': 'V', '3': 'K', '4': 'W', '5': 'T',
  '6': 'G', '7': 'A', '8': 'S', '9': 'P', '0': 'E'
};

export const CODE_TO_DIGIT = Object.fromEntries(
  Object.entries(DIGIT_TO_CODE).map(([k, v]) => [v, k])
);

export function encodePrice(amount) {
  return String(Math.round(amount))
    .split('')
    .map(d => DIGIT_TO_CODE[d] || d)
    .join('');
}

export function decodeTag(code) {
  const digits = code.toUpperCase()
    .split('')
    .map(c => CODE_TO_DIGIT[c] || c)
    .join('');
  return isNaN(Number(digits)) ? null : Number(digits);
}

export function isValidTag(code) {
  return code.toUpperCase().split('').every(c => c in CODE_TO_DIGIT);
}
