import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, ChevronDown, ChevronUp, Trash2, Plus, X } from 'lucide-react';
import { getProducts, getCategories, addCategory } from '../firebase/inventoryService';
import ProductCard from '../components/inventory/ProductCard';
import CartPanel from '../components/pos/CartPanel';
import CustomerForm from '../components/pos/CustomerForm';
import DiscountRow from '../components/pos/DiscountRow';
import InvoiceModal from '../components/pos/InvoiceModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatINR } from '../utils/priceFormatter';
import toast from 'react-hot-toast';

const PAYMENT_MODES = ['Cash', 'Card', 'UPI', 'Credit'];

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function newCartId() {
  return `cart_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export default function POS() {
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [addingCat, setAddingCat] = useState(false);
  const [newCatLabel, setNewCatLabel] = useState('');
  const [savingCat, setSavingCat] = useState(false);
  const newCatRef = useRef(null);
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({ soldTo: '', phone: '', date: todayStr() });
  const [discounts, setDiscounts] = useState([]);
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [showInvoice, setShowInvoice] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [customerExpanded, setCustomerExpanded] = useState(true);
  const [invoiceDone, setInvoiceDone] = useState(false);

  // Load categories from Firestore
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

  const loadProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const data = await getProducts({ category, search });
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProducts(false);
    }
  }, [category, search]);

  useEffect(() => {
    const t = setTimeout(loadProducts, 300);
    return () => clearTimeout(t);
  }, [loadProducts]);

  // Handle navigation state (e.g. add product from Inventory page)
  useEffect(() => {
    if (location.state?.addProduct) {
      addToCart(location.state.addProduct);
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  function addToCart(product) {
    if (product.quantity === 0) {
      toast.error('Out of stock');
      return;
    }
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        return prev.map(i => i.productId === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, {
        cartId: newCartId(),
        productId: product.id,
        productName: product.name,
        description: product.name,
        costNotes: product.costBreakdown
          ? [
              product.costBreakdown.materialCost ? `${product.costBreakdown.materialCost}/- mum` : '',
              product.costBreakdown.stitchingCost ? `${product.costBreakdown.stitchingCost}/- stitching` : ''
            ].filter(Boolean).join('. ')
          : (product.notes || ''),
        size: product.sizes?.[0] || '',
        availableSizes: product.sizes || [],
        qty: 1,
        unitPrice: product.mrp,
        lineTotal: product.mrp
      }];
    });
    toast.success(`${product.name} added to cart`);
  }

  function updateCartItem(cartId, field, value) {
    setCart(prev => prev.map(i => i.cartId === cartId ? {
      ...i,
      [field]: value,
      lineTotal: field === 'qty' ? value * i.unitPrice : field === 'unitPrice' ? i.qty * value : i.lineTotal
    } : i));
  }

  function removeFromCart(cartId) {
    setCart(prev => prev.filter(i => i.cartId !== cartId));
  }

  const subtotal = cart.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const totalDiscount = discounts.reduce((s, d) => {
    const calc = d.type === 'percent'
      ? Math.round(subtotal * (Number(d.value) / 100))
      : Number(d.value) || 0;
    return s + calc;
  }, 0);
  const grandTotal = subtotal - totalDiscount;

  function handleGenerateInvoice() {
    if (!customer.soldTo.trim()) {
      toast.error('Please enter customer name');
      return;
    }
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    setShowInvoice(true);
  }

  function handleInvoiceCreated() {
    setCart([]);
    setCustomer({ soldTo: '', phone: '', date: todayStr() });
    setDiscounts([]);
    setPaymentMode('Cash');
    setInvoiceDone(true);
  }

  function clearCart() {
    setCart([]);
    setDiscounts([]);
    setShowClearConfirm(false);
    toast.success('Cart cleared');
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-120px)] overflow-hidden">
      {/* LEFT — Product Browser */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="space-y-3 mb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, SKU, or tag code..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <button
              onClick={() => setCategory('all')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                category === 'all'
                  ? 'bg-indigo-900 text-white'
                  : 'bg-white text-gray-600 border border-gray-300 hover:border-indigo-400'
              }`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  category === cat.value
                    ? 'bg-indigo-900 text-white'
                    : 'bg-white text-gray-600 border border-gray-300 hover:border-indigo-400'
                }`}
              >
                {cat.label}
              </button>
            ))}

            {/* Add Category */}
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
                <button
                  onClick={handleAddCategory}
                  disabled={savingCat || !newCatLabel.trim()}
                  className="bg-indigo-900 text-white rounded-full px-3 py-1 text-xs font-medium disabled:opacity-40 hover:bg-indigo-800"
                >
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
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingProducts ? (
            <LoadingSpinner className="mt-12" />
          ) : products.length === 0 ? (
            <p className="text-center text-gray-400 py-12">No products found</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {products.map(p => (
                <ProductCard
                  key={p.id}
                  product={p}
                  showAddToCart
                  onAddToCart={addToCart}
                  onClick={() => addToCart(p)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT — Cart & Billing */}
      <div className="w-96 flex-shrink-0 flex flex-col bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
        <div className="flex-1 overflow-y-auto">
          {/* Customer Section */}
          <div className="border-b border-gray-100">
            <button
              onClick={() => setCustomerExpanded(!customerExpanded)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-sm font-medium text-gray-700"
            >
              <span>Customer Details</span>
              {customerExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {customerExpanded && (
              <div className="px-4 pb-4">
                <CustomerForm customer={customer} onChange={setCustomer} />
              </div>
            )}
          </div>

          {/* Cart Items */}
          <div className="border-b border-gray-100 px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Cart ({cart.length})</h3>
              {cart.length > 0 && (
                <button onClick={() => setShowClearConfirm(true)} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1">
                  <Trash2 className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
            <CartPanel items={cart} onUpdate={updateCartItem} onRemove={removeFromCart} />
          </div>

          {/* Discounts */}
          <div className="border-b border-gray-100 px-4 py-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Discounts</h3>
            <DiscountRow discounts={discounts} onChange={setDiscounts} />
          </div>

          {/* Bill Summary */}
          <div className="px-4 py-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatINR(subtotal)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-orange-500">
                  <span>Discount(s)</span>
                  <span>- {formatINR(totalDiscount)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between items-center">
                <span className="font-bold text-lg text-gray-800">TOTAL</span>
                <span className="font-bold text-2xl text-amber-600">{formatINR(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Payment Mode */}
          <div className="px-4 pb-4">
            <p className="text-xs font-medium text-gray-500 mb-2">Payment Mode</p>
            <div className="flex gap-2 flex-wrap">
              {PAYMENT_MODES.map(mode => (
                <button
                  key={mode}
                  onClick={() => setPaymentMode(mode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    paymentMode === mode
                      ? 'bg-indigo-900 text-white border-indigo-900'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-gray-200 p-4 space-y-2">
          <button
            onClick={handleGenerateInvoice}
            disabled={cart.length === 0}
            className="w-full bg-indigo-900 text-white rounded-lg py-3 text-sm font-bold hover:bg-indigo-800 disabled:opacity-40 transition-colors"
          >
            Generate Invoice
          </button>
        </div>
      </div>

      {/* Invoice Modal */}
      <InvoiceModal
        isOpen={showInvoice}
        onClose={() => { setShowInvoice(false); }}
        invoiceData={{
          customer,
          items: cart,
          discounts,
          paymentMode,
          subtotal,
          totalDiscount,
          grandTotal
        }}
        onInvoiceCreated={handleInvoiceCreated}
      />

      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={clearCart}
        title="Clear Cart"
        message="Remove all items from the cart?"
        confirmLabel="Clear Cart"
      />
    </div>
  );
}
