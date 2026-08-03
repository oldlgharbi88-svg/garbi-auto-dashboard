import { useMemo, useState } from 'react';
import EditCartItemPriceModal from './EditCartItemPriceModal';
import { useCart, type CartItem } from '../context/CartContext';
import { parseCustomDiscountInput } from '../utils/discountInput';

const presetDiscounts = [5, 10, 15, 20];

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  onOpenInvoice: () => void;
  canEditPrices?: boolean;
}

export default function CartDrawer({ open, onClose, onOpenInvoice, canEditPrices = false }: CartDrawerProps) {
  const { cartItems, cartCount, subtotal, discountType, discountValue, discountAmount, taxAmount, totalTTC, removeFromCart, updateQuantity, setDiscount, clearDiscount, showToast } = useCart();
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  const [customDiscountInput, setCustomDiscountInput] = useState('');
  const [discountError, setDiscountError] = useState('');
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);

  const manualDiscountTotal = useMemo(
    () =>
      cartItems.reduce((sum, item) => {
        if (item.price_modified && item.original_price != null && item.price < item.original_price) {
          return sum + (item.original_price - item.price) * item.quantity;
        }

        return sum;
      }, 0),
    [cartItems]
  );

  const isDiscountInputValid = useMemo(() => {
    const parsed = parseCustomDiscountInput(customDiscountInput);
    return parsed.kind !== 'invalid';
  }, [customDiscountInput]);

  const handlePresetDiscount = (value: number) => {
    setDiscount('percentage', value);
    setCustomDiscountInput('');
    setDiscountError('');
    showToast(`Remise appliquée: ${value}%`);
  };

  const handleApplyCustomDiscount = () => {
    const parsed = parseCustomDiscountInput(customDiscountInput);

    if (parsed.kind === 'invalid') {
      setDiscountError(parsed.error);
      return;
    }

    const { kind, value } = parsed;
    if (kind === 'percentage') {
      const cappedValue = Math.min(Math.max(value, 0), 100);
      if (cappedValue === 0) {
        clearDiscount();
        setDiscountError('');
        setCustomDiscountInput('');
        showToast('Remise supprimée');
        return;
      }
      setDiscount('percentage', cappedValue);
      setDiscountError('');
      setCustomDiscountInput('');
      setIsApplyingDiscount(true);
      window.setTimeout(() => setIsApplyingDiscount(false), 180);
      showToast(`Remise appliquée: ${cappedValue}%`);
      return;
    }

    const cappedValue = Math.min(Math.max(value, 0), subtotal);
    if (cappedValue === 0) {
      clearDiscount();
      setDiscountError('');
      setCustomDiscountInput('');
      showToast('Remise supprimée');
      return;
    }

    setDiscount('fixed', cappedValue);
    setDiscountError('');
    setCustomDiscountInput('');
    setIsApplyingDiscount(true);
    window.setTimeout(() => setIsApplyingDiscount(false), 180);
    showToast(`Remise appliquée: ${cappedValue.toFixed(0)} MAD`);
  };

  const handleClearDiscount = () => {
    clearDiscount();
    setCustomDiscountInput('');
    setDiscountError('');
    showToast('Remise supprimée');
  };

  const formattedDiscountLabel = discountType === 'percentage' ? `${discountValue}%` : discountType === 'fixed' ? `${discountValue.toFixed(0)} MAD` : 'Aucune';
  const htAfterRemise = Math.max(subtotal - discountAmount, 0);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex h-screen w-full max-w-md flex-col overflow-hidden border-l border-zinc-800 bg-zinc-950/95 shadow-2xl shadow-black/50 backdrop-blur-xl">
      <div className="flex flex-shrink-0 items-center justify-between gap-3 border-b border-zinc-800 px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-white">Votre panier</h2>
          <p className="text-xs text-zinc-400">{cartCount} article{cartCount > 1 ? 's' : ''}</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-full border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-800 hover:text-white">
          Fermer
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-5">
        {cartItems.length === 0 ? (
          <div className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 text-center text-zinc-400">
            <p className="text-lg font-semibold text-white">Votre panier est vide</p>
            <p className="mt-2 text-sm">Ajoutez des produits pour commencer</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {cartItems.map((item) => (
              <div key={item.id} className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-800 bg-zinc-800/60 sm:h-20 sm:w-20">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-400">GA</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 break-words text-sm font-semibold text-white sm:text-base" title={item.name}>{item.name}</p>
                        <p className="mt-1 break-words text-xs text-zinc-400">{item.reference}</p>
                      </div>
                      <button type="button" onClick={() => removeFromCart(item.id)} className="flex h-8 flex-shrink-0 items-center justify-center rounded-full border border-red-500/30 px-2.5 text-[11px] font-medium text-red-400 transition hover:bg-red-500/10 sm:text-xs">
                        Supprimer
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-950/60 p-1">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-white transition hover:bg-zinc-700"
                        >
                          -
                        </button>
                        <span className="min-w-6 text-center text-sm font-semibold text-white">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-white transition hover:bg-zinc-700"
                        >
                          +
                        </button>
                      </div>
                      <div className="w-24 text-right sm:w-28">
                        <div className="flex flex-col items-end gap-1">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Prix</p>
                          <div className="flex flex-wrap items-center justify-end gap-1">
                            <p className={`text-sm font-semibold whitespace-nowrap ${item.price_modified ? 'text-amber-300' : 'text-white'}`} aria-label={`Prix ${item.price.toLocaleString('fr-FR')} Moroccan Dirhams`}>
                              {item.price.toLocaleString('fr-FR')} MAD
                            </p>
                            {item.price_modified ? (
                              <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">Modifié</span>
                            ) : null}
                          </div>
                          {canEditPrices ? (
                            <button
                              type="button"
                              aria-label="Modifier le prix"
                              title="Modifier le prix / تعديل الثمن"
                              onClick={() => setEditingItem(item)}
                              className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                                item.price_modified ? 'bg-amber-500/25 text-amber-300 ring-1 ring-amber-400/30' : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                              }`}
                            >
                              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 20h9" />
                                <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
                              </svg>
                            </button>
                          ) : null}
                        </div>
                        <p className="mt-1 text-[11px] text-zinc-400" aria-label={`Total ligne ${item.name}: ${(item.price * item.quantity).toLocaleString('fr-FR')} Moroccan Dirhams`}>Total: {(item.price * item.quantity).toLocaleString('fr-FR')} MAD</p>
                        {item.stock <= 0 ? (
                          <p className="mt-1 text-[11px] font-semibold text-rose-400">⚠️ Rupture</p>
                        ) : null}
                        {item.price_modified ? (
                          <div className="mt-1 flex flex-wrap items-center justify-end gap-1 text-[10px] text-zinc-400">
                            <span className="line-through">{(item.original_price ?? item.price).toLocaleString('fr-FR')} MAD</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {cartItems.length > 0 ? (
        <div className="flex-shrink-0 border-t border-zinc-800 bg-zinc-900/80 px-4 py-4 sm:px-5">
          <div className="flex items-center justify-between text-xs">
            <span>Sous-total</span>
            <span aria-label={`Sous-total ${subtotal.toLocaleString('fr-FR')} Moroccan Dirhams`}>{subtotal.toLocaleString('fr-FR')} MAD</span>
          </div>
          {discountAmount > 0 ? (
            <div className="mt-2 flex items-center justify-between text-xs text-emerald-400">
              <span>Remise ({formattedDiscountLabel})</span>
              <span aria-label={`Remise ${discountAmount.toLocaleString('fr-FR')} Moroccan Dirhams`}>-{discountAmount.toLocaleString('fr-FR')} MAD</span>
            </div>
          ) : null}
          {manualDiscountTotal > 0 ? (
            <div className="mt-2 flex items-center justify-between text-xs text-amber-400">
              <span>Réduction produit</span>
              <span>-{manualDiscountTotal.toLocaleString('fr-FR')} MAD</span>
            </div>
          ) : null}
          <div className="mt-2 flex items-center justify-between text-xs">
            <span>Montant HT</span>
            <span>{htAfterRemise.toLocaleString('fr-FR')} MAD</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span>TVA (20%)</span>
            <span>{taxAmount.toLocaleString('fr-FR')} MAD</span>
          </div>
          <div className="mt-3 border-t border-zinc-800 pt-3" />
          <div className="flex items-center justify-between text-base font-semibold text-white">
            <span>Total TTC</span>
            <span aria-label={`Total: ${totalTTC.toLocaleString('fr-FR')} Moroccan Dirhams`}>{totalTTC.toLocaleString('fr-FR')} MAD</span>
          </div>
          <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-950/70 p-2">
            <p className="text-[10px] uppercase tracking-[0.24em] text-zinc-500">Remise</p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {presetDiscounts.map((value) => (
                <button key={value} type="button" onClick={() => handlePresetDiscount(value)} className={`min-h-10 rounded-full px-2.5 py-2 text-sm font-medium transition ${discountType === 'percentage' && discountValue === value ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}>
                  {value}%
                </button>
              ))}
            </div>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                value={customDiscountInput}
                onChange={(event) => {
                  setCustomDiscountInput(event.target.value);
                  if (discountError) {
                    setDiscountError('');
                  }
                }}
                placeholder="5% / 5,5% / 50 MAD"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-2.5 py-2 text-sm text-white outline-none"
              />
              <button
                type="button"
                onClick={handleApplyCustomDiscount}
                disabled={!isDiscountInputValid || isApplyingDiscount}
                className="w-full rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400 sm:w-auto"
              >
                {isApplyingDiscount ? 'Application…' : 'Appliquer'}
              </button>
            </div>
            {discountError ? <p className="mt-2 text-[11px] text-rose-400">{discountError}</p> : null}
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400">
              <span>{discountType === 'none' ? 'Aucune remise' : `Remise active: ${formattedDiscountLabel}`}</span>
              {discountType === 'none' ? null : (
                <button type="button" onClick={handleClearDiscount} className="text-red-400 transition hover:text-red-300">
                  Effacer
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <div className="sticky bottom-0 z-10 mt-3 flex flex-col gap-2 border-t border-zinc-800 bg-zinc-950/95 pt-3">
        <button
          type="button"
          onClick={onOpenInvoice}
          disabled={cartItems.length === 0}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-red-600 px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:border-zinc-700 disabled:text-zinc-500 disabled:hover:bg-transparent"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2" aria-hidden="true">
            <path d="M8 3h8" />
            <path d="M7 7h10" />
            <path d="M6 8h12a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2v3H8v-3H6a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2Z" />
            <path d="M8 15h8" />
          </svg>
          <span>🖨️ طباعة الفاتورة / Imprimer la facture</span>
        </button>
        <button type="button" disabled={cartItems.length === 0} className="w-full rounded-2xl bg-red-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400" aria-label={`Commander pour ${totalTTC.toLocaleString('fr-FR')} Moroccan Dirhams`}>
          Commander • {totalTTC.toLocaleString('fr-FR')} MAD
        </button>
      </div>

      {editingItem ? (
        <EditCartItemPriceModal
          item={editingItem}
          isOpen={Boolean(editingItem)}
          canEditProductPrices={canEditPrices}
          onClose={() => setEditingItem(null)}
        />
      ) : null}
    </div>
  );
}
