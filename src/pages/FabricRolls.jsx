import { useState, useEffect, useCallback } from 'react';
import { Plus, AlertTriangle, Search } from 'lucide-react';
import { getFabricRolls, getLowStockRolls, updateFabricRoll } from '../firebase/fabricRollService';
import { formatINR } from '../utils/priceFormatter';
import RollForm from '../components/fabricRolls/RollForm';
import ConsumeMetersModal from '../components/fabricRolls/ConsumeMetersModal';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function FabricRolls() {
  const [rolls, setRolls] = useState([]);
  const [lowStockRolls, setLowStockRolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [fabricType, setFabricType] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editRoll, setEditRoll] = useState(null);
  const [consumeRoll, setConsumeRoll] = useState(null);
  const [historyRoll, setHistoryRoll] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadRolls = useCallback(async () => {
    setLoading(true);
    try {
      const [data, low] = await Promise.all([
        getFabricRolls({ fabricType, search }),
        getLowStockRolls(5)
      ]);
      setRolls(data);
      setLowStockRolls(low);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [fabricType, search]);

  useEffect(() => {
    const t = setTimeout(loadRolls, 300);
    return () => clearTimeout(t);
  }, [loadRolls]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await updateFabricRoll(deleteTarget.id, { isActive: false });
      toast.success('Roll removed');
      setDeleteTarget(null);
      loadRolls();
    } catch {
      toast.error('Failed to remove');
    } finally {
      setDeleting(false);
    }
  }

  function formatDate(ts) {
    if (!ts) return '-';
    try {
      const d = ts.toDate ? ts.toDate() : new Date(ts);
      return d.toLocaleDateString('en-IN');
    } catch { return '-'; }
  }

  const FABRIC_TYPES = ['all', 'Georgette', 'Silk', 'Cotton', 'Net', 'Chanderi', 'Bandhani', 'Crepe', 'Chiffon', 'Velvet', 'Linen', 'Khadi', 'Other'];

  return (
    <div className="space-y-4">
      {/* Low Stock Alert */}
      {lowStockRolls.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0" />
          <p className="text-sm text-orange-700">
            <strong>{lowStockRolls.length} roll{lowStockRolls.length > 1 ? 's' : ''}</strong> running low (≤ 5m remaining):
            {' '}{lowStockRolls.map(r => r.name).join(', ')}
          </p>
        </div>
      )}

      {/* Top Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search rolls..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={fabricType}
          onChange={e => setFabricType(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          {FABRIC_TYPES.map(t => (
            <option key={t} value={t}>{t === 'all' ? 'All Types' : t}</option>
          ))}
        </select>
        <button
          onClick={() => { setEditRoll(null); setShowForm(true); }}
          className="bg-indigo-900 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-indigo-800 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Roll
        </button>
      </div>

      <p className="text-sm text-gray-500">{rolls.length} roll{rolls.length !== 1 ? 's' : ''}</p>

      {loading ? (
        <LoadingSpinner size="lg" className="mt-20" />
      ) : rolls.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p>No fabric rolls found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Roll Name', 'Type', 'Color', 'Pattern', 'Total', 'Used', 'Remaining', 'Cost/m', 'Tag Code', 'Location', 'Supplier', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rolls.map(roll => {
                  const pct = roll.totalMeters > 0 ? (roll.usedMeters / roll.totalMeters) * 100 : 0;
                  const isLow = roll.remainingMeters <= 5;
                  return (
                    <tr key={roll.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900 max-w-40">
                        <div>{roll.name}</div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div
                            className={`h-1.5 rounded-full ${isLow ? 'bg-orange-500' : 'bg-indigo-500'}`}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3"><Badge variant="indigo">{roll.fabricType}</Badge></td>
                      <td className="px-4 py-3 text-gray-600">{roll.color}</td>
                      <td className="px-4 py-3 text-gray-600">{roll.pattern}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{roll.totalMeters}m</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-500">{roll.usedMeters || 0}m</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`font-semibold ${isLow ? 'text-orange-600' : 'text-green-600'}`}>
                          {roll.remainingMeters}m
                        </span>
                        {isLow && <span className="ml-1 text-orange-500">⚠️</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatINR(roll.costPerMeter)}</td>
                      <td className="px-4 py-3"><span className="font-mono font-bold text-amber-600">{roll.tagCode}</span></td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{roll.rackLocation}</td>
                      <td className="px-4 py-3 text-gray-500">{roll.supplier}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => setConsumeRoll(roll)}
                            className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                          >
                            Consume
                          </button>
                          <button
                            onClick={() => setHistoryRoll(roll)}
                            className="text-gray-500 hover:text-gray-700 text-xs font-medium"
                          >
                            History
                          </button>
                          <button
                            onClick={() => { setEditRoll(roll); setShowForm(true); }}
                            className="text-amber-600 hover:text-amber-800 text-xs font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteTarget(roll)}
                            className="text-red-500 hover:text-red-700 text-xs font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Consumption History Modal */}
      <Modal isOpen={!!historyRoll} onClose={() => setHistoryRoll(null)} title={`Consumption History — ${historyRoll?.name}`} size="md">
        <div className="p-6">
          {!historyRoll?.consumptionLog?.length ? (
            <p className="text-center text-gray-400 py-8">No consumption recorded yet</p>
          ) : (
            <table className="min-w-full text-sm divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['Date', 'Meters', 'Used For'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {historyRoll.consumptionLog.map((log, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 text-gray-500">{formatDate(log.date)}</td>
                    <td className="px-3 py-2 font-medium">{log.meters}m</td>
                    <td className="px-3 py-2 text-gray-700">{log.usedFor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Modal>

      <RollForm
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditRoll(null); }}
        onSaved={loadRolls}
        roll={editRoll}
      />

      <ConsumeMetersModal
        isOpen={!!consumeRoll}
        onClose={() => setConsumeRoll(null)}
        roll={consumeRoll}
        onSaved={loadRolls}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove Fabric Roll"
        message={`Remove "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Remove"
        loading={deleting}
      />
    </div>
  );
}
