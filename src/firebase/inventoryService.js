import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDoc,
  getDocs, query, where, limit, serverTimestamp, setDoc
} from 'firebase/firestore';
import { db } from './config';
import { encodePrice } from '../utils/tagCodec';
import { generateSKU } from '../utils/skuGenerator';

const PRODUCTS = 'products';

export async function addProduct(productData) {
  const sku = await generateSKU(productData.category);
  const tagCode = encodePrice(productData.costPrice || 0);
  const data = {
    ...productData,
    sku,
    tagCode,
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  const ref = await addDoc(collection(db, PRODUCTS), data);
  return { id: ref.id, ...data };
}

export async function updateProduct(id, updates) {
  const tagCode = updates.costPrice !== undefined
    ? encodePrice(updates.costPrice)
    : undefined;
  const data = {
    ...updates,
    updatedAt: serverTimestamp(),
    ...(tagCode !== undefined && { tagCode })
  };
  await updateDoc(doc(db, PRODUCTS, id), data);
  return data;
}

export async function deleteProduct(id) {
  await updateDoc(doc(db, PRODUCTS, id), {
    isActive: false,
    updatedAt: serverTimestamp()
  });
}

export async function getProducts({ category, search, inStockOnly, sortBy } = {}) {
  const q = query(collection(db, PRODUCTS), where('isActive', '==', true));
  const snap = await getDocs(q);
  let products = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  if (category && category !== 'all') {
    products = products.filter(p => p.category === category);
  }
  if (inStockOnly) {
    products = products.filter(p => (p.quantity || 0) > 0);
  }
  if (search && search.trim()) {
    const s = search.trim().toLowerCase();
    products = products.filter(p =>
      p.name?.toLowerCase().includes(s) ||
      p.sku?.toLowerCase().includes(s) ||
      p.tagCode?.toLowerCase().includes(s)
    );
  }

  // Client-side sort
  if (sortBy === 'price_asc') products.sort((a, b) => (a.mrp || 0) - (b.mrp || 0));
  else if (sortBy === 'price_desc') products.sort((a, b) => (b.mrp || 0) - (a.mrp || 0));
  else if (sortBy === 'name') products.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  else products.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  return products;
}

export async function getProductById(id) {
  const snap = await getDoc(doc(db, PRODUCTS, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function getProductByTagCode(tagCode) {
  const q = query(
    collection(db, PRODUCTS),
    where('tagCode', '==', tagCode.toUpperCase()),
    where('isActive', '==', true)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

export async function getProductBySKU(sku) {
  const q = query(
    collection(db, PRODUCTS),
    where('sku', '==', sku),
    where('isActive', '==', true)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

export async function updateProductStock(id, quantityDelta) {
  const productSnap = await getDoc(doc(db, PRODUCTS, id));
  if (!productSnap.exists()) return;
  const current = productSnap.data().quantity || 0;
  const newQty = Math.max(0, current + quantityDelta);
  await updateDoc(doc(db, PRODUCTS, id), {
    quantity: newQty,
    updatedAt: serverTimestamp()
  });
}

export async function getLowStockProducts(threshold = 3) {
  const q = query(collection(db, PRODUCTS), where('isActive', '==', true));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(p => (p.quantity || 0) <= threshold)
    .sort((a, b) => (a.quantity || 0) - (b.quantity || 0));
}

export async function getProductCategories() {
  const q = query(collection(db, PRODUCTS), where('isActive', '==', true));
  const snap = await getDocs(q);
  const cats = new Set(snap.docs.map(d => d.data().category).filter(Boolean));
  return Array.from(cats);
}

const CATEGORIES_DOC = doc(db, 'settings', 'categories');

const DEFAULT_CATEGORIES = [
  { value: 'kurta_set', label: 'Kurta Sets' },
  { value: 'saree', label: 'Sarees' },
  { value: 'chaniya_choli', label: 'Chaniya Choli' },
  { value: 'dress_material', label: 'Dress Material' },
  { value: 'lehenga', label: 'Lehengas' },
  { value: 'dupatta', label: 'Dupattas' },
  { value: 'blouse', label: 'Blouses' },
  { value: 'other', label: 'Other' },
];

export async function getCategories() {
  const snap = await getDoc(CATEGORIES_DOC);
  if (snap.exists() && snap.data().list?.length) {
    return snap.data().list;
  }
  // Seed defaults on first load
  await setDoc(CATEGORIES_DOC, { list: DEFAULT_CATEGORIES }, { merge: true });
  return DEFAULT_CATEGORIES;
}

export async function addCategory(label) {
  const value = label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  const snap = await getDoc(CATEGORIES_DOC);
  const current = snap.exists() ? (snap.data().list || []) : DEFAULT_CATEGORIES;
  if (current.find(c => c.value === value)) return current;
  const updated = [...current, { value, label }];
  await setDoc(CATEGORIES_DOC, { list: updated }, { merge: true });
  return updated;
}

export async function deleteCategory(value) {
  const snap = await getDoc(CATEGORIES_DOC);
  const current = snap.exists() ? (snap.data().list || []) : [];
  const updated = current.filter(c => c.value !== value);
  await setDoc(CATEGORIES_DOC, { list: updated }, { merge: true });
  return updated;
}
