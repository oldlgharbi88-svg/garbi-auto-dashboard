import { useMemo, useState } from 'react';
import EditCartItemPriceModal from './EditCartItemPriceModal';
import { useCart, type CartItem } from '../context/CartContext';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  onOpenInvoice: () => void;
  canEditPrices?: boolean;
}

export default function CartDrawer({ open, onClose, onOpenInvoice, canEditPrices = false }: CartDrawerProps) {
  const { cartItems, cartCount, total, removeFromCart, updateQuantity } = useCart();
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);

  const subtotal = useMemo(() => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0), [cartItems]);
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
  const grandTotal = subtotal - manualDiscountTotal;

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md border-l border-zinc-800 bg-zinc-950/95 p-6 shadow-2xl shadow-black/50 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Votre panier</h2>
          <p className="text-sm text-zinc-400">{cartCount} article{cartCount > 1 ? 's' : ''}</p>
        </div>
        <button type="button" onClick={onClose} className="text-sm text-zinc-400">
          Fermer
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {cartItems.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 text-sm text-zinc-400">
            Le panier est vide pour le moment.
          </div>
        ) : (
          cartItems.map((item) => (
            <div key={item.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">{item.name}</p>
                  <p className="text-sm text-zinc-400">{item.reference}</p>
                </div>
                <button type="button" onClick={() => removeFromCart(item.id)} className="text-sm text-red-400">
                  Supprimer
                </button>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 rounded-full border border-zinc-700 px-2 py-1">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="h-7 w-7 rounded-full bg-zinc-800 text-white"
                  >
                    -
                  </button>
                  <span className="min-w-6 text-center text-sm text-white">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="h-7 w-7 rounded-full bg-zinc-800 text-white"
                  >
                    +
                  </button>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Prix unitaire</p>
                      <p className="text-sm font-semibold text-white">{item.price.toLocaleString('fr-FR')} MAD</p>
                    </div>
                    {canEditPrices ? (
                      <button
                        type="button"
                        title="Modifier le prix / تعديل الثمن"
                        onClick={() => setEditingItem(item)}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 transition hover:bg-amber-500 hover:text-white"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
                        </svg>
                      </button>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">Total: {(item.price * item.quantity).toLocaleString('fr-FR')} MAD</p>
                  {item.price_modified ? (
                    <div className="mt-1 flex flex-wrap items-center justify-end gap-2 text-[11px] text-zinc-400">
                      <span className="rounded-full bg-amber-500/20 px-2 py-0.5 font-medium text-amber-300">✏️</span>
                      <span className="line-through">{(item.original_price ?? item.price).toLocaleString('fr-FR')} MAD</span>
                      <span className="text-emerald-400">
                        {((item.price - (item.original_price ?? item.price)) / ((item.original_price ?? item.price) || 1) * 100).toFixed(0)}%
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 text-sm text-zinc-300">
        <div className="flex items-center justify-between">
          <span>Sous-total</span>
          <span>{subtotal.toLocaleString('fr-FR')} MAD</span>
        </div>
        {manualDiscountTotal > 0 ? (
          <div className="mt-2 flex items-center justify-between text-emerald-400">
            <span>Remises manuelles</span>
            <span>-{manualDiscountTotal.toLocaleString('fr-FR')} MAD</span>
          </div>
        ) : null}
        <div className="mt-2 flex items-center justify-between">
          <span>Livraison</span>
          <span>À calculer</span>
        </div>
        <div className="mt-3 border-t border-zinc-800 pt-3" />
        <div className="flex items-center justify-between text-base font-semibold text-white">
          <span>Total</span>
          <span>{grandTotal.toLocaleString('fr-FR')} MAD</span>
        </div>
        {manualDiscountTotal > 0 ? (
          <div className="mt-2 text-xs text-emerald-400">Total économisé: {manualDiscountTotal.toLocaleString('fr-FR')} MAD</div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <button
          type="button"
          onClick={onOpenInvoice}
          disabled={cartItems.length === 0}
          className="flex items-center justify-center gap-2 rounded-2xl border-2 border-red-600 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:border-zinc-700 disabled:text-zinc-500 disabled:hover:bg-transparent"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2" aria-hidden="true">
            <path d="M8 3h8" />
            <path d="M7 7h10" />
            <path d="M6 8h12a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2v3H8v-3H6a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2Z" />
            <path d="M8 15h8" />
          </svg>
          <span>🖨️ طباعة الفاتورة / Imprimer la facture</span>
        </button>
        <button type="button" className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white">
          Commander
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
