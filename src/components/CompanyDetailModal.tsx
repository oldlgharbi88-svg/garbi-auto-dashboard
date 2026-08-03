interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: string;
  createdAt: string;
}

interface CompanyDetailModalProps {
  open: boolean;
  company: {
    id: string;
    name: string;
    contactPerson: string;
    phone: string;
    email: string;
    ice: string;
    rc: string;
    address: string;
    invoices: InvoiceItem[];
  } | null;
  onClose: () => void;
}

export default function CompanyDetailModal({ open, company, onClose }: CompanyDetailModalProps) {
  if (!open || !company) {
    return null;
  }

  const totalInvoiced = company.invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  const totalPaid = company.invoices.reduce((sum, invoice) => sum + invoice.paidAmount, 0);
  const totalOutstanding = totalInvoiced - totalPaid;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
      <div className="w-full max-w-3xl rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">Détails de la societe</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{company.name}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-zinc-700 px-3 py-2 text-sm text-zinc-300">Fermer</button>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Total facturé</p>
            <p className="mt-2 text-xl font-semibold text-white">{totalInvoiced.toLocaleString('fr-FR')} MAD</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Total payé</p>
            <p className="mt-2 text-xl font-semibold text-white">{totalPaid.toLocaleString('fr-FR')} MAD</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Solde restant</p>
            <p className="mt-2 text-xl font-semibold text-amber-300">{totalOutstanding.toLocaleString('fr-FR')} MAD</p>
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
              {company.invoices.map((invoice) => (
                <tr key={invoice.id} className="text-sm text-zinc-200">
                  <td className="px-4 py-3">{invoice.invoiceNumber}</td>
                  <td className="px-4 py-3">{invoice.totalAmount.toLocaleString('fr-FR')} MAD</td>
                  <td className="px-4 py-3">{invoice.paidAmount.toLocaleString('fr-FR')} MAD</td>
                  <td className={`px-4 py-3 ${invoice.remainingAmount > 0 ? 'text-amber-300' : 'text-emerald-300'}`}>{invoice.remainingAmount.toLocaleString('fr-FR')} MAD</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
