import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';

interface InventoryItem {
  id: number | string;
  name: string;
  reference: string;
  compatible_cars: string;
  purchaseprice: number;
  sellingprice: number;
  quantity: number;
  image_url?: string | null;
  archived?: boolean | null;
  last_restock_date?: string | null;
  total_sold?: number | null;
  low_stock_threshold?: number | null;
}

interface RestockModalProps {
  item: InventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const inputClasses =
  'w-full rounded-2xl border border-zinc-700 bg-zinc-950/70 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-red-500';

export default function RestockModal({ item, isOpen, onClose, onSuccess }: RestockModalProps) {
  const [quantity, setQuantity] = useState('1');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [supplier, setSupplier] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setQuantity('1');
    setPurchasePrice('');
    setSupplier('');
    setExpectedDate('');
    setNote('');
    setError('');
    setIsSaving(false);
  }, [isOpen, item]);

  if (!isOpen || !item) {
    return null;
  }

  const handleSubmit = async (mode: 'order' | 'stock') => {
    const parsedQuantity = Number.parseInt(quantity, 10);
    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      setError('Veuillez saisir une quantité valide.');
      return;
    }

    const parsedPurchasePrice = purchasePrice.trim() ? Number.parseFloat(purchasePrice) : null;
    if (purchasePrice.trim() && (!Number.isFinite(parsedPurchasePrice) || (parsedPurchasePrice ?? 0) < 0)) {
      setError('Veuillez saisir un prix d’achat valide.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const { error: insertError } = await supabase.from('restock_orders').insert([
        {
          part_id: item.id,
          quantity_ordered: parsedQuantity,
          new_purchase_price: parsedPurchasePrice,
          supplier: supplier.trim() || null,
          expected_delivery_date: expectedDate || null,
          status: mode === 'stock' ? 'received' : 'pending',
          note: note.trim() || null
        }
      ]);

      if (insertError) {
        throw insertError;
      }

      if (mode === 'stock') {
        const nextQuantity = Math.max(0, item.quantity + parsedQuantity);
        const nextPurchasePrice = parsedPurchasePrice ?? item.purchaseprice;
        const today = new Date().toISOString().slice(0, 10);
        const { error: updateError } = await supabase
          .from('inventory')
          .update({ quantity: nextQuantity, purchaseprice: nextPurchasePrice, last_restock_date: today })
          .eq('id', item.id);

        if (updateError) {
          throw updateError;
        }
      }

      onSuccess();
      onClose();
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Impossible d’enregistrer la réapprovisionnement.';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl shadow-black/60">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-red-400">Réapprovisionner / تجهيز</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Réapprovisionner la pièce / تجهيز القطعة</h2>
            <p className="mt-1 text-sm text-zinc-400">{item.name} • {item.reference}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300">
            Fermer
          </button>
        </div>

        <form className="space-y-4" onSubmit={(event: FormEvent) => event.preventDefault()}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-zinc-300">
              Quantité à ajouter
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                className={inputClasses}
                required
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-zinc-300">
              Nouveau prix d’achat
              <input
                type="number"
                min="0"
                step="0.01"
                value={purchasePrice}
                onChange={(event) => setPurchasePrice(event.target.value)}
                className={inputClasses}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-zinc-300">
              Fournisseur
              <input
                type="text"
                value={supplier}
                onChange={(event) => setSupplier(event.target.value)}
                className={inputClasses}
                placeholder="Nom du fournisseur"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-zinc-300">
              Date de livraison prévue
              <input
                type="date"
                value={expectedDate}
                onChange={(event) => setExpectedDate(event.target.value)}
                className={inputClasses}
              />
            </label>
          </div>

          <label className="flex flex-col gap-2 text-sm text-zinc-300">
            Note
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className={`${inputClasses} min-h-[96px] resize-y`}
              placeholder="Instructions, condition, priorité…"
            />
          </label>

          {error ? <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p> : null}

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-2xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-zinc-200">
              Annuler
            </button>
            <button
              type="button"
              onClick={() => void handleSubmit('order')}
              disabled={isSaving}
              className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-amber-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? 'En cours…' : '🛒 Confirmer la commande'}
            </button>
            <button
              type="button"
              onClick={() => void handleSubmit('stock')}
              disabled={isSaving}
              className="rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? 'En cours…' : '✅ Ajouter au stock maintenant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
