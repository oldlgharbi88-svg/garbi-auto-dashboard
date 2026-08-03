import { useState } from 'react';

interface CompanyFormModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CompanyFormModal({ open, onClose }: CompanyFormModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
      <div className="w-full max-w-2xl rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">Nouvelle societe</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Ajouter une societe</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-zinc-700 px-3 py-2 text-sm text-zinc-300">Fermer</button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-zinc-400">
            Nom
            <input className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white" placeholder="Nom de la societe" />
          </label>
          <label className="flex flex-col gap-2 text-sm text-zinc-400">
            Personne de contact
            <input className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white" placeholder="Nom du contact" />
          </label>
          <label className="flex flex-col gap-2 text-sm text-zinc-400">
            Téléphone
            <input className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white" placeholder="+212 ..." />
          </label>
          <label className="flex flex-col gap-2 text-sm text-zinc-400">
            Email
            <input className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white" placeholder="email@domain.com" />
          </label>
          <label className="flex flex-col gap-2 text-sm text-zinc-400 md:col-span-2">
            Adresse
            <input className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white" placeholder="Adresse" />
          </label>
          <label className="flex flex-col gap-2 text-sm text-zinc-400">
            ICE
            <input className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white" placeholder="ICE" />
          </label>
          <label className="flex flex-col gap-2 text-sm text-zinc-400">
            RC
            <input className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white" placeholder="RC" />
          </label>
          <label className="flex flex-col gap-2 text-sm text-zinc-400 md:col-span-2">
            Notes
            <textarea className="min-h-24 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-white" placeholder="Notes" />
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
