import { useState, useEffect } from 'react';
import { addFabricRoll, updateFabricRoll } from '../../firebase/fabricRollService';
import { encodePrice } from '../../utils/tagCodec';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import toast from 'react-hot-toast';

const FABRIC_TYPES = ['Georgette', 'Silk', 'Cotton', 'Net', 'Chanderi', 'Bandhani', 'Crepe', 'Chiffon', 'Velvet', 'Linen', 'Khadi', 'Other'];
const PATTERNS = ['Plain', 'Printed', 'Embroidered', 'Zari', 'Block Print', 'Jacquard'];

const EMPTY = {
  name: '', fabricType: 'Georgette', color: '', pattern: 'Plain',
  supplier: '', purchaseDate: '', totalMeters: '', costPerMeter: '',
  rackLocation: '', notes: ''
};

export default function RollForm({ isOpen, onClose, onSaved, roll }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const isEdit = !!roll;

  useEffect(() => {
    if (isOpen) {
      if (roll) {
        setForm({
          ...EMPTY, ...roll,
          totalMeters: roll.totalMeters || '',
          costPerMeter: roll.costPerMeter || '',
          purchaseDate: roll.purchaseDate ? new Date(roll.purchaseDate.toDate?.() || roll.purchaseDate).toISOString().split('T')[0] : ''
        });
      } else {
        setForm(EMPTY);
      }
    }
  }, [isOpen, roll]);

  function set(field, val) {
    setForm(f => ({ ...f, [field]: val }));
  }

  const tagCode = form.costPerMeter ? encodePrice(Number(form.costPerMeter)) : '';

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Roll name is required'); return; }
    if (!form.totalMeters || isNaN(Number(form.totalMeters))) { toast.error('Total meters required'); return; }
    if (!form.costPerMeter || isNaN(Number(form.costPerMeter))) { toast.error('Cost per meter required'); return; }

    setSaving(true);
    try {
      const data = {
        name: form.name.trim(),
        fabricType: form.fabricType,
        color: form.color,
        pattern: form.pattern,
        supplier: form.supplier,
        purchaseDate: form.purchaseDate ? new Date(form.purchaseDate) : null,
        totalMeters: Number(form.totalMeters),
        costPerMeter: Number(form.costPerMeter),
        rackLocation: form.rackLocation,
        notes: form.notes
      };
      if (isEdit) {
        if (data.totalMeters !== roll.totalMeters) {
          data.remainingMeters = data.totalMeters - (roll.usedMeters || 0);
        }
        await updateFabricRoll(roll.id, data);
        toast.success('Roll updated!');
      } else {
        await addFabricRoll(data);
        toast.success('Fabric roll added!');
      }
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error('Failed to save');
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Fabric Roll' : 'Add Fabric Roll'} size="md">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <Input label="Roll Name *" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Georgette Fabric - Purple" />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Fabric Type *" value={form.fabricType} onChange={e => set('fabricType', e.target.value)}>
            {FABRIC_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
          </Select>
          <Input label="Color" value={form.color} onChange={e => set('color', e.target.value)} placeholder="Purple" />
          <Select label="Pattern" value={form.pattern} onChange={e => set('pattern', e.target.value)}>
            {PATTERNS.map(p => <option key={p} value={p}>{p}</option>)}
          </Select>
          <Input label="Supplier" value={form.supplier} onChange={e => set('supplier', e.target.value)} placeholder="Surat Mills" />
          <Input label="Purchase Date" type="date" value={form.purchaseDate} onChange={e => set('purchaseDate', e.target.value)} />
          <Input label="Total Meters *" type="number" min="0" step="0.5" value={form.totalMeters} onChange={e => set('totalMeters', e.target.value)} placeholder="50" />
          <div>
            <Input label="Cost per Meter (₹) *" type="number" min="0" value={form.costPerMeter} onChange={e => set('costPerMeter', e.target.value)} placeholder="350" />
            {tagCode && (
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs text-gray-500">Tag Code:</span>
                <span className="bg-amber-100 text-amber-700 font-mono font-bold text-sm px-2 py-0.5 rounded">{tagCode}</span>
              </div>
            )}
          </div>
          <Input label="Rack Location" value={form.rackLocation} onChange={e => set('rackLocation', e.target.value)} placeholder="Rack A - Shelf 2" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Notes</label>
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            rows={2}
            placeholder="Additional notes..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" variant="primary" loading={saving}>{isEdit ? 'Update Roll' : 'Add Roll'}</Button>
        </div>
      </form>
    </Modal>
  );
}
