import { useState } from 'react';

interface CustomerCreateModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (customer: {
    name: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    notes: string;
    initialCredit: number;
  }) => void;
}

export default function CustomerCreateModal({ open, onClose, onSave }: CustomerCreateModalProps) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    notes: '',
    initialCredit: 0
  });

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">Nouveau client</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Ajouter un client</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300">Fermer</button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="text-sm text-zinc-300">
            <span className="mb-2 block">Nom</span>
            <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-2" />
          </label>
          <label className="text-sm text-zinc-300">
            <span className="mb-2 block">Téléphone</span>
            <input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-2" />
          </label>
          <label className="text-sm text-zinc-300">
            <span className="mb-2 block">Email</span>
            <input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-2" />
          </label>
          <label className="text-sm text-zinc-300">
            <span className="mb-2 block">Ville</span>
            <input value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-2" />
          </label>
          <label className="md:col-span-2 text-sm text-zinc-300">
            <span className="mb-2 block">Adresse</span>
            <input value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-2" />
          </label>
          <label className="md:col-span-2 text-sm text-zinc-300">
            <span className="mb-2 block">Notes</span>
            <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} className="min-h-24 w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-2" />
          </label>
          <label className="text-sm text-zinc-300">
            <span className="mb-2 block">Crédit initial (MAD)</span>
            <input type="number" value={form.initialCredit} onChange={(event) => setForm((current) => ({ ...current, initialCredit: Number(event.target.value) }))} className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-2" />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300">Annuler</button>
          <button type="button" onClick={() => onSave(form)} className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white">Enregistrer</button>
        </div>
      </div>
    </div>
  );
}
