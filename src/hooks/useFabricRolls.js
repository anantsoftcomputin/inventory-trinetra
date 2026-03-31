import { useState, useEffect, useCallback } from 'react';
import { getFabricRolls, addFabricRoll, updateFabricRoll, deleteFabricRoll, consumeMeters, getLowStockRolls } from '../firebase/fabricRollService';

export function useFabricRolls(initialFilters = {}) {
  const [rolls, setRolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getFabricRolls(filters);
      setRolls(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => { load(); }, [load]);

  async function add(data) {
    const id = await addFabricRoll(data);
    await load();
    return id;
  }

  async function update(id, data) {
    await updateFabricRoll(id, data);
    await load();
  }

  async function remove(id) {
    await deleteFabricRoll(id);
    setRolls(r => r.filter(x => x.id !== id));
  }

  async function consume(id, meters, usedFor) {
    await consumeMeters(id, meters, usedFor);
    await load();
  }

  return { rolls, loading, error, filters, setFilters, reload: load, add, update, remove, consume };
}

export function useLowStockRolls() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getLowStockRolls().then(d => { setItems(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);
  return { items, loading };
}
