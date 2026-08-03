interface CustomerDetailModalProps {
  open: boolean;
  customer: {
    id: string;
    name: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    notes: string;
    totalCredit: number;
    totalPaid: number;
    remainingBalance: number;
    lastPaymentDate: string | null;
    status: string;
    overdueDays: number;
  } | null;
  onClose: () => void;
}

export default function CustomerDetailModal({ open, customer, onClose }: CustomerDetailModalProps) {
  if (!open || !customer) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
      <div className="w-full max-w-2xl rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">Détails du client</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{customer.name}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-zinc-700 px-3 py-2 text-sm text-zinc-300">Fermer</button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Crédit total</p>
            <p className="mt-2 text-xl font-semibold text-white">{customer.totalCredit.toLocaleString('fr-FR')} MAD</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Total payé</p>
            <p className="mt-2 text-xl font-semibold text-white">{customer.totalPaid.toLocaleString('fr-FR')} MAD</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Reste à payer</p>
            <p className="mt-2 text-xl font-semibold text-amber-300">{customer.remainingBalance.toLocaleString('fr-FR')} MAD</p>
          </div>
        </div>

        <div className="mt-6 space-y-3 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 text-sm text-zinc-300">
          <p><span className="text-zinc-400">Téléphone:</span> {customer.phone}</p>
          <p><span className="text-zinc-400">Email:</span> {customer.email}</p>
          <p><span className="text-zinc-400">Adresse:</span> {customer.address}, {customer.city}</p>
          <p><span className="text-zinc-400">Dernier paiement:</span> {customer.lastPaymentDate ?? 'Aucun'}</p>
          <p><span className="text-zinc-400">Statut:</span> {customer.status}</p>
          <p><span className="text-zinc-400">Jours de retard:</span> {customer.overdueDays}</p>
          <p><span className="text-zinc-400">Notes:</span> {customer.notes || 'Aucune note'}</p>
        </div>
      </div>
    </div>
  );
}
