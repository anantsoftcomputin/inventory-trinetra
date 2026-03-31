export function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatINRShort(amount) {
  return `₹${Number(amount).toLocaleString('en-IN')}/-`;
}
