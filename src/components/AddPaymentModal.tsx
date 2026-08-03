interface AddPaymentModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AddPaymentModal({ open, onClose }: AddPaymentModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
      <div className="w-full max-w-xl rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">Ajouter un paiement</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Enregistrer un paiement</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-zinc-700 px-3 py-2 text-sm text-zinc-300">Fermer</button>
        </div>
        <div className="grid gap-4">
          <label className="flex flex-col gap-2 text-sm text-zinc-400">
            Montant
            <input className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white" placeholder="Montant" />
          </label>
          <label className="flex flex-col gap-2 text-sm text-zinc-400">
            Méthode
            <select className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white">
              <option>Cash</option>
              <option>Virement</option>
              <option>Chèque</option>
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm text-zinc-400">
            Date
            <input type="date" className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white" />
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300">Annuler</button>
          <button type="button" className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white">Enregistrer</button>
        </div>
      </div>
    </div>
  );
}
