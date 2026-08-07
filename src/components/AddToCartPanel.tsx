import { useEffect, useMemo, useRef, useState } from 'react';
import QuantityGrid from './QuantityGrid';

export interface AddToCartPanelItem {
  id: number | string;
  name: string;
  reference: string;
  sellingprice: number;
  quantity: number;
  image_url?: string | null;
  compatible_cars: string;
  category?: string | null;
}

interface AddToCartPanelProps {
  open: boolean;
  item: AddToCartPanelItem | null;
  onClose: () => void;
  onAddToCart: (item: AddToCartPanelItem, quantity: number) => void;
}

export default function AddToCartPanel({ open, item, onClose, onAddToCart }: AddToCartPanelProps) {
  const [quantity, setQuantity] = useState(1);
  const [customQuantity, setCustomQuantity] = useState('');
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousActive = document.activeElement as HTMLElement | null;
    if (closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
      if (previousActive) {
        previousActive.focus();
      }
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setQuantity(1);
      setCustomQuantity('');
    }
  }, [open, item]);

  const normalizedQuantity = useMemo(() => {
    if (customQuantity.trim().length === 0) {
      return quantity;
    }

    const parsed = Number.parseInt(customQuantity, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : quantity;
  }, [customQuantity, quantity]);

  const currentQuantity = item ? normalizedQuantity : 1;
  const totalPrice = item ? item.sellingprice * currentQuantity : 0;
  const outOfStock = item ? currentQuantity > item.quantity : false;

  if (!open || !item) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        className="relative ml-auto h-full w-full bg-zinc-950 text-zinc-100 shadow-2xl shadow-black/50 sm:w-[420px]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-to-cart-title"
      >
        <div className="flex h-full flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-4 sm:px-5">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-red-400">Ajouter au panier</p>
              <h2 id="add-to-cart-title" className="mt-2 text-xl font-semibold text-white">
                {item.name}
              </h2>
            </div>
            <button
              type="button"
              ref={closeButtonRef}
              onClick={onClose}
              aria-label="Fermer le panneau d'ajout au panier"
              className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
            >
              X
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
            <div className="space-y-6">
              <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/70">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="h-80 w-full object-cover sm:h-[300px]" />
                ) : (
                  <div className="flex h-80 items-center justify-center bg-zinc-900 text-zinc-500 sm:h-[300px]">Image indisponible</div>
                )}
              </div>

              <div className="grid gap-2 rounded-3xl border border-zinc-800 bg-zinc-950/80 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Référence</p>
                    <p className="mt-1 text-base font-semibold text-white">{item.reference}</p>
                  </div>
                  <div className="rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-semibold text-emerald-300">
                    En stock • {item.quantity}
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Prix</p>
                  <p className="mt-2 text-3xl font-bold text-white">{item.sellingprice.toLocaleString('fr-FR')} MAD</p>
                </div>
              </div>

              <section className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-4">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white">Combien en voulez-vous?</p>
                    <p className="mt-1 text-xs text-zinc-500">Sélectionnez un nombre ou tapez une quantité personnalisée.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setQuantity(1);
                      setCustomQuantity('');
                    }}
                    className="rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:border-red-500 hover:text-white"
                  >
                    Reset
                  </button>
                </div>

                <div className="mb-4 grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-3xl border border-zinc-800 bg-zinc-900/80 px-3 py-3">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, currentQuantity - 1))}
                    className="h-12 w-12 rounded-2xl bg-zinc-800 text-xl font-semibold text-white transition hover:bg-zinc-700"
                    aria-label="Diminuer la quantité"
                  >
                    −
                  </button>
                  <div className="flex min-h-[44px] flex-1 items-center justify-center rounded-2xl bg-zinc-950 text-2xl font-semibold text-white">
                    {currentQuantity}
                  </div>
                  <button
                    type="button"
                    onClick={() => setQuantity(currentQuantity + 1)}
                    className="h-12 w-12 rounded-2xl bg-zinc-800 text-xl font-semibold text-white transition hover:bg-zinc-700"
                    aria-label="Augmenter la quantité"
                  >
                    +
                  </button>
                </div>

                <div className="space-y-3">
                  <QuantityGrid quantity={currentQuantity} setQuantity={setQuantity} maxQuantity={80} />
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                    <label className="space-y-2 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3 text-sm text-zinc-300">
                      <span>Quantité personnalisée</span>
                      <input
                        type="number"
                        min={1}
                        value={customQuantity}
                        onChange={(event) => {
                          const value = event.target.value;
                          setCustomQuantity(value);
                          const parsed = Number.parseInt(value, 10);
                          if (Number.isFinite(parsed) && parsed > 0) {
                            setQuantity(parsed);
                          }
                        }}
                        placeholder="88"
                        className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-3 text-white outline-none focus:border-red-500"
                      />
                    </label>
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3 text-right text-sm text-zinc-300">
                      <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Prix total</p>
                      <p className="mt-2 text-xl font-semibold text-white">{totalPrice.toLocaleString('fr-FR')} MAD</p>
                    </div>
                  </div>
                </div>

                {outOfStock ? (
                  <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                    Quantité demandée supérieure au stock disponible.
                  </p>
                ) : null}
              </section>

              <section className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-4 text-sm text-zinc-300">
                <p className="font-semibold text-white">Détails du produit</p>
                <div className="mt-4 space-y-2">
                  <p>{item.compatible_cars || 'Compatibilité non spécifiée'}</p>
                  <p>{item.category ? `Catégorie: ${item.category}` : 'Catégorie non renseignée'}</p>
                </div>
              </section>
            </div>
          </div>

          <div className="sticky bottom-0 z-20 border-t border-zinc-800 bg-zinc-950/95 px-4 py-4 sm:px-5">
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => onAddToCart(item, currentQuantity)}
                disabled={outOfStock}
                className="w-full rounded-3xl bg-red-600 px-4 py-4 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-zinc-700"
              >
                Ajouter {currentQuantity} article{currentQuantity > 1 ? 's' : ''} au panier • {totalPrice.toLocaleString('fr-FR')} MAD
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-3xl border border-zinc-700 bg-zinc-900/80 px-4 py-4 text-sm font-semibold text-zinc-200 transition hover:border-red-500 hover:text-white"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
