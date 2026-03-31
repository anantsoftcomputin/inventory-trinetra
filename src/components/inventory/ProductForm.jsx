import { useState, useEffect, useRef } from 'react';
import { X, Plus, Image, Camera, RefreshCw } from 'lucide-react';
import { addProduct, updateProduct, getCategories } from '../../firebase/inventoryService';
import { encodePrice } from '../../utils/tagCodec';
import { generateSKU } from '../../utils/skuGenerator';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase/config';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import toast from 'react-hot-toast';

const FABRIC_TYPES = [
  'Georgette', 'Silk', 'Cotton', 'Net', 'Chanderi', 'Bandhani',
  'Crepe', 'Chiffon', 'Velvet', 'Linen', 'Khadi', 'Other'
];

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];

const EMPTY = {
  name: '', category: 'kurta_set', subCategory: 'Georgette',
  sku: '', costPrice: '', mrp: '', quantity: '',
  sizes: [], colors: [], supplier: '', purchaseDate: '',
  notes: '', tagCode: '', imageUrls: [],
  costBreakdown: { materialCost: '', stitchingCost: '', otherCost: '' }
};

export default function ProductForm({ isOpen, onClose, onSaved, product }) {
  const [form, setForm] = useState(EMPTY);
  const [categories, setCategories] = useState([]);
  const [colorInput, setColorInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [generatingSKU, setGeneratingSKU] = useState(false);
  const fileRef = useRef();
  const cameraRef = useRef();

  const isEdit = !!product;

  useEffect(() => {
    getCategories().then(list => setCategories(list)).catch(() => {});
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (product) {
        setForm({
          ...EMPTY, ...product,
          costPrice: product.costPrice || '',
          mrp: product.mrp || '',
          quantity: product.quantity || '',
          purchaseDate: product.purchaseDate ? new Date(product.purchaseDate.toDate?.() || product.purchaseDate).toISOString().split('T')[0] : '',
          costBreakdown: {
            materialCost: product.costBreakdown?.materialCost || '',
            stitchingCost: product.costBreakdown?.stitchingCost || '',
            otherCost: product.costBreakdown?.otherCost || ''
          }
        });
        setShowBreakdown(!!(product.costBreakdown?.materialCost));
      } else {
        setForm(EMPTY);
        setShowBreakdown(false);
        setColorInput('');
      }
    }
  }, [isOpen, product]);

  function set(field, val) {
    setForm(f => ({ ...f, [field]: val }));
  }

  function handleCostChange(e) {
    const val = e.target.value;
    set('costPrice', val);
    if (val && !isNaN(Number(val))) {
      set('tagCode', encodePrice(Number(val)));
    } else {
      set('tagCode', '');
    }
  }

  function handleBreakdownChange(field, val) {
    const bd = { ...form.costBreakdown, [field]: val };
    const total = (Number(bd.materialCost) || 0) + (Number(bd.stitchingCost) || 0) + (Number(bd.otherCost) || 0);
    setForm(f => ({
      ...f,
      costBreakdown: { ...f.costBreakdown, [field]: val },
      costPrice: total || '',
      tagCode: total ? encodePrice(total) : ''
    }));
  }

  const margin = form.mrp && form.costPrice
    ? (((Number(form.mrp) - Number(form.costPrice)) / Number(form.mrp)) * 100).toFixed(1)
    : null;

  function toggleSize(s) {
    set('sizes', form.sizes.includes(s) ? form.sizes.filter(x => x !== s) : [...form.sizes, s]);
  }

  function addColor() {
    const c = colorInput.trim();
    if (c && !form.colors.includes(c)) {
      set('colors', [...form.colors, c]);
    }
    setColorInput('');
  }

  function removeColor(c) {
    set('colors', form.colors.filter(x => x !== c));
  }

  async function handleGenSKU() {
    setGeneratingSKU(true);
    try {
      const sku = await generateSKU(form.category);
      set('sku', sku);
    } catch {
      toast.error('Could not generate SKU');
    } finally {
      setGeneratingSKU(false);
    }
  }

  async function handleImageUpload(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(files.map(async file => {
        const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
        const snap = await uploadBytes(storageRef, file);
        return getDownloadURL(snap.ref);
      }));
      set('imageUrls', [...form.imageUrls, ...urls]);
    } catch {
      toast.error('Image upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Product name is required'); return; }
    if (!form.mrp || isNaN(Number(form.mrp))) { toast.error('MRP is required'); return; }
    if (!form.quantity || isNaN(Number(form.quantity))) { toast.error('Quantity is required'); return; }

    setSaving(true);
    try {
      const data = {
        name: form.name.trim(),
        category: form.category,
        subCategory: form.subCategory,
        costPrice: Number(form.costPrice) || 0,
        mrp: Number(form.mrp),
        tagCode: form.tagCode || encodePrice(Number(form.costPrice) || 0),
        quantity: Number(form.quantity),
        sizes: form.sizes,
        colors: form.colors,
        supplier: form.supplier,
        purchaseDate: form.purchaseDate ? new Date(form.purchaseDate) : null,
        notes: form.notes,
        imageUrls: form.imageUrls,
        costBreakdown: {
          materialCost: Number(form.costBreakdown.materialCost) || 0,
          stitchingCost: Number(form.costBreakdown.stitchingCost) || 0,
          otherCost: Number(form.costBreakdown.otherCost) || 0
        }
      };
      if (isEdit) {
        await updateProduct(product.id, data);
        toast.success('Product updated!');
      } else {
        if (form.sku) data.sku = form.sku;
        await addProduct(data);
        toast.success('Product added!');
      }
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error('Failed to save product');
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Product' : 'Add New Product'} size="lg">
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Section 1 — Basic Info */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Basic Info</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Product Name *"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Purple Georgette Kurti Set"
              className="col-span-2"
              required
            />
            <Select label="Category *" value={form.category} onChange={e => set('category', e.target.value)}>
              {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </Select>
            <Select label="Sub-Category / Fabric" value={form.subCategory} onChange={e => set('subCategory', e.target.value)}>
              {FABRIC_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
            </Select>
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700 block mb-1">SKU</label>
              <div className="flex gap-2">
                <input
                  value={form.sku}
                  onChange={e => set('sku', e.target.value)}
                  placeholder="Auto-generated"
                  readOnly={!!form.sku && !isEdit}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50 font-mono focus:outline-none"
                />
                <Button type="button" variant="secondary" size="sm" onClick={handleGenSKU} loading={generatingSKU}>
                  <RefreshCw className="w-3.5 h-3.5" /> Generate
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2 — Pricing */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Pricing</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label="Cost Price (₹)"
                type="number"
                min="0"
                value={form.costPrice}
                onChange={handleCostChange}
                placeholder="8650"
              />
              {form.tagCode && (
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-gray-500">Tag Code:</span>
                  <span className="bg-amber-100 text-amber-700 font-mono font-bold text-sm px-2 py-0.5 rounded">
                    {form.tagCode}
                  </span>
                </div>
              )}
            </div>
            <Input
              label="MRP / Selling Price (₹) *"
              type="number"
              min="0"
              value={form.mrp}
              onChange={e => set('mrp', e.target.value)}
              placeholder="12000"
            />
          </div>

          {margin !== null && (
            <div className="mt-2 text-sm text-green-600 font-medium">
              Margin: {margin}%
            </div>
          )}

          <div className="mt-3">
            <button
              type="button"
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              {showBreakdown ? '▾ Hide' : '▸ Show'} Cost Breakdown
            </button>
            {showBreakdown && (
              <div className="grid grid-cols-3 gap-3 mt-3">
                <Input label="Material Cost (₹)" type="number" min="0" value={form.costBreakdown.materialCost}
                  onChange={e => handleBreakdownChange('materialCost', e.target.value)} placeholder="6800" />
                <Input label="Stitching Cost (₹)" type="number" min="0" value={form.costBreakdown.stitchingCost}
                  onChange={e => handleBreakdownChange('stitchingCost', e.target.value)} placeholder="2000" />
                <Input label="Other Cost (₹)" type="number" min="0" value={form.costBreakdown.otherCost}
                  onChange={e => handleBreakdownChange('otherCost', e.target.value)} placeholder="0" />
              </div>
            )}
          </div>
        </div>

        {/* Section 3 — Stock */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Stock</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Quantity *" type="number" min="0" value={form.quantity} onChange={e => set('quantity', e.target.value)} placeholder="10" />
          </div>
          <div className="mt-3">
            <label className="text-sm font-medium text-gray-700 block mb-2">Sizes</label>
            <div className="flex gap-2 flex-wrap">
              {SIZES.map(s => (
                <button
                  key={s} type="button"
                  onClick={() => toggleSize(s)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    form.sizes.includes(s)
                      ? 'bg-indigo-900 text-white border-indigo-900'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3">
            <label className="text-sm font-medium text-gray-700 block mb-2">Colors</label>
            <div className="flex gap-2 flex-wrap mb-2">
              {form.colors.map((c, i) => (
                <span key={i} className="bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  {c}
                  <button type="button" onClick={() => removeColor(c)}><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={colorInput}
                onChange={e => setColorInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addColor(); } }}
                placeholder="Purple, Navy Blue..."
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Button type="button" variant="secondary" size="sm" onClick={addColor}>
                <Plus className="w-4 h-4" /> Add
              </Button>
            </div>
          </div>
        </div>

        {/* Section 4 — Details */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Supplier" value={form.supplier} onChange={e => set('supplier', e.target.value)} placeholder="Surat Wholesale" />
            <Input label="Purchase Date" type="date" value={form.purchaseDate} onChange={e => set('purchaseDate', e.target.value)} />
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700 block mb-1">Notes</label>
              <textarea
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="e.g. mum 6800, stitching 2000"
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Section 5 — Images */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Images</h3>
          <div className="flex gap-3 flex-wrap">
            {form.imageUrls.map((url, i) => (
              <div key={i} className="relative w-20 h-20">
                <img src={url} alt="" className="w-full h-full object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={() => set('imageUrls', form.imageUrls.filter((_, j) => j !== i))}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {/* Camera button */}
            <button
              type="button"
              onClick={() => cameraRef.current.click()}
              disabled={uploading}
              className="w-20 h-20 border-2 border-dashed border-indigo-300 rounded-lg flex flex-col items-center justify-center text-indigo-400 hover:border-indigo-500 hover:text-indigo-600 transition-colors"
            >
              {uploading ? (
                <span className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Camera className="w-5 h-5" />
                  <span className="text-xs mt-1">Camera</span>
                </>
              )}
            </button>
            {/* Gallery / file picker button */}
            <button
              type="button"
              onClick={() => fileRef.current.click()}
              disabled={uploading}
              className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-indigo-400 hover:text-indigo-400 transition-colors"
            >
              {uploading ? (
                <span className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Image className="w-5 h-5" />
                  <span className="text-xs mt-1">Gallery</span>
                </>
              )}
            </button>
          </div>
          {/* Camera capture — opens rear camera on mobile */}
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
          {/* Gallery / file picker — multiple files */}
          <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" variant="primary" loading={saving}>
            {isEdit ? 'Update Product' : 'Add Product'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
