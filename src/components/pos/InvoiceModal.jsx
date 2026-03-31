import { useState, useEffect, useRef } from 'react';
import { Printer, X } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { createInvoice } from '../../firebase/invoiceService';
import { formatINRShort } from '../../utils/priceFormatter';
import toast from 'react-hot-toast';

const DEFAULT_SETTINGS = {
  storeName: 'TRINETRA',
  address: '19, Vishwas Colony, R.C. Dutt Road, Alkapuri, Vadodara - 390 005.',
  mobile: '9825893059',
  website: 'www.trinetrastudio.com',
  email: 'trinetra9999@gmail.com',
  gstin: '24AAEFT4886B1Z7',
  bankName: 'HDFC BANK',
  accountNumber: '12412000001819',
  ifscCode: 'HDFC0001241',
  branchName: 'PRODUCTIVITY ROAD, ALKAPURI'
};

export default function InvoiceModal({ isOpen, onClose, invoiceData, onInvoiceCreated, readOnly = false }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [invoice, setInvoice] = useState(null);
  const [saving, setSaving] = useState(false);
  const printRef = useRef();

  useEffect(() => {
    getDoc(doc(db, 'settings', 'store_settings'))
      .then(snap => { if (snap.exists()) setSettings({ ...DEFAULT_SETTINGS, ...snap.data() }); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isOpen && readOnly && invoiceData) {
      setInvoice(invoiceData);
    }
  }, [isOpen, readOnly, invoiceData]);

  async function handleSaveAndPrint() {
    if (!invoiceData) return;
    setSaving(true);
    try {
      // Calculate discounts properly
      const subtotal = invoiceData.items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
      const discounts = (invoiceData.discounts || []).map(d => {
        const calc = d.type === 'percent'
          ? Math.round(subtotal * (Number(d.value) / 100))
          : Number(d.value) || 0;
        return { ...d, calculatedAmount: calc };
      });
      const totalDiscount = discounts.reduce((s, d) => s + d.calculatedAmount, 0);
      const grandTotal = subtotal - totalDiscount;

      const payload = {
        soldTo: invoiceData.customer.soldTo,
        customerPhone: invoiceData.customer.phone,
        date: new Date(invoiceData.customer.date),
        items: invoiceData.items.map(it => ({
          productId: it.productId,
          productName: it.productName,
          description: it.description || it.productName,
          costNotes: it.costNotes || '',
          size: it.size || '',
          qty: it.qty,
          unitPrice: it.unitPrice,
          lineTotal: it.qty * it.unitPrice
        })),
        subtotal,
        discounts,
        totalDiscount,
        grandTotal,
        paymentMode: invoiceData.paymentMode || 'Cash',
        status: 'paid'
      };

      const created = await createInvoice(payload);
      setInvoice({ ...created, ...payload });
      toast.success('Invoice saved!');
      onInvoiceCreated?.(created);
      setTimeout(() => window.print(), 400);
    } catch (err) {
      toast.error('Failed to save invoice');
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  function handlePrintExisting() {
    window.print();
  }

  function formatDate(d) {
    if (!d) return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' });
    const dt = d?.toDate ? d.toDate() : new Date(d);
    return dt.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }

  const displayInvoice = invoice || invoiceData;
  const subtotal = displayInvoice?.subtotal ||
    (displayInvoice?.items || []).reduce((s, it) => s + (it.lineTotal || it.qty * it.unitPrice), 0);
  const discounts = displayInvoice?.discounts || [];
  const totalDiscount = displayInvoice?.totalDiscount ||
    discounts.reduce((s, d) => s + (d.calculatedAmount || (d.type === 'percent' ? Math.round(subtotal * (Number(d.value) / 100)) : Number(d.value) || 0)), 0);
  const grandTotal = displayInvoice?.grandTotal || subtotal - totalDiscount;

  if (!isOpen) return null;

  const isSaved = !!invoice || readOnly;

  return (
    <>
      {/* Print styles — injected once */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body > *:not(#invoice-print-root) { display: none !important; }
          #invoice-print-root { display: block !important; position: fixed; inset: 0; background: white; z-index: 9999; overflow: visible; }
          .no-print { display: none !important; }
        }
      ` }} />

      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 no-print">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 no-print flex-shrink-0">
            <h2 className="text-lg font-semibold text-gray-900">Invoice Preview</h2>
            <div className="flex gap-2">
              {!isSaved ? (
                <button
                  onClick={handleSaveAndPrint}
                  disabled={saving}
                  className="bg-indigo-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-800 flex items-center gap-2 disabled:opacity-60"
                >
                  {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Printer className="w-4 h-4" />}
                  {saving ? 'Saving...' : 'Save & Print'}
                </button>
              ) : (
                <button
                  onClick={handlePrintExisting}
                  className="bg-indigo-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-800 flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" /> Print
                </button>
              )}
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="overflow-y-auto flex-1 p-6">
            <InvoiceContent
              settings={settings}
              invoice={displayInvoice}
              subtotal={subtotal}
              discounts={discounts}
              totalDiscount={totalDiscount}
              grandTotal={grandTotal}
              formatDate={formatDate}
            />
          </div>
        </div>
      </div>

      {/* Print-only version */}
      <div id="invoice-print-root" style={{ display: 'none' }}>
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
          <InvoiceContent
            settings={settings}
            invoice={displayInvoice}
            subtotal={subtotal}
            discounts={discounts}
            totalDiscount={totalDiscount}
            grandTotal={grandTotal}
            formatDate={formatDate}
            forPrint
          />
        </div>
      </div>
    </>
  );
}

function InvoiceContent({ settings, invoice, subtotal, discounts, totalDiscount, grandTotal, formatDate, forPrint }) {
  const items = invoice?.items || [];
  const style = forPrint ? PRINT_STYLE : {};

  return (
    <div style={forPrint ? { width: '100%', fontFamily: 'Arial, sans-serif', fontSize: '12px' } : {}}>
      {/* Invoice Box */}
      <div style={forPrint ? { border: '1.5px solid #1e1b4b', borderRadius: '4px', padding: '12px' } : { border: '2px solid #1e1b4b', borderRadius: '8px', padding: '16px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{ fontSize: forPrint ? '10px' : '11px', fontWeight: 'bold', color: '#4b5563', letterSpacing: '2px' }}>RETAIL INVOICE</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
          {/* Store Info */}
          <div style={{ lineHeight: '1.5' }}>
            <div style={{ fontSize: forPrint ? '16px' : '18px', fontWeight: 'bold', color: '#d97706', letterSpacing: '4px' }}>
              {settings.storeName}®
            </div>
            <div style={{ fontSize: '11px', color: '#374151', maxWidth: '280px' }}>
              {settings.address}
            </div>
            <div style={{ fontSize: '11px', color: '#374151' }}>
              Mob.: {settings.mobile}
            </div>
            <div style={{ fontSize: '10px', color: '#6b7280' }}>
              Web: {settings.website}
            </div>
            <div style={{ fontSize: '10px', color: '#6b7280' }}>
              Email: {settings.email}
            </div>
          </div>
          {/* Date + Invoice No */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: '#374151' }}>
              <strong>DATE:</strong> {formatDate(invoice?.date || invoice?.createdAt)}
            </div>
            {invoice?.invoiceNumber && (
              <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>
                Invoice: {invoice.invoiceNumber}
              </div>
            )}
            <div style={{ fontSize: '11px', color: '#374151', marginTop: '4px' }}>
              <strong>Payment:</strong> {invoice?.paymentMode || 'Cash'}
            </div>
          </div>
        </div>

        {/* Sold To */}
        <div style={{ borderTop: '1px solid #c7d2fe', borderBottom: '1px solid #c7d2fe', padding: '6px 0', marginBottom: '8px', fontSize: '12px' }}>
          <strong>Sold To:</strong> {invoice?.soldTo || invoice?.customer?.soldTo || ''}
          {(invoice?.customerPhone || invoice?.customer?.phone) && (
            <span style={{ marginLeft: '16px', color: '#6b7280' }}>Ph: {invoice?.customerPhone || invoice?.customer?.phone}</span>
          )}
        </div>

        {/* Items Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '1.5px solid #1e1b4b' }}>
              <th style={{ textAlign: 'left', padding: '4px 6px', width: '28px' }}>Sr.</th>
              <th style={{ textAlign: 'left', padding: '4px 6px' }}>Description</th>
              <th style={{ textAlign: 'right', padding: '4px 6px', width: '90px' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '6px', verticalAlign: 'top', color: '#6b7280' }}>{i + 1}</td>
                <td style={{ padding: '6px' }}>
                  <div style={{ fontWeight: 'bold' }}>
                    {item.description || item.productName}
                    {item.size ? ` (${item.size})` : ''}
                    {item.qty > 1 ? ` × ${item.qty}` : ''}
                  </div>
                  {item.costNotes && (
                    <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>
                      {item.costNotes}
                    </div>
                  )}
                </td>
                <td style={{ padding: '6px', textAlign: 'right', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                  {formatINRShort(item.lineTotal || item.qty * item.unitPrice)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '1px solid #c7d2fe' }}>
              <td colSpan={2} style={{ padding: '4px 6px', textAlign: 'right', color: '#4b5563' }}>Subtotal</td>
              <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 'bold' }}>{formatINRShort(subtotal)}</td>
            </tr>
            {discounts.map((d, i) => {
              const calc = d.calculatedAmount || (d.type === 'percent' ? Math.round(subtotal * (Number(d.value) / 100)) : Number(d.value));
              return (
                <tr key={i}>
                  <td colSpan={2} style={{ padding: '2px 6px', textAlign: 'right', color: '#f97316', fontSize: '11px' }}>
                    {d.label || 'Discount'} {d.type === 'percent' ? `(${d.value}%)` : ''} →
                  </td>
                  <td style={{ padding: '2px 6px', textAlign: 'right', color: '#f97316' }}>-{formatINRShort(calc)}</td>
                </tr>
              );
            })}
            <tr style={{ borderTop: '2px solid #1e1b4b', background: '#f5f3ff' }}>
              <td colSpan={2} style={{ padding: '6px', textAlign: 'right', fontWeight: 'bold', fontSize: '14px' }}>TOTAL</td>
              <td style={{ padding: '6px', textAlign: 'right', fontWeight: 'bold', fontSize: '16px', color: '#1e1b4b' }}>
                {formatINRShort(grandTotal)}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #c7d2fe', marginTop: '10px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '10px', color: '#4b5563', lineHeight: '1.8' }}>
            <div>• First Wash Dry Clean Only</div>
            <div>• Goods Once Sold Will Not be Taken Back</div>
            <div>• No Guarantee for Color &amp; Zari</div>
            <div>• Prices inclusive of all Taxes</div>
            <div>GSTIN: <strong>{settings.gstin}</strong></div>
          </div>
          <div style={{ fontSize: '10px', color: '#4b5563', lineHeight: '1.8', textAlign: 'right' }}>
            <div><strong>Bank:</strong> {settings.bankName}</div>
            <div><strong>A/c:</strong> {settings.accountNumber}</div>
            <div><strong>IFSC:</strong> {settings.ifscCode}</div>
            <div style={{ color: '#6b7280' }}>{settings.branchName}</div>
          </div>
        </div>

        {/* Sunday Closed */}
        <div style={{ textAlign: 'center', marginTop: '8px', color: '#d97706', fontWeight: 'bold', fontSize: '11px', letterSpacing: '2px' }}>
          ✦ SUNDAY CLOSED ✦
        </div>
      </div>
    </div>
  );
}

const PRINT_STYLE = {};

