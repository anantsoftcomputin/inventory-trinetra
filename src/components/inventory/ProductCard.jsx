import { ShoppingCart, Edit, Tag } from 'lucide-react';
import { formatINR } from '../../utils/priceFormatter';
import StockBadge from './StockBadge';

const PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNFNUU3RUIiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzlDQTNBRiIgZm9udC1zaXplPSIxNCI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';

const CATEGORY_LABELS = {
  kurta_set: 'Kurta Set', saree: 'Saree', chaniya_choli: 'Chaniya Choli',
  dress_material: 'Dress Material', lehenga: 'Lehenga', dupatta: 'Dupatta',
  blouse: 'Blouse', other: 'Other'
};

export default function ProductCard({ product, onEdit, onAddToCart, onClick, showAddToCart = false }) {
  const img = product.imageUrls?.[0] || PLACEHOLDER;

  return (
    <div
      className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative h-44 bg-gray-100">
        <img
          src={img}
          alt={product.name}
          className="w-full h-full object-cover"
          onError={e => { e.target.src = PLACEHOLDER; }}
        />
        <div className="absolute top-2 left-2">
          <span className="bg-indigo-900 text-white text-xs px-2 py-0.5 rounded-full">
            {CATEGORY_LABELS[product.category] || product.category}
          </span>
        </div>
        {product.tagCode && (
          <div className="absolute top-2 right-2">
            <span className="bg-amber-500 text-white text-xs font-mono px-2 py-0.5 rounded-full font-bold">
              {product.tagCode}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 mb-1">{product.name}</h3>
        <p className="text-xs text-gray-400 mb-2 font-mono">{product.sku}</p>

        {/* Colors */}
        {product.colors?.length > 0 && (
          <div className="flex gap-1 mb-2 flex-wrap">
            {product.colors.slice(0, 5).map((c, i) => (
              <div key={i} className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: c.toLowerCase() }} title={c} />
            ))}
            {product.colors.length > 5 && (
              <span className="text-xs text-gray-400">+{product.colors.length - 5}</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-2">
          <div>
            <p className="text-lg font-bold text-indigo-900">{formatINR(product.mrp)}</p>
            <StockBadge quantity={product.quantity} />
          </div>
          <div className="flex gap-1">
            {onEdit && (
              <button
                onClick={e => { e.stopPropagation(); onEdit(product); }}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            {showAddToCart && (
              <button
                onClick={e => { e.stopPropagation(); onAddToCart(product); }}
                disabled={product.quantity === 0}
                className="p-1.5 rounded-lg bg-indigo-900 text-white hover:bg-indigo-800 disabled:opacity-40"
                title="Add to cart"
              >
                <ShoppingCart className="w-4 h-4" />
              </button>
            )}
            {!showAddToCart && (
              <button
                onClick={e => { e.stopPropagation(); onAddToCart && onAddToCart(product); }}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                title="Tag"
              >
                <Tag className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
