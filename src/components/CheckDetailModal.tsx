import type { CustomerCheck, SupplierCheck } from '../lib/types';

interface CheckDetailModalProps {
  open: boolean;
  check: SupplierCheck | CustomerCheck | null;
  onClose: () => void;
  onMarkPaid?: () => Promise<void>;
}

const formatCurrency = (value: number) => `${value.toFixed(2)} MAD`;

const isSupplierCheck = (check: SupplierCheck | CustomerCheck): check is SupplierCheck =>
  (check as SupplierCheck).supplier_name !== undefined;

export default function CheckDetailModal({ open, check, onClose, onMarkPaid }: CheckDetailModalProps) {
  if (!open || !check) {
    return null;
  }

  const entityName = isSupplierCheck(check) ? check.supplier_name : check.customer_name;
  const entityPhone = isSupplierCheck(check) ? check.supplier_phone : check.customer_phone;
  const entityEmail = isSupplierCheck(check) ? check.supplier_email : check.customer_email;
  const entityLabel = isSupplierCheck(check) ? 'Supplier' : 'Customer';
  const status = check.paid ? 'Paid' : new Date(check.due_date) < new Date() ? 'Overdue' : 'Pending';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-outline-variant bg-surface-container p-6 shadow-2xl shadow-black/30">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-on-surface">Check details</h2>
            <p className="mt-2 text-sm text-on-surface-variant">Review the full status and history for this {entityLabel.toLowerCase()} check.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container-high">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-outline-variant bg-surface-container-high p-4">
              <p className="text-sm text-on-surface-variant">{entityLabel}</p>
              <p className="mt-2 text-lg font-semibold text-on-surface">{entityName}</p>
              {entityPhone ? <p className="mt-2 text-sm text-on-surface-variant">Phone: {entityPhone}</p> : null}
              {entityEmail ? <p className="mt-1 text-sm text-on-surface-variant">Email: {entityEmail}</p> : null}
            </div>

            <div className="rounded-3xl border border-outline-variant bg-surface-container-high p-4">
              <p className="text-sm text-on-surface-variant">Status</p>
              <p className="mt-2 text-lg font-semibold text-on-surface">{status}</p>
              <p className="mt-3 text-sm text-on-surface-variant">Amount: {formatCurrency(check.amount)}</p>
              <p className="mt-1 text-sm text-on-surface-variant">Due date: {check.due_date}</p>
              {check.paid_date ? <p className="mt-1 text-sm text-on-surface-variant">Paid date: {check.paid_date}</p> : null}
            </div>
          </div>

          <div className="rounded-3xl border border-outline-variant bg-surface-container-high p-4">
            <p className="text-sm text-on-surface-variant">Reference</p>
            <p className="mt-2 text-base text-on-surface">{check.reference || 'N/A'}</p>
          </div>

          <div className="rounded-3xl border border-outline-variant bg-surface-container-high p-4">
            <p className="text-sm text-on-surface-variant">Notes</p>
            <p className="mt-2 text-base text-on-surface">{check.notes || 'No notes recorded.'}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {!check.paid && onMarkPaid ? (
            <button type="button" onClick={onMarkPaid} className="rounded-2xl bg-success px-5 py-3 text-sm font-semibold text-on-primary transition hover:bg-success/90">
              Mark as paid
            </button>
          ) : null}
          <button type="button" onClick={onClose} className="rounded-2xl border border-outline-variant bg-surface-container-high px-5 py-3 text-sm font-semibold text-on-surface">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
