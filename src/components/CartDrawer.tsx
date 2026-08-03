import { useMemo, useState } from 'react';
import EditCartItemPriceModal from './EditCartItemPriceModal';
import { useCart, type CartItem } from '../context/CartContext';

const presetDiscounts = [5, 10, 15, 20];

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  onOpenInvoice: () => void;
  canEditPrices?: boolean;
}

export default function CartDrawer({ open, onClose, onOpenInvoice, canEditPrices = false }: CartDrawerProps) {
  const { cartItems, cartCount, subtotal, discountType, discountValue, discountAmount, taxAmount, totalTTC, removeFromCart, updateQuantity, setDiscount, clearDiscount } = useCart();
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  const [customDiscountInput, setCustomDiscountInput] = useState('');

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

  const handlePresetDiscount = (value: number) => {
    setDiscount('percentage', value);
    setCustomDiscountInput('');
  };

  const handleApplyCustomDiscount = () => {
    const parsed = Number(customDiscountInput.replace(/,/g, '.'));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return;
    }

    const isPercentage = customDiscountInput.includes('%');
    const normalizedValue = Number(customDiscountInput.replace('%', '').replace(/,/g, '.'));

    if (isPercentage) {
      setDiscount('percentage', normalizedValue);
    } else {
      setDiscount('fixed', normalizedValue);
    }
  };

  const handleClearDiscount = () => {
    clearDiscount();
    setCustomDiscountInput('');
  };

  const formattedDiscountLabel = discountType === 'percentage' ? `${discountValue}%` : discountType === 'fixed' ? `${discountValue.toFixed(0)} MAD` : 'Aucune';
  const htAfterRemise = Math.max(subtotal - discountAmount, 0);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-zinc-800 bg-zinc-950/95 p-4 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Votre panier</h2>
          <p className="text-xs text-zinc-400">{cartCount} article{cartCount > 1 ? 's' : ''}</p>
        </div>
        <button type="button" onClick={onClose} className="text-sm text-zinc-400">
          Fermer
        </button>
      </div>

      <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
        {cartItems.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 text-sm text-zinc-400">
            Le panier est vide pour le moment.
          </div>
        ) : (
          cartItems.map((item) => (
            <div key={item.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{item.name}</p>
                  <p className="truncate text-xs text-zinc-400">{item.reference}</p>
                </div>
                <button type="button" onClick={() => removeFromCart(item.id)} className="shrink-0 text-xs text-red-400">
                  Supprimer
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 rounded-full border border-zinc-700 px-1.5 py-1">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="h-6 w-6 rounded-full bg-zinc-800 text-sm text-white"
                  >
                    -
                  </button>
                  <span className="min-w-5 text-center text-xs text-white">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="h-6 w-6 rounded-full bg-zinc-800 text-sm text-white"
                  >
                    +
                  </button>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Prix</p>
                      <div className="flex flex-wrap items-center justify-end gap-1">
                        <p className={`text-sm font-semibold ${item.price_modified ? 'text-amber-300' : 'text-white'}`} aria-label={`Prix ${item.price.toLocaleString('fr-FR')} Moroccan Dirhams`}>
                          {item.price.toLocaleString('fr-FR')} MAD
                        </p>
                        {item.price_modified ? (
                          <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">Modifié</span>
                        ) : null}
                      </div>
                    </div>
                    {canEditPrices ? (
                      <button
                        type="button"
                        aria-label="Modifier le prix"
                        title="Modifier le prix / تعديل الثمن"
                        onClick={() => setEditingItem(item)}
                        className={`flex h-9 w-9 flex-none items-center justify-center rounded-full transition-colors sm:h-10 sm:w-10 ${
                          item.price_modified ? 'bg-amber-500/25 text-amber-300 ring-1 ring-amber-400/30' : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                        }`}
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4 sm:h-4.5 sm:w-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
                        </svg>
                      </button>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-[11px] text-zinc-400" aria-label={`Total ligne ${item.name}: ${(item.price * item.quantity).toLocaleString('fr-FR')} Moroccan Dirhams`}>Total: {(item.price * item.quantity).toLocaleString('fr-FR')} MAD</p>
                  {item.stock <= 0 ? (
                    <p className="mt-0.5 text-[11px] font-semibold text-rose-400">⚠️ Rupture</p>
                  ) : null}
                  {item.price_modified ? (
                    <div className="mt-0.5 flex flex-wrap items-center justify-end gap-1 text-[10px] text-zinc-400">
                      <span className="line-through">{(item.original_price ?? item.price).toLocaleString('fr-FR')} MAD</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {cartItems.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3 text-sm text-zinc-300">
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
            <div className="mt-2 flex flex-wrap gap-2">
              {presetDiscounts.map((value) => (
                <button key={value} type="button" onClick={() => handlePresetDiscount(value)} className={`rounded-full px-2.5 py-1 text-xs font-medium ${discountType === 'percentage' && discountValue === value ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-300'}`}>
                  {value}%
                </button>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <input
                value={customDiscountInput}
                onChange={(event) => setCustomDiscountInput(event.target.value)}
                placeholder="5% ou 50"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-2.5 py-2 text-sm text-white outline-none"
              />
              <button type="button" onClick={handleApplyCustomDiscount} className="rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white">
                Appliquer
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400">
              <span>{discountType === 'none' ? 'Aucune remise' : `Remise active: ${formattedDiscountLabel}`}</span>
              {discountType === 'none' ? null : (
                <button type="button" onClick={handleClearDiscount} className="text-red-400">
                  Effacer
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-3 flex flex-col gap-2">
        <button
          type="button"
          onClick={onOpenInvoice}
          disabled={cartItems.length === 0}
          className="flex items-center justify-center gap-2 rounded-2xl border-2 border-red-600 px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:border-zinc-700 disabled:text-zinc-500 disabled:hover:bg-transparent"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2" aria-hidden="true">
            <path d="M8 3h8" />
            <path d="M7 7h10" />
            <path d="M6 8h12a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2v3H8v-3H6a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2Z" />
            <path d="M8 15h8" />
          </svg>
          <span>🖨️ طباعة الفاتورة / Imprimer la facture</span>
        </button>
        <button type="button" className="rounded-2xl bg-red-600 px-3 py-2.5 text-sm font-semibold text-white" aria-label={`Commander pour ${totalTTC.toLocaleString('fr-FR')} Moroccan Dirhams`}>
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
