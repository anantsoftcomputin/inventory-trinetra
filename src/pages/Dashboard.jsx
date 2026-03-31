import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, IndianRupee, FileText, AlertTriangle,
  Plus, Tag, ShoppingCart, Layers
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { getProducts, getLowStockProducts } from '../firebase/inventoryService';
import { getInvoices, getTodaysSalesTotal, getMonthlyInvoiceCount, getLast30DaysSales } from '../firebase/invoiceService';
import { formatINR } from '../utils/priceFormatter';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';

function KPICard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`p-3 rounded-xl bg-opacity-10 ${color.replace('text-', 'bg-')}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  );
}

const CATEGORY_LABELS = {
  kurta_set: 'Kurta Sets', saree: 'Sarees', chaniya_choli: 'Chaniya Choli',
  dress_material: 'Dress Material', lehenga: 'Lehenga', dupatta: 'Dupatta',
  blouse: 'Blouse', other: 'Other'
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [kpi, setKpi] = useState({ totalProducts: 0, todaysSales: 0, monthlyInvoices: 0, lowStock: 0 });
  const [categoryData, setCategoryData] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [products, lowStockProds, todaysSales, monthlyCount, salesLast30, invoices] = await Promise.all([
          getProducts({}),
          getLowStockProducts(3),
          getTodaysSalesTotal(),
          getMonthlyInvoiceCount(),
          getLast30DaysSales(),
          getInvoices({ pageLimit: 10 })
        ]);

        setKpi({
          totalProducts: products.length,
          todaysSales,
          monthlyInvoices: monthlyCount,
          lowStock: lowStockProds.length
        });

        // Build category breakdown
        const catMap = {};
        products.forEach(p => {
          const cat = p.category || 'other';
          catMap[cat] = (catMap[cat] || 0) + 1;
        });
        setCategoryData(Object.entries(catMap).map(([cat, count]) => ({
          name: CATEGORY_LABELS[cat] || cat,
          count
        })));

        setSalesData(salesLast30);
        setRecentInvoices(invoices.slice(0, 10));
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function statusVariant(status) {
    if (status === 'paid') return 'success';
    if (status === 'pending') return 'warning';
    return 'danger';
  }

  function formatDate(ts) {
    if (!ts) return '-';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
  }

  if (loading) return <LoadingSpinner size="lg" className="mt-20" />;

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={Package} label="Total Products" value={kpi.totalProducts} color="text-indigo-700" />
        <KPICard icon={IndianRupee} label="Today's Sales" value={formatINR(kpi.todaysSales)} color="text-amber-600" />
        <KPICard icon={FileText} label="Invoices This Month" value={kpi.monthlyInvoices} color="text-green-600" />
        <KPICard icon={AlertTriangle} label="Low Stock Alerts" value={kpi.lowStock} color="text-red-600" sub="items ≤ 3 pcs" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Products by Category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoryData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#4338ca" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-md p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Daily Sales — Last 30 Days</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={salesData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => formatINR(v)} />
              <Line type="monotone" dataKey="total" stroke="#d97706" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <button onClick={() => navigate('/pos')} className="bg-indigo-900 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-indigo-800 flex items-center gap-2">
          <ShoppingCart className="w-4 h-4" /> New Sale
        </button>
        <button onClick={() => navigate('/inventory')} className="bg-amber-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-amber-700 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Product
        </button>
        <button onClick={() => navigate('/fabric-rolls')} className="bg-white border border-gray-300 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
          <Layers className="w-4 h-4" /> Add Fabric Roll
        </button>
        <button onClick={() => navigate('/tag-manager')} className="bg-white border border-gray-300 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
          <Tag className="w-4 h-4" /> Print Tag
        </button>
      </div>

      {/* Recent Invoices */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Recent Invoices</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Invoice No.', 'Sold To', 'Date', 'Items', 'Total', 'Status', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentInvoices.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No invoices yet</td></tr>
              ) : recentInvoices.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-indigo-700 font-medium">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3 text-gray-800">{inv.soldTo}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(inv.createdAt)}</td>
                  <td className="px-4 py-3 text-gray-500">{inv.items?.length || 0}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{formatINR(inv.grandTotal)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant(inv.status)}>
                      {inv.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => navigate('/invoices')} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
