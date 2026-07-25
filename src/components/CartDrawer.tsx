import { useCart } from '../context/CartContext';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  onOpenInvoice: () => void;
}

export default function CartDrawer({ open, onClose, onOpenInvoice }: CartDrawerProps) {
  const { cartItems, cartCount, total, removeFromCart, updateQuantity } = useCart();

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
              <div className="mt-4 flex items-center justify-between">
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
                <p className="text-sm font-semibold text-white">{(item.price * item.quantity).toLocaleString('fr-FR')} MAD</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
        <div className="flex items-center justify-between text-sm text-zinc-400">
          <span>Total</span>
          <span className="font-semibold text-white">{total.toLocaleString('fr-FR')} MAD</span>
        </div>
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
    </div>
  );
}
