import { useState } from 'react';
import type { NewCustomerCheck } from '../lib/types';

interface AddCustomerCheckModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (check: NewCustomerCheck) => Promise<void>;
}

const inputClasses = 'w-full rounded-2xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none';

export default function AddCustomerCheckModal({ open, onClose, onSave }: AddCustomerCheckModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [reference, setReference] = useState('');
  const [amount, setAmount] = useState('0');
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paid, setPaid] = useState(false);
  const [paidDate, setPaidDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setReference('');
    setAmount('0');
    setDueDate(new Date().toISOString().slice(0, 10));
    setPaid(false);
    setPaidDate('');
    setNotes('');
    setError('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!customerName.trim() || Number(amount) <= 0 || !dueDate) {
      setError('Please complete the customer name, amount, and due date.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await onSave({
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim() || null,
        customer_email: customerEmail.trim() || null,
        reference: reference.trim() || null,
        amount: Number(amount),
        due_date: dueDate,
        paid,
        paid_date: paid ? paidDate || new Date().toISOString().slice(0, 10) : null,
        notes: notes.trim() || null
      });
      handleClose();
    } catch (err) {
      console.error(err);
      setError('Unable to save the customer check. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-outline-variant bg-surface-container p-6 shadow-2xl shadow-black/30">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-on-surface">Nouveau chèque client</h2>
            <p className="mt-2 text-sm text-on-surface-variant">Saisissez les détails pour suivre le chèque client.</p>
          </div>
          <button type="button" onClick={handleClose} className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container-high">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm text-on-surface-variant">
            Customer
            <input className={inputClasses} value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Customer name" />
          </label>
          <label className="space-y-2 text-sm text-on-surface-variant">
            Reference
            <input className={inputClasses} value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Reference" />
          </label>
          <label className="space-y-2 text-sm text-on-surface-variant">
            Amount
            <input className={inputClasses} type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} />
          </label>
          <label className="space-y-2 text-sm text-on-surface-variant">
            Due date
            <input className={inputClasses} type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
          </label>
          <label className="space-y-2 text-sm text-on-surface-variant">
            Phone
            <input className={inputClasses} value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} placeholder="Customer phone" />
          </label>
          <label className="space-y-2 text-sm text-on-surface-variant">
            Email
            <input className={inputClasses} type="email" value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} placeholder="Customer email" />
          </label>
          <label className="flex items-center gap-3 text-sm font-semibold text-on-surface-variant">
            <input type="checkbox" checked={paid} onChange={(event) => setPaid(event.target.checked)} className="h-4 w-4 rounded border-outline-variant text-primary" />
            Mark as paid
          </label>
          {paid ? (
            <label className="space-y-2 text-sm text-on-surface-variant">
              Paid date
              <input className={inputClasses} type="date" value={paidDate} onChange={(event) => setPaidDate(event.target.value)} />
            </label>
          ) : null}
          <label className="sm:col-span-2 space-y-2 text-sm text-on-surface-variant">
            Notes
            <textarea rows={4} className={`${inputClasses} resize-none`} value={notes} onChange={(event) => setNotes(event.target.value)} />
          </label>
        </div>

        {error ? <p className="mt-4 text-sm text-error">{error}</p> : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" disabled={saving} onClick={handleSubmit} className="rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-on-primary transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60">
            {saving ? 'Saving…' : 'Save customer check'}
          </button>
          <button type="button" onClick={handleClose} className="rounded-2xl border border-outline-variant bg-surface-container-high px-5 py-3 text-sm font-semibold text-on-surface">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
