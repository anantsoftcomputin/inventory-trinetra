import {
  collection, doc, addDoc, updateDoc, getDoc, getDocs,
  query, where, orderBy, limit, runTransaction, serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './config';
import { updateProductStock } from './inventoryService';

const INVOICES = 'invoices';
const SETTINGS_DOC = doc(db, 'settings', 'store_settings');

export async function getNextInvoiceNumber() {
  return runTransaction(db, async (transaction) => {
    const settingsSnap = await transaction.get(SETTINGS_DOC);
    const data = settingsSnap.exists() ? settingsSnap.data() : {};
    const prefix = data.invoicePrefix || 'TRN';
    const counter = (data.invoiceCounter || 0) + 1;
    const year = new Date().getFullYear();
    transaction.update(SETTINGS_DOC, { invoiceCounter: counter });
    return `${prefix}-${year}-${String(counter).padStart(4, '0')}`;
  });
}

export async function createInvoice(invoiceData) {
  const invoiceNumber = await getNextInvoiceNumber();
  const data = {
    ...invoiceData,
    invoiceNumber,
    status: invoiceData.status || 'paid',
    createdAt: serverTimestamp()
  };
  const ref = await addDoc(collection(db, INVOICES), data);

  // Decrement stock for each item
  const stockUpdates = (invoiceData.items || []).map(item =>
    updateProductStock(item.productId, -(item.qty || 1))
  );
  await Promise.all(stockUpdates);

  return { id: ref.id, invoiceNumber, ...data };
}

export async function getInvoices({ startDate, endDate, status, search, pageLimit } = {}) {
  // Use only orderBy (single-field index, auto-created) — filter everything else client-side
  const constraints = [orderBy('createdAt', 'desc')];
  if (pageLimit) constraints.push(limit(pageLimit));

  const q = query(collection(db, INVOICES), ...constraints);
  const snap = await getDocs(q);
  let invoices = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  if (status && status !== 'all') {
    invoices = invoices.filter(inv => inv.status === status);
  }
  if (startDate) {
    invoices = invoices.filter(inv => {
      const d = inv.createdAt?.toDate ? inv.createdAt.toDate() : new Date(inv.createdAt);
      return d >= new Date(startDate);
    });
  }
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    invoices = invoices.filter(inv => {
      const d = inv.createdAt?.toDate ? inv.createdAt.toDate() : new Date(inv.createdAt);
      return d <= end;
    });
  }
  if (search && search.trim()) {
    const s = search.trim().toLowerCase();
    invoices = invoices.filter(inv =>
      inv.soldTo?.toLowerCase().includes(s) ||
      inv.invoiceNumber?.toLowerCase().includes(s) ||
      inv.customerPhone?.includes(s)
    );
  }
  return invoices;
}

export async function getInvoiceById(id) {
  const snap = await getDoc(doc(db, INVOICES, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function cancelInvoice(id) {
  const invoiceSnap = await getDoc(doc(db, INVOICES, id));
  if (!invoiceSnap.exists()) throw new Error('Invoice not found');
  const invoice = invoiceSnap.data();

  // Restore stock for each item
  const stockUpdates = (invoice.items || []).map(item =>
    updateProductStock(item.productId, item.qty || 1)
  );
  await Promise.all(stockUpdates);

  await updateDoc(doc(db, INVOICES, id), { status: 'cancelled' });
}

export async function getTodaysSalesTotal() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  // Range on single field — no composite index needed
  const q = query(
    collection(db, INVOICES),
    where('createdAt', '>=', Timestamp.fromDate(start)),
    where('createdAt', '<=', Timestamp.fromDate(end))
  );
  const snap = await getDocs(q);
  return snap.docs
    .filter(d => d.data().status === 'paid')
    .reduce((sum, d) => sum + (d.data().grandTotal || 0), 0);
}

export async function getMonthlyInvoiceCount() {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const q = query(
    collection(db, INVOICES),
    where('createdAt', '>=', Timestamp.fromDate(start))
  );
  const snap = await getDocs(q);
  return snap.size;
}

export async function getLast30DaysSales() {
  const start = new Date();
  start.setDate(start.getDate() - 29);
  start.setHours(0, 0, 0, 0);

  // Single-field range — no composite index needed; filter status client-side
  const q = query(
    collection(db, INVOICES),
    where('createdAt', '>=', Timestamp.fromDate(start))
  );
  const snap = await getDocs(q);
  const byDay = {};
  snap.docs
    .filter(d => d.data().status === 'paid')
    .sort((a, b) => (a.data().createdAt?.seconds || 0) - (b.data().createdAt?.seconds || 0))
    .forEach(d => {
      const inv = d.data();
      const date = inv.createdAt?.toDate ? inv.createdAt.toDate() : new Date(inv.createdAt);
      const key = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      byDay[key] = (byDay[key] || 0) + (inv.grandTotal || 0);
    });
  return Object.entries(byDay).map(([date, total]) => ({ date, total }));
}
