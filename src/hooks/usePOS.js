import { useState, useCallback } from 'react';

export function usePOS() {
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({ soldTo: '', phone: '', date: new Date().toISOString().slice(0, 10) });
  const [discounts, setDiscounts] = useState([]);
  const [paymentMode, setPaymentMode] = useState('Cash');

  function addToCart(product, extraFields = {}) {
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        return prev.map(i => i.productId === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, {
        productId: product.id,
        description: product.name,
        size: product.sizes?.[0] || '',
        qty: 1,
        unitPrice: product.mrp || 0,
        costNotes: '',
        ...extraFields,
      }];
    });
  }

  function updateCartItem(idx, changes) {
    setCart(prev => prev.map((item, i) => i === idx ? { ...item, ...changes } : item));
  }

  function removeCartItem(idx) {
    setCart(prev => prev.filter((_, i) => i !== idx));
  }

  function addDiscount() {
    setDiscounts(prev => [...prev, { label: 'Discount', type: 'flat', value: 0 }]);
  }

  function updateDiscount(idx, changes) {
    setDiscounts(prev => prev.map((d, i) => i === idx ? { ...d, ...changes } : d));
  }

  function removeDiscount(idx) {
    setDiscounts(prev => prev.filter((_, i) => i !== idx));
  }

  const subtotal = cart.reduce((s, i) => s + (i.qty * i.unitPrice), 0);

  const totalDiscount = discounts.reduce((s, d) => {
    const v = Number(d.value) || 0;
    return s + (d.type === 'percent' ? (subtotal * v / 100) : v);
  }, 0);

  const grandTotal = Math.max(0, subtotal - totalDiscount);

  function clearCart() {
    setCart([]);
    setDiscounts([]);
    setCustomer({ soldTo: '', phone: '', date: new Date().toISOString().slice(0, 10) });
    setPaymentMode('Cash');
  }

  return {
    cart, customer, setCustomer, discounts, paymentMode, setPaymentMode,
    addToCart, updateCartItem, removeCartItem,
    addDiscount, updateDiscount, removeDiscount,
    subtotal, totalDiscount, grandTotal,
    clearCart,
  };
}
