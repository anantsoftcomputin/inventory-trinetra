import { useState, useEffect, useCallback } from 'react';
import { Search, Filter } from 'lucide-react';
import { getInvoices, cancelInvoice } from '../firebase/invoiceService';
import { getInvoiceById } from '../firebase/invoiceService';
import { formatINR } from '../utils/priceFormatter';
import InvoiceModal from '../components/pos/InvoiceModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const PAGE_SIZE = 20;

function statusVariant(status) {
  if (status === 'paid') return 'success';
  if (status === 'pending') return 'warning';
  return 'danger';
}

function formatDate(ts) {
  if (!ts) return '-';
  try {
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
  } catch { return '-'; }
}

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(0);
  const [viewInvoice, setViewInvoice] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getInvoices({ status, search, startDate, endDate });
      setInvoices(data);
      setPage(0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [status, search, startDate, endDate]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  async function handleCancel() {
    setCancelling(true);
    try {
      await cancelInvoice(cancelTarget.id);
      toast.success('Invoice cancelled and stock restored');
      setCancelTarget(null);
      load();
    } catch {
      toast.error('Failed to cancel invoice');
    } finally {
      setCancelling(false);
    }
  }

  async function handleView(inv) {
    try {
      const full = await getInvoiceById(inv.id);
      setViewInvoice(full || inv);
    } catch {
      setViewInvoice(inv);
    }
  }

  const total = invoices.reduce((s, i) => s + (i.grandTotal || 0), 0);
  const paged = invoices.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const pages = Math.ceil(invoices.length / PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex gap-4 flex-wrap">
        <div className="bg-white rounded-xl shadow-md px-5 py-3 flex items-center gap-3">
          <span className="text-sm text-gray-500">Total:</span>
          <span className="font-bold text-indigo-900">{invoices.length} invoices</span>
        </div>
        <div className="bg-white rounded-xl shadow-md px-5 py-3 flex items-center gap-3">
          <span className="text-sm text-gray-500">Value:</span>
          <span className="font-bold text-amber-600">{formatINR(total)}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-4 flex flex-wrap gap-3 items-end">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Customer name or invoice no..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Start Date</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">End Date</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Status</label>
          <select value={status} onChange={e => setStatus(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="all">All</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner size="lg" className="mt-20" />
      ) : invoices.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No invoices found</div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Invoice No.', 'Sold To', 'Date', 'Items', 'Subtotal', 'Discount', 'Total', 'Payment', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paged.map(inv => (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-indigo-700 font-medium whitespace-nowrap">{inv.invoiceNumber}</td>
                      <td className="px-4 py-3 text-gray-900 max-w-32 truncate">{inv.soldTo}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(inv.createdAt)}</td>
                      <td className="px-4 py-3 text-gray-500">{inv.items?.length || 0}</td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{formatINR(inv.subtotal)}</td>
                      <td className="px-4 py-3 text-orange-500 whitespace-nowrap">{inv.totalDiscount > 0 ? `- ${formatINR(inv.totalDiscount)}` : '—'}</td>
                      <td className="px-4 py-3 font-bold text-indigo-900 whitespace-nowrap">{formatINR(inv.grandTotal)}</td>
                      <td className="px-4 py-3 text-gray-600">{inv.paymentMode}</td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant(inv.status)}>{inv.status}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => handleView(inv)} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">View</button>
                          <button onClick={() => handleView(inv)} className="text-gray-500 hover:text-gray-700 text-xs font-medium">Reprint</button>
                          {inv.status !== 'cancelled' && (
                            <button onClick={() => setCancelTarget(inv)} className="text-red-400 hover:text-red-600 text-xs font-medium">Cancel</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex justify-center gap-2">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">← Prev</button>
              <span className="px-3 py-1.5 text-sm text-gray-600">Page {page + 1} of {pages}</span>
              <button onClick={() => setPage(p => Math.min(pages - 1, p + 1))} disabled={page >= pages - 1} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">Next →</button>
            </div>
          )}
        </>
      )}

      {/* View Invoice Modal */}
      {viewInvoice && (
        <InvoiceModal
          isOpen={!!viewInvoice}
          onClose={() => setViewInvoice(null)}
          invoiceData={viewInvoice}
          readOnly
        />
      )}

      <ConfirmDialog
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        title="Cancel Invoice"
        message={`Cancel invoice ${cancelTarget?.invoiceNumber}? Stock quantities will be restored.`}
        confirmLabel="Cancel Invoice"
        loading={cancelling}
      />
    </div>
  );
}
