import { Trash2, Plus, Minus } from 'lucide-react';
import { formatINR } from '../../utils/priceFormatter';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size', 'Custom'];

export default function CartPanel({ items, onUpdate, onRemove }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        No items added yet.<br />
        <span className="text-xs">Search and add products from the left.</span>
      </div>
    );
  }

  function updateItem(id, field, value) {
    onUpdate(id, field, value);
  }

  return (
    <div className="space-y-3">
      {items.map(item => (
        <div key={item.cartId} className="bg-gray-50 rounded-xl p-3 space-y-2">
          {/* Name row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm leading-tight truncate">{item.productName}</p>
              <input
                value={item.description}
                onChange={e => updateItem(item.cartId, 'description', e.target.value)}
                placeholder="Description (e.g. Purple top pant / Dupatta)"
                className="mt-1 w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
              />
            </div>
            <button
              onClick={() => onRemove(item.cartId)}
              className="text-red-400 hover:text-red-600 flex-shrink-0 p-1"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Controls row */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={item.size}
              onChange={e => updateItem(item.cartId, 'size', e.target.value)}
              className="text-xs border border-gray-200 rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
            >
              <option value="">Size</option>
              {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              {item.availableSizes?.filter(s => !SIZES.includes(s)).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Qty */}
            <div className="flex items-center border border-gray-200 rounded bg-white">
              <button
                onClick={() => updateItem(item.cartId, 'qty', Math.max(1, item.qty - 1))}
                className="px-2 py-1 text-gray-500 hover:text-gray-700"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="px-2 text-sm font-medium">{item.qty}</span>
              <button
                onClick={() => updateItem(item.cartId, 'qty', item.qty + 1)}
                className="px-2 py-1 text-gray-500 hover:text-gray-700"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {/* Unit price */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">₹</span>
              <input
                type="number"
                min="0"
                value={item.unitPrice}
                onChange={e => updateItem(item.cartId, 'unitPrice', Number(e.target.value))}
                className="w-20 text-xs border border-gray-200 rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
          </div>

          {/* Notes */}
          <input
            value={item.costNotes || ''}
            onChange={e => updateItem(item.cartId, 'costNotes', e.target.value)}
            placeholder="Cost notes (internal, e.g. 6800/- mum, 2000/- stitching)"
            className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white text-gray-500"
          />

          {/* Line total */}
          <div className="text-right">
            <span className="text-sm font-bold text-indigo-900">
              {formatINR(item.qty * item.unitPrice)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
