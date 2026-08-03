import { useMemo, useState } from 'react';

interface AddPaymentModalProps {
  open: boolean;
  company: {
    id: string;
    name: string;
    invoices: Array<{
      id: string;
      invoiceNumber: string;
      totalAmount: number;
      paidAmount: number;
      remainingAmount: number;
      status: string;
      createdAt: string;
    }>;
  } | null;
  onClose: () => void;
  onSave: (invoiceNumber: string, amount: number) => void;
}

export default function AddPaymentModal({ open, company, onClose, onSave }: AddPaymentModalProps) {
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');

  const pendingInvoices = useMemo(() => company?.invoices.filter((invoice) => invoice.remainingAmount > 0) ?? [], [company]);

  if (!open || !company) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
      <div className="w-full max-w-xl rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">Ajouter un paiement</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Enregistrer un paiement pour {company.name}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-zinc-700 px-3 py-2 text-sm text-zinc-300">Fermer</button>
        </div>
        <div className="grid gap-4">
          <label className="flex flex-col gap-2 text-sm text-zinc-400">
            Facture
            <select value={invoiceNumber} onChange={(event) => setInvoiceNumber(event.target.value)} className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white">
              <option value="">Sélectionner une facture</option>
              {pendingInvoices.map((invoice) => (
                <option key={invoice.id} value={invoice.invoiceNumber}>{invoice.invoiceNumber} — {invoice.remainingAmount.toLocaleString('fr-FR')} MAD restant</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm text-zinc-400">
            Montant
            <input value={amount} onChange={(event) => setAmount(event.target.value)} className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white" placeholder="Montant" />
          </label>
          <label className="flex flex-col gap-2 text-sm text-zinc-400">
            Méthode
            <select value={method} onChange={(event) => setMethod(event.target.value)} className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white">
              <option value="cash">Cash</option>
              <option value="virement">Virement</option>
              <option value="cheque">Chèque</option>
            </select>
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300">Annuler</button>
          <button
            type="button"
            disabled={!invoiceNumber || !amount}
            onClick={() => {
              const parsedAmount = Number(amount);
              if (invoiceNumber && Number.isFinite(parsedAmount) && parsedAmount > 0) {
                onSave(invoiceNumber, parsedAmount);
              }
            }}
            className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-700"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
