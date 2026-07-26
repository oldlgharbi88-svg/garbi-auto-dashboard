import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';

interface CatalogItem {
  id: number | string;
  name: string;
  reference: string;
  compatible_cars: string;
  sellingprice: number;
  quantity: number;
  image_url?: string | null;
}

const categoryOptions = ['BMW', 'Mercedes', 'Audi', 'Peugeot', 'Renault', 'Volkswagen'];

interface PublicCatalogProps {
  canEditPrices?: boolean;
}

export default function PublicCatalog({ canEditPrices = false }: PublicCatalogProps) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  const [priceEditTarget, setPriceEditTarget] = useState<CatalogItem | null>(null);
  const [newPriceInput, setNewPriceInput] = useState('');
  const [priceError, setPriceError] = useState('');
  const [isSavingPrice, setIsSavingPrice] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    const loadCatalog = async () => {
      const { data, error } = await supabase.from('inventory').select('*').order('id', { ascending: false });
      if (!error) {
        setItems((data ?? []) as CatalogItem[]);
      }
      setLoading(false);
    };

    void loadCatalog();
  }, []);

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        item.name.toLowerCase().includes(normalizedSearch) ||
        item.reference.toLowerCase().includes(normalizedSearch) ||
        item.compatible_cars.toLowerCase().includes(normalizedSearch);

      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.some((category) => item.compatible_cars.toLowerCase().includes(category.toLowerCase()));

      return matchesSearch && matchesCategory;
    });
  }, [items, search, selectedCategories]);

  useEffect(() => {
    if (!statusMessage) {
      return undefined;
    }

    const timerId = window.setTimeout(() => setStatusMessage(null), 2400);
    return () => window.clearTimeout(timerId);
  }, [statusMessage]);

  const toggleCategory = (category: string) => {
    setSelectedCategories((current) =>
      current.includes(category) ? current.filter((entry) => entry !== category) : [...current, category]
    );
  };

  const openPriceEditor = (item: CatalogItem) => {
    setPriceEditTarget(item);
    setNewPriceInput(String(item.sellingprice));
    setPriceError('');
  };

  const closePriceEditor = () => {
    setPriceEditTarget(null);
    setNewPriceInput('');
    setPriceError('');
    setIsSavingPrice(false);
  };

  const handleSavePrice = async (event: FormEvent) => {
    event.preventDefault();

    if (!priceEditTarget) {
      return;
    }

    const nextPrice = Number.parseFloat(newPriceInput);
    if (!Number.isFinite(nextPrice) || nextPrice <= 0) {
      setPriceError('Please enter a positive price.');
      return;
    }

    setIsSavingPrice(true);
    setPriceError('');

    const { error } = await supabase
      .from('inventory')
      .update({ sellingprice: nextPrice })
      .eq('id', priceEditTarget.id)
      .select()
      .single();

    if (error) {
      setPriceError('Unable to update the price right now.');
      setIsSavingPrice(false);
      return;
    }

    setItems((current) =>
      current.map((item) => (item.id === priceEditTarget.id ? { ...item, sellingprice: nextPrice } : item))
    );
    setSelectedItem((current) => (current && current.id === priceEditTarget.id ? { ...current, sellingprice: nextPrice } : current));
    setStatusMessage(`Price updated for ${priceEditTarget.name}.`);
    closePriceEditor();
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <section className="relative overflow-hidden border-b border-red-500/30 bg-[radial-gradient(circle_at_top_left,_rgba(255,0,0,0.2),_transparent_35%),linear-gradient(135deg,_#09090b,_#111827)] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-8">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.45em] text-red-500">Garbi Auto Logistique</p>
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
              Pièces auto aux meilleurs prix
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-zinc-300 sm:text-xl">
              Découvrez des pièces détachées neuves et d’occasion pour toutes les marques, livrées rapidement.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-4 shadow-2xl shadow-black/30 backdrop-blur-xl">
            <div className="flex flex-col gap-4 lg:flex-row">
              <label className="flex flex-1 items-center gap-3 rounded-2xl border border-zinc-700 bg-zinc-900/80 px-4 py-3">
                <span className="text-red-500">🔎</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Rechercher une pièce, une référence ou une voiture"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-500"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                {categoryOptions.map((category) => {
                  const active = selectedCategories.includes(category);
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                        active ? 'border-red-500 bg-red-600 text-white' : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-red-400'
                      }`}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">Catalogue public</h2>
            <p className="text-sm text-zinc-400">{filteredItems.length} pièces affichées</p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-10 text-center text-zinc-400">
            Chargement du catalogue…
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-10 text-center text-zinc-400">
            Aucune pièce ne correspond à votre recherche.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredItems.map((item) => {
              const inStock = item.quantity > 0;
              return (
                <article
                  key={item.id}
                  className="group overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/80 shadow-lg shadow-black/20 transition hover:-translate-y-1"
                >
                  <div className="relative aspect-square overflow-hidden bg-zinc-800">
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedItem(item)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setSelectedItem(item);
                        }
                      }}
                      className="h-full w-full cursor-pointer"
                    >
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-zinc-800 text-zinc-500">Image indisponible</div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                        <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white">
                          Plus de détails
                        </span>
                      </div>
                    </div>

                    {canEditPrices ? (
                      <button
                        type="button"
                        aria-label={`Edit price for ${item.name}`}
                        title={`Edit price for ${item.name}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          openPriceEditor(item);
                        }}
                        className="absolute right-3 top-3 rounded-full border border-sky-400/40 bg-sky-500/20 p-2 text-sky-200 backdrop-blur transition hover:-translate-y-0.5 hover:bg-sky-500/30 hover:text-white"
                      >
                        <span className="text-sm">✎</span>
                      </button>
                    ) : null}
                  </div>

                  <div className="space-y-4 p-5">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{item.name}</h3>
                      <p className="mt-1 text-sm text-zinc-400">{item.reference}</p>
                    </div>

                    <p className="text-sm text-zinc-500">{item.compatible_cars || 'Voitures compatibles'}</p>

                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="text-sm text-zinc-400">Prix</p>
                        <p className="text-2xl font-bold text-white">{item.sellingprice.toLocaleString('fr-FR')} MAD</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-3 py-2 text-sm">
                      {inStock ? (
                        <p className="font-medium text-emerald-400">✓ En stock • {item.quantity} disponibles</p>
                      ) : (
                        <p className="font-medium text-rose-400">✗ Rupture</p>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={!inStock}
                      onClick={() =>
                        addToCart({
                          id: String(item.id),
                          name: item.name,
                          reference: item.reference,
                          price: item.sellingprice,
                          image_url: item.image_url ?? null,
                          stock: item.quantity
                        })
                      }
                      className={`w-full rounded-2xl px-4 py-3 font-semibold transition ${
                        inStock ? 'bg-red-600 text-white hover:bg-red-700' : 'cursor-not-allowed bg-zinc-700 text-zinc-400'
                      }`}
                    >
                      {inStock ? 'Add to cart' : 'Rupture'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {priceEditTarget ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-sm">
          <div className="modal-fade-in w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl shadow-black/60">
            <div className="mb-5">
              <p className="text-xs uppercase tracking-[0.35em] text-sky-400">Edit price</p>
              <h3 className="mt-2 text-xl font-semibold text-white">{priceEditTarget.name}</h3>
              <p className="mt-1 text-sm text-zinc-400">{priceEditTarget.reference}</p>
            </div>

            <form onSubmit={handleSavePrice} className="space-y-4">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
                <p className="text-sm text-zinc-400">Current price</p>
                <div className="mt-2 flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2 text-white">
                  <span>{priceEditTarget.sellingprice.toLocaleString('fr-FR')} MAD</span>
                  <span className="rounded-full bg-sky-500/15 px-2.5 py-1 text-xs font-semibold text-sky-300">EUR</span>
                </div>
              </div>

              <div>
                <label htmlFor="new-price" className="mb-2 block text-sm font-medium text-zinc-200">
                  New price
                </label>
                <div className="flex items-center gap-3 rounded-2xl border border-zinc-700 bg-zinc-950/70 px-4 py-3">
                  <input
                    id="new-price"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0.01"
                    value={newPriceInput}
                    onChange={(event) => {
                      setNewPriceInput(event.target.value);
                      if (priceError) {
                        setPriceError('');
                      }
                    }}
                    className="w-full bg-transparent text-white outline-none"
                    placeholder="0.00"
                  />
                  <span className="text-sm font-semibold text-zinc-400">EUR</span>
                </div>
                {priceError ? <p className="mt-2 text-sm text-rose-400">{priceError}</p> : null}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closePriceEditor}
                  className="rounded-2xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPrice}
                  className="rounded-2xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSavingPrice ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {selectedItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6">
          <div className="relative w-full max-w-2xl rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl shadow-black/50">
            <button
              type="button"
              onClick={() => setSelectedItem(null)}
              className="absolute right-4 top-4 rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-sm text-zinc-300"
            >
              Fermer
            </button>

            <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
              <div className="overflow-hidden rounded-2xl bg-zinc-800">
                {selectedItem.image_url ? (
                  <img src={selectedItem.image_url} alt={selectedItem.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-72 items-center justify-center text-zinc-500">Image indisponible</div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-500">Pièce détachée</p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">{selectedItem.name}</h3>
                  <p className="mt-2 text-sm text-zinc-400">Référence: {selectedItem.reference}</p>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 text-sm text-zinc-300">
                  <p className="font-semibold text-white">Voitures compatibles</p>
                  <p className="mt-2">{selectedItem.compatible_cars || 'Non spécifié'}</p>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
                  <p className="text-sm text-zinc-400">Prix</p>
                  <p className="mt-2 text-3xl font-bold text-white">{selectedItem.sellingprice.toLocaleString('fr-FR')} MAD</p>
                </div>

                <button
                  type="button"
                  disabled={selectedItem.quantity <= 0}
                  onClick={() => {
                    addToCart({
                      id: String(selectedItem.id),
                      name: selectedItem.name,
                      reference: selectedItem.reference,
                      price: selectedItem.sellingprice,
                      image_url: selectedItem.image_url ?? null,
                      stock: selectedItem.quantity
                    });
                    setSelectedItem(null);
                  }}
                  className={`w-full rounded-2xl px-4 py-3 font-semibold transition ${
                    selectedItem.quantity > 0 ? 'bg-red-600 text-white hover:bg-red-700' : 'cursor-not-allowed bg-zinc-700 text-zinc-400'
                  }`}
                >
                  {selectedItem.quantity > 0 ? 'Ajouter au panier' : 'Rupture'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {statusMessage ? (
        <div className="fixed bottom-4 right-4 z-[70] rounded-full border border-emerald-500/30 bg-emerald-500/15 px-4 py-3 text-sm font-medium text-emerald-300 shadow-lg shadow-black/30">
          {statusMessage}
        </div>
      ) : null}
    </div>
  );
}
