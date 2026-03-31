import { useState, useEffect, useCallback } from 'react';
import { getProducts, addProduct, updateProduct, deleteProduct, getLowStockProducts } from '../firebase/inventoryService';

export function useInventory(initialFilters = {}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProducts(filters);
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => { load(); }, [load]);

  async function add(data) {
    const id = await addProduct(data);
    await load();
    return id;
  }

  async function update(id, data) {
    await updateProduct(id, data);
    await load();
  }

  async function remove(id) {
    await deleteProduct(id);
    setProducts(p => p.filter(x => x.id !== id));
  }

  return { products, loading, error, filters, setFilters, reload: load, add, update, remove };
}

export function useLowStockProducts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getLowStockProducts().then(d => { setItems(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);
  return { items, loading };
}
