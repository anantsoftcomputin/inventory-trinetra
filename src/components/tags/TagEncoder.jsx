// TagEncoder handles live encode/decode logic as a standalone component
import { useState } from 'react';
import { encodePrice, decodeTag, isValidTag } from '../../utils/tagCodec';
import { getProductByTagCode } from '../../firebase/inventoryService';
import { formatINR } from '../../utils/priceFormatter';

export default function TagEncoder() {
  const [encodeInput, setEncodeInput] = useState('');
  const [decodeInput, setDecodeInput] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  const encoded = encodeInput ? encodePrice(Number(encodeInput.replace(/[^0-9]/g, ''))) : '';
  const decoded = decodeInput ? (isValidTag(decodeInput.toUpperCase()) ? decodeTag(decodeInput.toUpperCase()) : null) : null;

  async function handleLookup() {
    const code = decodeInput.toUpperCase().trim();
    if (!code) return;
    setLookupLoading(true);
    setLookupResult(null);
    try {
      const product = await getProductByTagCode(code);
      setLookupResult(product || 'Not found');
    } catch {
      setLookupResult('Error');
    } finally {
      setLookupLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Encode */}
      <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
        <h3 className="font-semibold text-gray-800">Encode Cost Price → Tag Code</h3>
        <div>
          <label className="block text-sm text-gray-500 mb-1">Cost Price (₹)</label>
          <input
            type="number"
            value={encodeInput}
            onChange={e => setEncodeInput(e.target.value)}
            placeholder="e.g. 8650"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        {encoded && (
          <div className="flex items-center gap-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div>
              <div className="text-xs text-amber-700 mb-1">Tag Code</div>
              <div className="text-3xl font-mono font-bold tracking-widest text-amber-700">{encoded}</div>
            </div>
            <div className="text-gray-400 text-lg">←</div>
            <div className="text-sm font-medium text-gray-700">{formatINR(Number(encodeInput))}</div>
          </div>
        )}
      </div>

      {/* Decode */}
      <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
        <h3 className="font-semibold text-gray-800">Decode Tag Code → Cost Price</h3>
        <div>
          <label className="block text-sm text-gray-500 mb-1">Tag Code</label>
          <input
            type="text"
            value={decodeInput}
            onChange={e => setDecodeInput(e.target.value.toUpperCase())}
            placeholder="e.g. SGTE"
            maxLength={10}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm uppercase font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        {decodeInput && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            {decoded !== null ? (
              <div className="flex items-center gap-4">
                <div className="text-2xl font-bold text-indigo-900">{formatINR(decoded)}</div>
                <div className="text-gray-400">← cost price</div>
              </div>
            ) : (
              <div className="text-sm text-red-500">Invalid tag code</div>
            )}
          </div>
        )}
        <button
          onClick={handleLookup}
          disabled={!isValidTag(decodeInput) || lookupLoading}
          className="w-full mt-2 bg-indigo-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-40"
        >
          {lookupLoading ? 'Looking up...' : 'Lookup Product by Tag Code'}
        </button>
        {lookupResult && (
          <div className="mt-2 p-3 rounded-lg border text-sm">
            {lookupResult === 'Not found' || lookupResult === 'Error'
              ? <span className="text-gray-500">{lookupResult}</span>
              : (
                <div>
                  <div className="font-medium text-gray-800">{lookupResult.name}</div>
                  <div className="text-gray-500">{lookupResult.sku} · MRP {formatINR(lookupResult.mrp)}</div>
                </div>
              )
            }
          </div>
        )}
      </div>
    </div>
  );
}
