import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';
import { company } from '../config/company';
import PasswordGate from '../components/PasswordGate';
import AddToCartPanel, { type AddToCartPanelItem } from '../components/AddToCartPanel';
import CartDrawer from '../components/CartDrawer';
import ProductCard, { type CatalogCardItem } from '../components/ProductCard';

interface CatalogItem {
  id: number | string;
  name: string;
  reference: string;
  compatible_cars: string;
  sellingprice: number;
  quantity: number;
  image_url?: string | null;
  category?: string | null;
}

const brandOptions = [
  { value: 'Dacia', icon: '🚗', color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' },
  { value: 'Renault', icon: '🚙', color: 'bg-red-500/15 text-red-300 border-red-500/30' },
  { value: 'Peugeot', icon: '🚘', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  { value: 'Citroën', icon: '🚗', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  { value: 'Volkswagen', icon: '🚐', color: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
  { value: 'Ford', icon: '🚚', color: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
  { value: 'Opel', icon: '🚗', color: 'bg-purple-500/15 text-purple-300 border-purple-500/30' },
  { value: 'Fiat', icon: '🚕', color: 'bg-pink-500/15 text-pink-300 border-pink-500/30' },
  { value: 'Toyota', icon: '🚙', color: 'bg-orange-500/15 text-orange-300 border-orange-500/30' },
  { value: 'Hyundai', icon: '🚗', color: 'bg-lime-500/15 text-lime-300 border-lime-500/30' },
  { value: 'Kia', icon: '🚘', color: 'bg-violet-500/15 text-violet-300 border-violet-500/30' },
  { value: 'Nissan', icon: '🚙', color: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' },
  { value: 'Suzuki', icon: '🚗', color: 'bg-teal-500/15 text-teal-300 border-teal-500/30' },
  { value: 'Mitsubishi', icon: '🚗', color: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30' },
  { value: 'Seat', icon: '🚗', color: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30' },
  { value: 'Skoda', icon: '🚐', color: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
  { value: 'BMW', icon: '🏎️', color: 'bg-zinc-500/15 text-zinc-200 border-zinc-500/30' },
  { value: 'Mercedes', icon: '🚘', color: 'bg-stone-500/15 text-stone-200 border-stone-500/30' },
  { value: 'Audi', icon: '🚗', color: 'bg-slate-500/15 text-slate-200 border-slate-500/30' },
  { value: 'Chery', icon: '🚙', color: 'bg-cyan-600/15 text-cyan-200 border-cyan-600/30' },
  { value: 'Geely', icon: '🚗', color: 'bg-emerald-600/15 text-emerald-200 border-emerald-600/30' },
  { value: 'JAC', icon: '🚐', color: 'bg-amber-600/15 text-amber-200 border-amber-600/30' },
  { value: 'MG', icon: '🚗', color: 'bg-red-600/15 text-red-200 border-red-600/30' }
];

const categoryFilterOptions = [
  { value: 'all', label: 'Toutes les catégories', icon: '🧰' },
  { value: 'amortisseurs', label: 'Amortisseurs', icon: '🛞' },
  { value: 'freins', label: 'Freins', icon: '🛑' },
  { value: 'filtres', label: 'Filtres', icon: '🪟' },
  { value: 'pneus', label: 'Pneus', icon: '⛱️' },
  { value: 'batteries', label: 'Batteries', icon: '🔋' },
  { value: 'huile_moteur', label: 'Huile moteur', icon: '🛢️' },
  { value: 'courroies', label: 'Courroies', icon: '🔗' },
  { value: 'bougies', label: 'Bougies', icon: '⚡' },
  { value: 'phares', label: 'Phares', icon: '💡' },
  { value: 'embrayage', label: 'Embrayage', icon: '⚙️' }
];

const inferCategory = (item: CatalogItem): string => {
  const haystack = `${item.category ?? ''} ${item.name} ${item.reference} ${item.compatible_cars}`.toLowerCase();

  if (/amort|suspens/i.test(haystack)) {
    return 'amortisseurs';
  }
  if (/frein|disque|plaquette|étrier/i.test(haystack)) {
    return 'freins';
  }
  if (/filtre|filter/i.test(haystack)) {
    return 'filtres';
  }
  if (/pneu|roue|caoutch/i.test(haystack)) {
    return 'pneus';
  }
  if (/batter|accu/i.test(haystack)) {
    return 'batteries';
  }
  if (/huile|huil/i.test(haystack)) {
    return 'huile_moteur';
  }
  if (/courroie|ceinture|belt/i.test(haystack)) {
    return 'courroies';
  }
  if (/bougie|spark/i.test(haystack)) {
    return 'bougies';
  }
  if (/phare|headlight/i.test(haystack)) {
    return 'phares';
  }
  if (/embray|clutch/i.test(haystack)) {
    return 'embrayage';
  }

  return 'autres';
};

interface PublicCatalogProps {
  canEditPrices?: boolean;
  isCartOpen?: boolean;
  onToggleCart?: () => void;
  onOpenCart?: () => void;
  onCloseCart?: () => void;
  onOpenInvoice?: () => void;
}

export default function PublicCatalog({ canEditPrices = false, isCartOpen = false, onOpenCart, onCloseCart, onOpenInvoice }: PublicCatalogProps) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'price-asc' | 'price-desc' | 'name'>('relevance');
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  const [priceEditTarget, setPriceEditTarget] = useState<CatalogItem | null>(null);
  const [showOutOfStock, setShowOutOfStock] = useState(true);
  const [newPriceInput, setNewPriceInput] = useState('');
  const [priceError, setPriceError] = useState('');
  const [isSavingPrice, setIsSavingPrice] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { addToCart } = useCart();

  const scrollToProduct = (id: string) => {
    const element = document.getElementById(`catalog-item-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    onCloseCart?.();
  };

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

    const filtered = items.filter((item) => {
      if (!showOutOfStock && item.quantity <= 0) {
        return false;
      }

      const resolvedCategory = inferCategory(item);
      const matchesSearch =
        normalizedSearch.length === 0 ||
        item.name.toLowerCase().includes(normalizedSearch) ||
        item.reference.toLowerCase().includes(normalizedSearch) ||
        item.compatible_cars.toLowerCase().includes(normalizedSearch);

      const matchesCategory = selectedCategory === 'all' || resolvedCategory === selectedCategory;
      const matchesBrand =
        selectedBrands.length === 0 ||
        selectedBrands.some((brand) => item.compatible_cars.toLowerCase().includes(brand.toLowerCase()));

      return matchesSearch && matchesCategory && matchesBrand;
    });

    const sorted = [...filtered];
    switch (sortBy) {
      case 'price-asc':
        return sorted.sort((left, right) => left.sellingprice - right.sellingprice);
      case 'price-desc':
        return sorted.sort((left, right) => right.sellingprice - left.sellingprice);
      case 'name':
        return sorted.sort((left, right) => left.name.localeCompare(right.name, 'fr'));
      default:
        return sorted;
    }
  }, [items, search, selectedBrands, selectedCategory, showOutOfStock, sortBy]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    categoryFilterOptions.forEach((option) => {
      counts[option.value] = 0;
    });

    items.forEach((item) => {
      const category = inferCategory(item);
      counts[category] = (counts[category] ?? 0) + 1;
    });

    return counts;
  }, [items]);

  useEffect(() => {
    if (!toastMessage) {
      return undefined;
    }

    const timerId = window.setTimeout(() => setToastMessage(null), 2400);
    return () => window.clearTimeout(timerId);
  }, [toastMessage]);

  const toggleBrand = (brand: string) => {
    setSelectedBrands((current) => (current.includes(brand) ? current.filter((entry) => entry !== brand) : [...current, brand]));
  };

  const resetFilters = () => {
    setSearch('');
    setSelectedBrands([]);
    setSelectedCategory('all');
    setSortBy('relevance');
    setShowOutOfStock(true);
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

    const trimmedValue = newPriceInput.trim();
    const nextPrice = Number.parseFloat(trimmedValue);
    if (!trimmedValue || !Number.isFinite(nextPrice) || nextPrice <= 0) {
      setPriceError('Please enter a positive price in MAD.');
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
    setToastMessage(`Price updated for ${priceEditTarget.name}.`);
    closePriceEditor();
  };

  return (
    <PasswordGate>
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <section className="relative overflow-hidden border-b border-red-500/30 bg-[radial-gradient(circle_at_top_left,_rgba(255,0,0,0.2),_transparent_35%),linear-gradient(135deg,_#09090b,_#111827)] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-8">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.45em] text-red-500">{company.name}</p>
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
              Pièces auto aux meilleurs prix
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-zinc-300 sm:text-xl">
              Découvrez des pièces détachées neuves et d’occasion pour toutes les marques, livrées rapidement.
            </p>
          </div>

          <div className="rounded-3xl border border-red-500/20 bg-zinc-900/70 p-4 shadow-xl shadow-black/20 backdrop-blur-xl">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-red-400">Contact & emplacement</p>
                <div className="mt-2 space-y-1 text-sm text-zinc-300">
                  <a href={`tel:${company.phone1}`} className="block hover:text-red-300">📞 {company.phone1}</a>
                  <a href={`tel:${company.phone2}`} className="block hover:text-red-300">📞 {company.phone2}</a>
                  <a href={`mailto:${company.email}`} className="flex items-center gap-1 hover:text-red-300">
                    <span>📧</span>
                    <span>{company.email}</span>
                  </a>
                  <p>📍 {company.address}</p>
                  <p>{company.addressAr}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-4 shadow-2xl shadow-black/30 backdrop-blur-xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
              <label className="flex flex-1 items-center gap-3 rounded-2xl border border-zinc-700 bg-zinc-900/80 px-4 py-3">
                <span className="text-red-500">🔎</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Rechercher une pièce, une référence ou une voiture"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-500"
                />
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedCategory}
                  onChange={(event) => setSelectedCategory(event.target.value)}
                  className="rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 outline-none"
                >
                  {categoryFilterOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value as 'relevance' | 'price-asc' | 'price-desc' | 'name')}
                  className="rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 outline-none"
                >
                  <option value="relevance">Pertinence</option>
                  <option value="price-asc">Prix ↑</option>
                  <option value="price-desc">Prix ↓</option>
                  <option value="name">Nom A-Z</option>
                </select>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-red-400 hover:text-red-300"
                >
                  Reset filters
                </button>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto pb-1">
              <div className="flex min-w-max gap-2">
                {brandOptions.map((brand) => {
                  const active = selectedBrands.includes(brand.value);
                  return (
                    <button
                      key={brand.value}
                      type="button"
                      onClick={() => toggleBrand(brand.value)}
                      className={`rounded-full border px-3 py-2 text-sm font-medium transition duration-200 ${
                        active ? `${brand.color} shadow-lg shadow-black/20` : 'border-zinc-700 bg-zinc-900/80 text-zinc-300 hover:border-red-400'
                      }`}
                    >
                      <span className="mr-2">{brand.icon}</span>
                      {brand.value}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-white">Catalogue public</h2>
            <p className="text-sm text-zinc-400">{filteredItems.length} pièces affichées</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {categoryFilterOptions.filter((option) => option.value !== 'all').map((option) => (
              <span key={option.value} className="rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-1 text-xs text-zinc-400">
                {option.label}: {categoryCounts[option.value] ?? 0}
              </span>
            ))}
            <label className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-300">
              <input type="checkbox" checked={showOutOfStock} onChange={() => setShowOutOfStock((current) => !current)} className="rounded border-zinc-700 bg-zinc-900" />
              Afficher les pièces en rupture
            </label>
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
            {filteredItems.map((item) => (
              <ProductCard
                key={item.id}
                item={item as CatalogCardItem}
                onSelect={(selected) => setSelectedItem(selected)}
                onEditPrice={openPriceEditor}
              />
            ))}
          </div>
        )}
      </main>

      <CartDrawer
        open={isCartOpen ?? false}
        onClose={onCloseCart ?? (() => undefined)}
        onOpenInvoice={onOpenInvoice ?? (() => undefined)}
        canEditPrices={canEditPrices}
        catalogItems={filteredItems.map((item) => ({
          id: String(item.id),
          name: item.name,
          image_url: item.image_url ?? null
        }))}
        onSelectProduct={scrollToProduct}
      />

      <footer className="border-t border-zinc-800 bg-zinc-950/80 px-4 py-6 text-sm text-zinc-400 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold text-zinc-200">{company.name}</p>
            <p>{company.address}</p>
            <p>{company.addressAr}</p>
          </div>
          <div className="space-y-1">
            <a href={`tel:${company.phone1}`} className="block hover:text-red-300">{company.phone1}</a>
            <a href={`tel:${company.phone2}`} className="block hover:text-red-300">{company.phone2}</a>
            <a href={`mailto:${company.email}`} className="flex items-center gap-1 hover:text-red-300">
              <span>📧</span>
              <span>{company.email}</span>
            </a>
          </div>
        </div>
      </footer>

      {priceEditTarget ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-sm">
          <div className="modal-fade-in w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl shadow-black/60">
            <div className="mb-5">
              <p className="text-xs uppercase tracking-[0.35em] text-red-400">Edit price</p>
              <h3 className="mt-2 text-xl font-semibold text-white">{priceEditTarget.name}</h3>
              <p className="mt-1 text-sm text-zinc-400">{priceEditTarget.reference}</p>
            </div>

            <form onSubmit={handleSavePrice} className="space-y-4">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
                <p className="text-sm text-zinc-400">Current price</p>
                <div className="mt-2 flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2 text-white">
                  <span>{priceEditTarget.sellingprice.toLocaleString('fr-FR')} MAD</span>
                  <span className="rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-semibold text-red-300">MAD</span>
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
                  <span className="text-sm font-semibold text-zinc-400">MAD</span>
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
                  className="rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSavingPrice ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {toastMessage ? (
        <div className="fixed bottom-4 right-4 z-[70] rounded-2xl border border-red-500/30 bg-zinc-900/95 px-4 py-3 text-sm font-semibold text-white shadow-2xl shadow-black/40 backdrop-blur">
          {toastMessage}
        </div>
      ) : null}

      {selectedItem ? (
        <AddToCartPanel
          open={Boolean(selectedItem)}
          item={selectedItem as AddToCartPanelItem}
          onClose={() => setSelectedItem(null)}
          onAddToCart={(item, quantity) => {
            addToCart({
              id: String(item.id),
              name: item.name,
              reference: item.reference,
              price: item.sellingprice,
              image_url: item.image_url ?? null,
              stock: item.quantity,
              quantity
            });
            setSelectedItem(null);
            onOpenCart?.();
          }}
        />
      ) : null}

      {toastMessage ? (
        <div className="fixed bottom-4 right-4 z-[70] rounded-full border border-emerald-500/30 bg-emerald-500/15 px-4 py-3 text-sm font-medium text-emerald-300 shadow-lg shadow-black/30">
          {toastMessage}
        </div>
      ) : null}
    </div>
    </PasswordGate>
  );
}
