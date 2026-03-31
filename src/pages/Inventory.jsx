import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Grid3X3, List, Search, Package, X } from 'lucide-react';
import { getProducts, getCategories, addCategory } from '../firebase/inventoryService';
import ProductCard from '../components/inventory/ProductCard';
import ProductForm from '../components/inventory/ProductForm';
import ProductDetailDrawer from '../components/inventory/ProductDetailDrawer';
import StockBadge from '../components/inventory/StockBadge';
import { formatINR } from '../utils/priceFormatter';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name', label: 'Name A–Z' },
];

export default function Inventory() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState([]);
  const [addingCat, setAddingCat] = useState(false);
  const [newCatLabel, setNewCatLabel] = useState('');
  const [savingCat, setSavingCat] = useState(false);
  const newCatRef = useRef(null);
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProducts({ category, search, inStockOnly, sortBy });
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [category, search, inStockOnly, sortBy]);

  useEffect(() => {
    const timer = setTimeout(loadProducts, 300);
    return () => clearTimeout(timer);
  }, [loadProducts]);

  function handleEdit(product) {
    setEditProduct(product);
    setShowForm(true);
  }

  function handleCardClick(product) {
    setSelectedProduct(product);
    setDrawerOpen(true);
  }

  function handleAddToCart(product) {
    navigate('/pos', { state: { addProduct: product } });
  }

  useEffect(() => {
    getCategories().then(list => setCategories(list)).catch(() => {});
  }, []);

  async function handleAddCategory() {
    if (!newCatLabel.trim()) return;
    setSavingCat(true);
    try {
      const updated = await addCategory(newCatLabel.trim());
      setCategories(updated);
      setCategory(updated[updated.length - 1].value);
      setNewCatLabel('');
      setAddingCat(false);
    } catch {
      toast.error('Failed to add category');
    } finally {
      setSavingCat(false);
    }
  }

  const CATEGORY_LABELS = Object.fromEntries(categories.map(c => [c.value, c.label]));

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, SKU, tag code..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={inStockOnly} onChange={e => setInStockOnly(e.target.checked)} className="rounded" />
          In Stock Only
        </label>
        <div className="flex border border-gray-300 rounded-lg overflow-hidden">
          <button onClick={() => setViewMode('grid')} className={`p-2 ${viewMode === 'grid' ? 'bg-indigo-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode('list')} className={`p-2 ${viewMode === 'list' ? 'bg-indigo-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
            <List className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={() => { setEditProduct(null); setShowForm(true); }}
          className="bg-indigo-900 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-indigo-800 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 flex-wrap items-center">
        <button
          onClick={() => setCategory('all')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            category === 'all' ? 'bg-indigo-900 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:border-indigo-400'
          }`}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              category === cat.value
                ? 'bg-indigo-900 text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:border-indigo-400'
            }`}
          >
            {cat.label}
          </button>
        ))}
        {addingCat ? (
          <div className="flex items-center gap-1">
            <input
              ref={newCatRef}
              autoFocus
              value={newCatLabel}
              onChange={e => setNewCatLabel(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddCategory(); if (e.key === 'Escape') { setAddingCat(false); setNewCatLabel(''); } }}
              placeholder="Category name"
              className="border border-indigo-400 rounded-full px-3 py-1 text-xs w-36 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button onClick={handleAddCategory} disabled={savingCat || !newCatLabel.trim()} className="bg-indigo-900 text-white rounded-full px-3 py-1 text-xs font-medium disabled:opacity-40 hover:bg-indigo-800">
              {savingCat ? '...' : 'Add'}
            </button>
            <button onClick={() => { setAddingCat(false); setNewCatLabel(''); }} className="text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAddingCat(true)}
            title="Add category"
            className="w-6 h-6 rounded-full border border-dashed border-gray-400 text-gray-400 hover:border-indigo-500 hover:text-indigo-600 flex items-center justify-center transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Count */}
      <p className="text-sm text-gray-500">{products.length} product{products.length !== 1 ? 's' : ''}</p>

      {/* Products */}
      {loading ? (
        <LoadingSpinner size="lg" className="mt-20" />
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No products found</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {products.map(p => (
            <ProductCard
              key={p.id}
              product={p}
              onEdit={handleEdit}
              onAddToCart={handleAddToCart}
              onClick={() => handleCardClick(p)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Image', 'Name', 'SKU', 'Category', 'MRP', 'Tag Code', 'Stock', 'Colors', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleCardClick(p)}>
                    <td className="px-4 py-3">
                      <img
                        src={p.imageUrls?.[0] || ''}
                        alt=""
                        className="w-10 h-10 object-cover rounded-lg bg-gray-100"
                        onError={e => { e.target.src = ''; e.target.className = 'w-10 h-10 rounded-lg bg-gray-200'; }}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-40 truncate">{p.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.sku}</td>
                    <td className="px-4 py-3"><Badge variant="indigo">{CATEGORY_LABELS[p.category] || p.category}</Badge></td>
                    <td className="px-4 py-3 font-medium text-indigo-900 whitespace-nowrap">{formatINR(p.mrp)}</td>
                    <td className="px-4 py-3"><span className="font-mono font-bold text-amber-600">{p.tagCode}</span></td>
                    <td className="px-4 py-3"><StockBadge quantity={p.quantity} /></td>
                    <td className="px-4 py-3 text-xs text-gray-500">{p.colors?.slice(0, 3).join(', ')}{p.colors?.length > 3 ? '...' : ''}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={e => { e.stopPropagation(); handleEdit(p); }}
                        className="text-indigo-600 hover:text-indigo-800 text-xs font-medium mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); handleAddToCart(p); }}
                        className="text-green-600 hover:text-green-800 text-xs font-medium"
                      >
                        + Sale
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ProductForm
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditProduct(null); }}
        onSaved={loadProducts}
        product={editProduct}
      />

      <ProductDetailDrawer
        product={selectedProduct}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onEdit={handleEdit}
        onAddToCart={handleAddToCart}
        onDeleted={loadProducts}
      />
    </div>
  );
}
