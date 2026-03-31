import {
  collection, doc, addDoc, updateDoc, getDoc, getDocs,
  query, where, serverTimestamp, arrayUnion
} from 'firebase/firestore';
import { db } from './config';
import { encodePrice } from '../utils/tagCodec';

const ROLLS = 'fabric_rolls';

export async function addFabricRoll(data) {
  const tagCode = encodePrice(data.costPerMeter || 0);
  const rollData = {
    ...data,
    tagCode,
    usedMeters: 0,
    remainingMeters: data.totalMeters || 0,
    consumptionLog: [],
    isActive: true,
    createdAt: serverTimestamp()
  };
  const ref = await addDoc(collection(db, ROLLS), rollData);
  return { id: ref.id, ...rollData };
}

export async function updateFabricRoll(id, updates) {
  const data = { ...updates };
  if (updates.costPerMeter !== undefined) {
    data.tagCode = encodePrice(updates.costPerMeter);
  }
  await updateDoc(doc(db, ROLLS, id), data);
  return data;
}

export async function getFabricRolls({ fabricType, search, lowStockOnly } = {}) {
  const q = query(collection(db, ROLLS), where('isActive', '==', true));
  const snap = await getDocs(q);
  let rolls = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  // Client-side filters
  if (fabricType && fabricType !== 'all') {
    rolls = rolls.filter(r => r.fabricType === fabricType);
  }
  if (lowStockOnly) {
    rolls = rolls.filter(r => r.remainingMeters <= 5);
  }
  if (search && search.trim()) {
    const s = search.trim().toLowerCase();
    rolls = rolls.filter(r =>
      r.name?.toLowerCase().includes(s) ||
      r.fabricType?.toLowerCase().includes(s) ||
      r.color?.toLowerCase().includes(s) ||
      r.supplier?.toLowerCase().includes(s)
    );
  }

  // Client-side sort: newest first
  rolls.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  return rolls;
}

export async function getFabricRollById(id) {
  const snap = await getDoc(doc(db, ROLLS, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function consumeMeters(rollId, meters, usedFor, productId = null) {
  const rollSnap = await getDoc(doc(db, ROLLS, rollId));
  if (!rollSnap.exists()) throw new Error('Roll not found');
  const roll = rollSnap.data();
  const newUsed = (roll.usedMeters || 0) + Number(meters);
  const newRemaining = (roll.totalMeters || 0) - newUsed;
  const logEntry = {
    date: new Date(),
    meters: Number(meters),
    usedFor,
    productId: productId || null
  };
  await updateDoc(doc(db, ROLLS, rollId), {
    usedMeters: newUsed,
    remainingMeters: Math.max(0, newRemaining),
    consumptionLog: arrayUnion(logEntry)
  });
}

export async function getLowStockRolls(threshold = 5) {
  const q = query(collection(db, ROLLS), where('isActive', '==', true));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(r => (r.remainingMeters || 0) <= threshold);
}
