interface CompanyDetailModalProps {
  open: boolean;
  companyName: string;
  onClose: () => void;
}

export default function CompanyDetailModal({ open, companyName, onClose }: CompanyDetailModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
      <div className="w-full max-w-3xl rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">Détails de la societe</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{companyName}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-zinc-700 px-3 py-2 text-sm text-zinc-300">Fermer</button>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Total facturé</p>
            <p className="mt-2 text-xl font-semibold text-white">15,420 MAD</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Total payé</p>
            <p className="mt-2 text-xl font-semibold text-white">8,200 MAD</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Solde restant</p>
            <p className="mt-2 text-xl font-semibold text-amber-300">7,220 MAD</p>
          </div>
        </div>
        <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-800">
          <table className="min-w-full divide-y divide-zinc-800">
            <thead className="bg-zinc-950/70">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">Facture</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">Montant</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">Payé</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">Restant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 bg-zinc-900/60">
              <tr className="text-sm text-zinc-200">
                <td className="px-4 py-3">INV-001</td>
                <td className="px-4 py-3">12,500 MAD</td>
                <td className="px-4 py-3">7,000 MAD</td>
                <td className="px-4 py-3 text-amber-300">5,500 MAD</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
