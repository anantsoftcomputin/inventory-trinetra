import { db } from '../firebase/config';
import { doc, runTransaction } from 'firebase/firestore';

const CATEGORY_PREFIX = {
  kurta_set: 'KRT',
  saree: 'SAR',
  chaniya_choli: 'CHC',
  dress_material: 'DRM',
  lehenga: 'LEH',
  dupatta: 'DUP',
  blouse: 'BLS',
  other: 'OTH'
};

export async function generateSKU(category) {
  const prefix = CATEGORY_PREFIX[category] || 'OTH';
  const counterRef = doc(db, 'settings', 'sku_counters');

  const newCount = await runTransaction(db, async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    const current = counterDoc.exists() ? (counterDoc.data()[category] || 0) : 0;
    const next = current + 1;
    const updateData = {};
    updateData[category] = next;
    if (counterDoc.exists()) {
      transaction.update(counterRef, updateData);
    } else {
      transaction.set(counterRef, updateData);
    }
    return next;
  });

  return `TRN-${prefix}-${String(newCount).padStart(4, '0')}`;
}
