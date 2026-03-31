import { encodePrice, decodeTag, isValidTag, DIGIT_TO_CODE } from '../../utils/tagCodec';
import { formatINR } from '../../utils/priceFormatter';

export function TagEncoder({ value, onChange, mode }) {
  /* mode: 'encode' | 'decode' */
  return null; // logic embedded in TagManager
}

export function TagLabel({ item }) {
  const { name = '', mrp = 0, costPrice = 0, sku = '', color = '', size = '' } = item;
  const tagCode = costPrice ? encodePrice(Number(costPrice)) : '----';

  return (
    <div id="tag-label-print" style={{
      width: 200,
      border: '2px solid #92400e',
      borderRadius: 8,
      fontFamily: 'Georgia, serif',
      overflow: 'hidden',
      background: '#fffbeb',
    }}>
      {/* Header */}
      <div style={{ background: '#78350f', color: '#fef3c7', textAlign: 'center', padding: '6px 4px 4px' }}>
        <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 2 }}>TRINETRA</div>
        <div style={{ fontSize: 9, letterSpacing: 1, color: '#fde68a' }}>FASHION STUDIO</div>
      </div>
      {/* Body */}
      <div style={{ padding: '8px 10px', textAlign: 'center' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#1e1b4b', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
        {(color || size) && (
          <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 6 }}>
            {color}{color && size ? ' · ' : ''}{size}
          </div>
        )}
        <div style={{ fontSize: 22, fontWeight: 800, color: '#1e1b4b', lineHeight: 1 }}>{formatINR(mrp)}</div>
        <div style={{ fontSize: 9, color: '#9ca3af', marginTop: 2 }}>MRP incl. of all taxes</div>
        <div style={{ marginTop: 8, background: '#fef3c7', border: '1px dashed #d97706', borderRadius: 4, padding: '4px 8px', display: 'inline-block' }}>
          <div style={{ fontSize: 9, color: '#92400e', letterSpacing: 1 }}>CODE</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#b45309', letterSpacing: 4, fontFamily: 'monospace' }}>{tagCode}</div>
        </div>
        {sku && <div style={{ marginTop: 6, fontSize: 9, color: '#9ca3af', fontFamily: 'monospace' }}>{sku}</div>}
      </div>
    </div>
  );
}
