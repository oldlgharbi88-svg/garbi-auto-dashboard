import { useMemo, useState } from 'react';

interface SupplierFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (supplier: {
    name: string;
    contactPerson: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    balance: number;
    note: string;
    lastOrderDate: string;
  }) => void;
}

export default function SupplierFormModal({ open, onClose, onSave }: SupplierFormModalProps) {
  const [form, setForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    balance: 0,
    note: '',
    lastOrderDate: new Date().toISOString().slice(0, 10)
  });

  const isValid = useMemo(() => form.name.trim().length > 0, [form.name]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
      <div className="w-full max-w-2xl rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">Nouveau fournisseur</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Ajouter un fournisseur</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-zinc-700 px-3 py-2 text-sm text-zinc-300">Fermer</button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-zinc-400">
            Nom
            <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white" placeholder="Nom du fournisseur" />
          </label>
          <label className="flex flex-col gap-2 text-sm text-zinc-400">
            Contact
            <input value={form.contactPerson} onChange={(event) => setForm((current) => ({ ...current, contactPerson: event.target.value }))} className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white" placeholder="Nom du contact" />
          </label>
          <label className="flex flex-col gap-2 text-sm text-zinc-400">
            Téléphone
            <input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white" placeholder="Téléphone" />
          </label>
          <label className="flex flex-col gap-2 text-sm text-zinc-400">
            Email
            <input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white" placeholder="email@domain.com" />
          </label>
          <label className="flex flex-col gap-2 text-sm text-zinc-400 md:col-span-2">
            Adresse
            <input value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white" placeholder="Adresse" />
          </label>
          <label className="flex flex-col gap-2 text-sm text-zinc-400">
            Ville
            <input value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white" placeholder="Ville" />
          </label>
          <label className="flex flex-col gap-2 text-sm text-zinc-400">
            Solde initial (MAD)
            <input type="number" value={form.balance} onChange={(event) => setForm((current) => ({ ...current, balance: Number(event.target.value) }))} className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white" />
          </label>
          <label className="flex flex-col gap-2 text-sm text-zinc-400 md:col-span-2">
            Note
            <textarea value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} className="min-h-24 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white" placeholder="Note" />
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300">Annuler</button>
          <button type="button" disabled={!isValid} onClick={() => { onSave(form); }} className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-700">Enregistrer</button>
        </div>
      </div>
    </div>
  );
}
