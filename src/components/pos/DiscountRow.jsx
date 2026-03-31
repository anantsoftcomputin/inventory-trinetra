import { Plus, Trash2 } from 'lucide-react';
import { formatINR } from '../../utils/priceFormatter';

export default function DiscountRow({ discounts, onChange }) {
  function add() {
    onChange([...discounts, { label: '', type: 'flat', value: '', calculatedAmount: 0 }]);
  }

  function remove(i) {
    onChange(discounts.filter((_, j) => j !== i));
  }

  function update(i, field, val) {
    const updated = discounts.map((d, j) => j === i ? { ...d, [field]: val } : d);
    onChange(updated);
  }

  return (
    <div className="space-y-2">
      {discounts.map((d, i) => (
        <div key={i} className="flex items-center gap-2 flex-wrap">
          <input
            value={d.label}
            onChange={e => update(i, 'label', e.target.value)}
            placeholder="e.g. 2-saree discount"
            className="flex-1 min-w-20 text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
          <select
            value={d.type}
            onChange={e => update(i, 'type', e.target.value)}
            className="text-xs border border-gray-200 rounded px-2 py-1.5"
          >
            <option value="flat">₹ Flat</option>
            <option value="percent">% Off</option>
          </select>
          <input
            type="number"
            min="0"
            value={d.value}
            onChange={e => update(i, 'value', e.target.value)}
            placeholder={d.type === 'flat' ? '500' : '10'}
            className="w-16 text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
          <button onClick={() => remove(i)} className="text-red-400 hover:text-red-600">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
      >
        <Plus className="w-3.5 h-3.5" /> Add Discount
      </button>
    </div>
  );
}
