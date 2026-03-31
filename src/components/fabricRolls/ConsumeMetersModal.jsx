import { useState } from 'react';
import { consumeMeters } from '../../firebase/fabricRollService';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import toast from 'react-hot-toast';

export default function ConsumeMetersModal({ isOpen, onClose, roll, onSaved }) {
  const [meters, setMeters] = useState('');
  const [usedFor, setUsedFor] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const m = Number(meters);
    if (!m || m <= 0) { toast.error('Enter valid meters'); return; }
    if (!usedFor.trim()) { toast.error('Please describe what it was used for'); return; }
    if (m > (roll?.remainingMeters || 0)) {
      toast.error(`Only ${roll?.remainingMeters}m remaining`);
      return;
    }
    setSaving(true);
    try {
      await consumeMeters(roll.id, m, usedFor.trim());
      toast.success(`${m}m consumed from ${roll.name}`);
      setMeters('');
      setUsedFor('');
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error('Failed to record consumption');
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Consume Meters" size="sm">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {roll && (
          <div className="bg-indigo-50 rounded-lg p-3 text-sm">
            <p className="font-medium text-indigo-800">{roll.name}</p>
            <p className="text-indigo-600 text-xs mt-0.5">
              Available: <strong>{roll.remainingMeters}m</strong> of {roll.totalMeters}m
            </p>
          </div>
        )}
        <Input
          label="Meters to Consume *"
          type="number"
          min="0.1"
          step="0.1"
          max={roll?.remainingMeters || 9999}
          value={meters}
          onChange={e => setMeters(e.target.value)}
          placeholder="5.5"
        />
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Used For *</label>
          <input
            value={usedFor}
            onChange={e => setUsedFor(e.target.value)}
            placeholder="Purple Kurti Set - 3 pieces"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" variant="primary" loading={saving}>Record Consumption</Button>
        </div>
      </form>
    </Modal>
  );
}
