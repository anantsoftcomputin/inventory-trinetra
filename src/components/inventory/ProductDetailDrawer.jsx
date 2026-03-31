import { useState, useEffect } from 'react';
import { X, Edit, Printer, Trash2, ShoppingCart } from 'lucide-react';
import { encodePrice } from '../../utils/tagCodec';
import { formatINR, formatINRShort } from '../../utils/priceFormatter';
import { deleteProduct } from '../../firebase/inventoryService';
import { getInvoices } from '../../firebase/invoiceService';
import StockBadge from './StockBadge';
import Badge from '../common/Badge';
import ConfirmDialog from '../common/ConfirmDialog';
import toast from 'react-hot-toast';

const PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNFNUU3RUIiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzlDQTNBRiIgZm9udC1zaXplPSIxNCI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';

const CATEGORY_LABELS = {
  kurta_set: 'Kurta Set', saree: 'Saree', chaniya_choli: 'Chaniya Choli',
  dress_material: 'Dress Material', lehenga: 'Lehenga', dupatta: 'Dupatta',
  blouse: 'Blouse', other: 'Other'
};

export default function ProductDetailDrawer({ product, isOpen, onClose, onEdit, onAddToCart, onDeleted }) {
  const [activeImg, setActiveImg] = useState(0);
  const [saleHistory, setSaleHistory] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isOpen && product?.id) {
      setActiveImg(0);
      // Load sale history from invoices containing this product
      getInvoices({}).then(invoices => {
        const history = invoices.filter(inv =>
          inv.items?.some(item => item.productId === product.id)
        );
        setSaleHistory(history.slice(0, 10));
      }).catch(() => {});
    }
  }, [isOpen, product]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteProduct(product.id);
      toast.success('Product removed');
      setShowDeleteConfirm(false);
      onDeleted?.();
      onClose();
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleting(false);
    }
  }

  function handlePrintTag() {
    const tag = encodePrice(product.costPrice || 0);
    const win = window.open('', '_blank', 'width=400,height=300');
    win.document.write(`
      <html><head><title>Tag - ${product.name}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .tag { border: 2px solid #1e1b4b; border-radius: 8px; padding: 16px; width: 200px; text-align: center; }
        .store { color: #d97706; font-weight: bold; font-size: 14px; letter-spacing: 4px; }
        .name { font-size: 12px; font-weight: bold; margin: 6px 0; }
        .mrp { font-size: 20px; font-weight: bold; color: #1e1b4b; }
        .code { font-size: 10px; color: #6b7280; font-family: monospace; margin-top: 6px; }
      </style>
      </head><body onload="window.print();window.close()">
        <div class="tag">
          <div class="store">TRINETRA</div>
          <div class="name">${product.name || ''}</div>
          <div class="mrp">₹${Number(product.mrp).toLocaleString('en-IN')}/-</div>
          <div class="code">${tag}</div>
        </div>
      </body></html>
    `);
  }

  function formatDate(ts) {
    if (!ts) return '-';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-IN');
  }

  if (!product) return null;

  const images = product.imageUrls?.length ? product.imageUrls : [PLACEHOLDER];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-30" onClick={onClose} />
      )}

      {/* Drawer */}
      <div className={`fixed right-0 top-0 h-full w-full sm:w-[460px] bg-white shadow-2xl z-40 flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900 text-base line-clamp-1">{product.name}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Image Gallery */}
          <div className="relative">
            <img src={images[activeImg]} alt="" className="w-full h-56 object-cover" onError={e => { e.target.src = PLACEHOLDER; }} />
            {images.length > 1 && (
              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 px-4">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)} className="flex-shrink-0">
                    <img src={img} alt="" className={`w-10 h-10 object-cover rounded border-2 ${activeImg === i ? 'border-indigo-500' : 'border-gray-300'}`} onError={e => { e.target.src = PLACEHOLDER; }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-5 space-y-5">
            {/* Key Info */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="indigo">{CATEGORY_LABELS[product.category] || product.category}</Badge>
              <Badge variant="default">{product.subCategory}</Badge>
              <StockBadge quantity={product.quantity} />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 text-xs">SKU</p>
                <p className="font-mono font-medium text-gray-800">{product.sku}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Tag Code</p>
                <p className="font-mono font-bold text-amber-600 text-lg">{product.tagCode}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">MRP</p>
                <p className="font-bold text-indigo-900 text-xl">{formatINR(product.mrp)}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Cost Price</p>
                <p className="font-medium text-gray-800">{formatINR(product.costPrice)}</p>
              </div>
              {product.costBreakdown?.materialCost > 0 && (
                <div className="col-span-2 bg-amber-50 rounded-lg p-3 text-xs">
                  <p className="font-medium text-amber-800 mb-1">Cost Breakdown</p>
                  <p>Material: {formatINR(product.costBreakdown.materialCost)}</p>
                  {product.costBreakdown.stitchingCost > 0 && <p>Stitching: {formatINR(product.costBreakdown.stitchingCost)}</p>}
                  {product.costBreakdown.otherCost > 0 && <p>Other: {formatINR(product.costBreakdown.otherCost)}</p>}
                </div>
              )}
            </div>

            {/* Sizes & Colors */}
            {product.sizes?.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-1.5">Sizes</p>
                <div className="flex gap-2 flex-wrap">
                  {product.sizes.map(s => (
                    <span key={s} className="border border-gray-300 text-gray-700 text-xs px-2.5 py-1 rounded-full">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {product.colors?.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-1.5">Colors</p>
                <div className="flex gap-1.5 flex-wrap">
                  {product.colors.map((c, i) => (
                    <span key={i} className="bg-gray-100 text-xs text-gray-700 px-2 py-0.5 rounded-full">{c}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Extra details */}
            {product.supplier && (
              <div className="text-sm">
                <span className="text-gray-500 text-xs">Supplier: </span>
                <span className="text-gray-800">{product.supplier}</span>
              </div>
            )}
            {product.notes && (
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                <p className="text-xs text-gray-500 mb-1">Notes</p>
                {product.notes}
              </div>
            )}

            {/* Sale History */}
            {saleHistory.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Sale History</p>
                <div className="space-y-1">
                  {saleHistory.map(inv => (
                    <div key={inv.id} className="flex justify-between text-xs text-gray-600 py-1 border-b border-gray-100">
                      <span className="font-mono text-indigo-600">{inv.invoiceNumber}</span>
                      <span>{inv.soldTo}</span>
                      <span>{formatDate(inv.createdAt)}</span>
                      <span className="font-medium">{formatINR(inv.grandTotal)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 px-5 py-4 flex gap-2">
          <button
            onClick={() => onAddToCart?.(product)}
            className="flex-1 bg-indigo-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-indigo-800 flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" /> Add to Sale
          </button>
          <button
            onClick={() => onEdit?.(product)}
            className="p-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={handlePrintTag}
            className="p-2.5 border border-amber-300 rounded-lg hover:bg-amber-50 text-amber-600"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2.5 border border-red-300 rounded-lg hover:bg-red-50 text-red-500"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Remove Product"
        message={`Are you sure you want to remove "${product.name}"? This action can't be undone.`}
        confirmLabel="Remove"
        loading={deleting}
      />
    </>
  );
}
