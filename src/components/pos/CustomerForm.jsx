import Input from '../common/Input';

export default function CustomerForm({ customer, onChange }) {
  function set(field, val) {
    onChange({ ...customer, [field]: val });
  }

  return (
    <div className="space-y-3">
      <Input
        label="Sold To *"
        value={customer.soldTo}
        onChange={e => set('soldTo', e.target.value)}
        placeholder="Customer Name"
      />
      <Input
        label="Phone"
        type="tel"
        value={customer.phone}
        onChange={e => set('phone', e.target.value)}
        placeholder="9876543210"
      />
      <Input
        label="Date"
        type="date"
        value={customer.date}
        onChange={e => set('date', e.target.value)}
      />
    </div>
  );
}
