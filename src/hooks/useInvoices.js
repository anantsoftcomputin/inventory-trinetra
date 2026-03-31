import { useState, useEffect, useCallback } from 'react';
import { getInvoices, getInvoiceById, cancelInvoice, getTodaysSalesTotal, getMonthlyInvoiceCount } from '../firebase/invoiceService';

export function useInvoices(initialFilters = {}) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getInvoices(filters);
      setInvoices(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => { load(); }, [load]);

  async function fetchById(id) {
    return getInvoiceById(id);
  }

  async function cancel(id) {
    await cancelInvoice(id);
    await load();
  }

  return { invoices, loading, error, filters, setFilters, reload: load, fetchById, cancel };
}

export function useDashboardStats() {
  const [todaySales, setTodaySales] = useState(0);
  const [monthlyCount, setMonthlyCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getTodaysSalesTotal(), getMonthlyInvoiceCount()])
      .then(([sales, count]) => { setTodaySales(sales); setMonthlyCount(count); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { todaySales, monthlyCount, loading };
}
