import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
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
  const modalRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
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

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    const timeoutId = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 80);

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

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
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-3 py-4 backdrop-blur-sm sm:px-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={modalRef}
        className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/60 animate-[fadeIn_160ms_ease-out]"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Modifier le prix"
      >
        <header className="border-b border-zinc-800 bg-zinc-950/80 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="h-10 w-10 rounded-xl object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-[10px] text-zinc-500">
                  Image
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">{item.name}</p>
                <p className="truncate text-xs text-zinc-400">Réf. {item.reference}</p>
                <p className="text-xs text-zinc-400">Qté: {item.quantity}</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Fermer la fenêtre"
              onClick={onClose}
              className="rounded-full border border-zinc-700 bg-zinc-900 p-2 text-sm text-zinc-300 transition hover:border-zinc-500 hover:text-white"
            >
              ×
            </button>
          </div>
        </header>

        <form onSubmit={handleSave} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto bg-zinc-900/90 p-4">
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
                  ref={inputRef}
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
          </div>

          <footer className="border-t border-zinc-800 bg-zinc-950/80 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-2xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500 sm:w-auto"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
}
