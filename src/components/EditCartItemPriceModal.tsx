import { FormEvent, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useCart, type CartItem } from '../context/CartContext';

interface EditCartItemPriceModalProps {
  item: CartItem;
  isOpen: boolean;
  canEditProductPrices: boolean;
  onClose: () => void;
}

const quickPercentages = [10, 20, 50, -10, -20];

export default function EditCartItemPriceModal({ item, isOpen, canEditProductPrices, onClose }: EditCartItemPriceModalProps) {
  const { updateCartItemPrice, showToast } = useCart();
  const [newPriceInput, setNewPriceInput] = useState(String(item.price));
  const [reason, setReason] = useState('');
  const [type, setType] = useState<'cart' | 'inventory'>('cart');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const oldPrice = useMemo(() => item.original_price ?? item.price, [item.original_price, item.price]);
  const percentChange = useMemo(() => {
    if (!oldPrice || oldPrice <= 0) {
      return 0;
    }

    return ((item.price - oldPrice) / oldPrice) * 100;
  }, [item.price, oldPrice]);

  if (!isOpen) {
    return null;
  }

  const validateAndParsePrice = () => {
    const trimmedValue = newPriceInput.trim();
    const parsedPrice = Number.parseFloat(trimmedValue);
    if (!trimmedValue || !Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setError('Veuillez entrer un prix unitaire positif.');
      return null;
    }

    return parsedPrice;
  };

  const applyQuickFill = (percent: number) => {
    const parsedPrice = Number.parseFloat(newPriceInput) || item.price;
    const nextPrice = parsedPrice * (1 + percent / 100);
    setNewPriceInput(String(nextPrice.toFixed(2)));
    setError('');
  };

  const resetPrice = () => {
    setNewPriceInput(String(item.price));
    setError('');
  };

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();

    const nextPrice = validateAndParsePrice();
    if (!nextPrice) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (type === 'inventory' && canEditProductPrices) {
        const inventoryId = Number(item.id);
        const { error: inventoryError } = await supabase
          .from('inventory')
          .update({ sellingprice: nextPrice })
          .eq('id', Number.isNaN(inventoryId) ? item.id : inventoryId)
          .select()
          .single();

        if (inventoryError) {
          throw inventoryError;
        }

        await supabase.from('price_history').insert({
          part_id: item.id,
          old_price: oldPrice,
          new_price: nextPrice,
          reason: reason.trim() || 'Modification manuelle',
          changed_by: 'admin'
        });
      }

      updateCartItemPrice(item.id, nextPrice, {
        reason: reason.trim() || undefined,
        priceModified: true,
        originalPrice: oldPrice
      });

      showToast('Prix mis à jour');
      onClose();
    } catch (inventoryError) {
      setError('Impossible de mettre à jour le prix pour le moment.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl shadow-black/60">
        <div className="mb-5">
          <p className="text-xs uppercase tracking-[0.35em] text-amber-400">Modifier le prix / تعديل الثمن</p>
          <h3 className="mt-2 text-xl font-semibold text-white">{item.name}</h3>
          <p className="mt-1 text-sm text-zinc-400">{item.reference} • Qty {item.quantity}</p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
            {item.image_url ? (
              <img src={item.image_url} alt={item.name} className="h-16 w-16 rounded-xl object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-xs text-zinc-500">
                Image
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-white">{item.name}</p>
              <p className="text-sm text-zinc-400">Réf. {item.reference}</p>
              <p className="text-sm text-zinc-400">Qté: {item.quantity}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
            <label className="mb-2 block text-sm font-medium text-zinc-200">Ancien prix</label>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-white">
              <span className="line-through">{oldPrice.toLocaleString('fr-FR')} MAD</span>
            </div>
          </div>

          <div>
            <label htmlFor="cart-price-input" className="mb-2 block text-sm font-medium text-zinc-200">
              Nouveau prix unitaire
            </label>
            <div className="flex items-center gap-3 rounded-2xl border border-zinc-700 bg-zinc-950/70 px-4 py-3">
              <input
                id="cart-price-input"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                value={newPriceInput}
                onChange={(event) => {
                  setNewPriceInput(event.target.value);
                  if (error) {
                    setError('');
                  }
                }}
                className="w-full bg-transparent text-white outline-none"
                placeholder="0.00"
                required
              />
              <span className="text-sm font-semibold text-zinc-400">MAD</span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {quickPercentages.map((percent) => (
                <button
                  key={percent}
                  type="button"
                  onClick={() => applyQuickFill(percent)}
                  className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200"
                >
                  {percent > 0 ? `+${percent}%` : `${percent}%`}
                </button>
              ))}
              <button type="button" onClick={resetPrice} className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200">
                Reset
              </button>
            </div>

            {error ? <p className="mt-2 text-sm text-rose-400">{error}</p> : null}
          </div>

          <div>
            <label htmlFor="cart-price-reason" className="mb-2 block text-sm font-medium text-zinc-200">
              Raison du changement
            </label>
            <textarea
              id="cart-price-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              className="w-full rounded-2xl border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-sm text-white outline-none"
              placeholder="Optionnel"
            />
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
            <p className="mb-3 text-sm font-medium text-zinc-200">Type de modification</p>
            <div className="space-y-2">
              <label className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-200">
                <input
                  type="radio"
                  name="price-modification-type"
                  checked={type === 'cart'}
                  onChange={() => setType('cart')}
                  className="h-4 w-4 border-zinc-600 bg-zinc-900 text-amber-500"
                />
                <span>Remise ponctuelle</span>
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-200">
                <input
                  type="radio"
                  name="price-modification-type"
                  checked={type === 'inventory'}
                  onChange={() => setType('inventory')}
                  disabled={!canEditProductPrices}
                  className="h-4 w-4 border-zinc-600 bg-zinc-900 text-amber-500 disabled:opacity-50"
                />
                <span>Modifier le prix du produit</span>
              </label>
            </div>
            {type === 'inventory' && !canEditProductPrices ? (
              <p className="mt-2 text-xs text-amber-400">Vous devez être administrateur pour modifier le prix du produit.</p>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-2xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-zinc-200">
              Annuler
            </button>
            <button type="submit" disabled={saving} className="rounded-2xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70">
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
