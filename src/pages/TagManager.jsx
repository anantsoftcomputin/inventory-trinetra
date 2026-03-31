import { useState } from 'react';
import { Printer } from 'lucide-react';
import TagEncoder from '../components/tags/TagEncoder';
import { TagLabel } from '../components/tags/TagLabel';
import { encodePrice, DIGIT_TO_CODE, CODE_TO_DIGIT } from '../utils/tagCodec';
import { formatINR } from '../utils/priceFormatter';

const TABS = ['Encode / Decode', 'Generate & Print Tag', 'Code Reference'];
const CIPHER_DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

export default function TagManager() {
  const [tab, setTab] = useState(0);
  const [form, setForm] = useState({ name: '', mrp: '', costPrice: '', sku: '', color: '', size: '' });

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  function printTag() {
    const el = document.getElementById('tag-label-print');
    if (!el) return;
    const win = window.open('', '_blank', 'width=320,height=400');
    win.document.write(`
      <html><head><title>Print Tag</title>
      <style>
        body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f3f4f6; }
        @media print { body { background: white; } @page { margin: 0; size: 58mm 80mm; } }
      </style>
      </head><body>
        ${el.outerHTML}
        <script>window.onload = () => { window.print(); window.close(); }<\/script>
      </body></html>
    `);
    win.document.close();
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${tab === i ? 'border-amber-500 text-amber-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab 1: Encode / Decode */}
      {tab === 0 && <TagEncoder />}

      {/* Tab 2: Generate & Print Tag */}
      {tab === 1 && (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Form */}
          <div className="flex-1 bg-white rounded-xl shadow-md p-6 space-y-4">
            <h3 className="font-semibold text-gray-800">Tag Details</h3>
            {[
              { name: 'name', label: 'Item Name', placeholder: 'e.g. Bandhani Kurti' },
              { name: 'sku', label: 'SKU', placeholder: 'e.g. TRN-KRT-0023' },
              { name: 'mrp', label: 'MRP (₹)', placeholder: '0', type: 'number' },
              { name: 'costPrice', label: 'Cost Price (₹)', placeholder: '0', type: 'number' },
              { name: 'color', label: 'Color', placeholder: 'e.g. Navy Blue' },
              { name: 'size', label: 'Size', placeholder: 'e.g. L / 38 / Free' },
            ].map(f => (
              <div key={f.name}>
                <label className="block text-sm text-gray-500 mb-1">{f.label}</label>
                <input
                  name={f.name}
                  type={f.type || 'text'}
                  value={form[f.name]}
                  onChange={handleChange}
                  placeholder={f.placeholder}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            ))}
            <button
              onClick={printTag}
              className="w-full mt-2 flex items-center justify-center gap-2 bg-amber-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-amber-700"
            >
              <Printer className="w-4 h-4" /> Print Tag
            </button>
          </div>

          {/* Preview */}
          <div className="flex flex-col items-center gap-4">
            <h3 className="font-semibold text-gray-700 self-start">Preview</h3>
            <div className="p-6 bg-gray-100 rounded-xl flex items-center justify-center">
              <TagLabel item={{
                name: form.name || 'Item Name',
                mrp: Number(form.mrp) || 0,
                costPrice: Number(form.costPrice) || 0,
                sku: form.sku,
                color: form.color,
                size: form.size,
              }} />
            </div>
            {form.costPrice && (
              <div className="text-sm text-gray-500">
                Encoded: <span className="font-mono font-bold text-amber-700 tracking-widest">{encodePrice(Number(form.costPrice))}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Code Reference Card */}
      {tab === 2 && (
        <div className="space-y-6">
          <div id="code-reference-card" className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 text-lg">Secret Tag Code Reference</h3>
              <button
                onClick={() => {
                  const el = document.getElementById('code-reference-card');
                  const win = window.open('', '_blank', 'width=540,height=600');
                  win.document.write(`<html><head><title>Tag Code Reference</title>
                    <style>body{font-family:sans-serif;padding:24px;} table{width:100%;border-collapse:collapse;} th,td{border:1px solid #e5e7eb;padding:10px 14px;text-align:center;} th{background:#1e1b4b;color:white;} tr:nth-child(even){background:#f8fafc;}</style>
                    </head><body>${el.innerHTML}
                    <script>window.onload=()=>{window.print();window.close()}<\/script>
                    </body></html>`);
                  win.document.close();
                }}
                className="flex items-center gap-2 bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700"
              >
                <Printer className="w-4 h-4" /> Print Reference
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Each digit of the cost price is replaced by the corresponding letter. Only staff should know this cipher.</p>
            <table className="w-full text-center border-collapse text-sm">
              <thead>
                <tr className="bg-indigo-950 text-white">
                  <th className="px-4 py-3 rounded-tl-lg">Digit</th>
                  <th className="px-4 py-3 rounded-tr-lg">Code Letter</th>
                </tr>
              </thead>
              <tbody>
                {CIPHER_DIGITS.map(d => (
                  <tr key={d} className="border-t border-gray-200 even:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-lg font-bold text-gray-800">{d}</td>
                    <td className="px-4 py-3 font-mono text-2xl font-bold text-amber-600 tracking-widest">{DIGIT_TO_CODE[d]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
              <strong>Example:</strong> Cost price ₹8,650 → 8650 → <strong>SGTE</strong>
              <div className="mt-1 text-xs text-amber-600">8=S, 6=G, 5=T, 0=E</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
