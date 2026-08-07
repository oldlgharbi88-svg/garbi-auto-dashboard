import type { KeyboardEvent, MouseEvent } from 'react';

export interface CatalogCardItem {
  id: number | string;
  name: string;
  reference: string;
  compatible_cars: string;
  sellingprice: number;
  quantity: number;
  image_url?: string | null;
}

interface ProductCardProps {
  item: CatalogCardItem;
  onSelect: (item: CatalogCardItem) => void;
  onEditPrice: (item: CatalogCardItem) => void;
}

export default function ProductCard({ item, onSelect, onEditPrice }: ProductCardProps) {
  const inStock = item.quantity > 0;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(item);
    }
  };

  const stopPropagation = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
  };

  return (
    <article
      id={`catalog-item-${item.id}`}
      className="group overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/80 shadow-lg shadow-black/20 transition hover:-translate-y-1"
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelect(item)}
        onKeyDown={handleKeyDown}
        className="relative cursor-pointer"
      >
        <div className="relative aspect-square overflow-hidden bg-zinc-800">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-zinc-800 text-zinc-500">Image indisponible</div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white">
              Plus de détails
            </span>
          </div>
        </div>

        <button
          type="button"
          aria-label={`Modifier le prix de ${item.name}`}
          title={`Modifier le prix de ${item.name}`}
          onClick={(event) => {
            stopPropagation(event);
            onEditPrice(item);
          }}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-red-500/30 bg-red-600/90 text-white shadow-lg shadow-black/30 backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-500 hover:shadow-red-600/20"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
          </svg>
        </button>
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
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-3 py-2 text-sm text-white">
            {inStock ? `En stock • ${item.quantity}` : 'Rupture'}
          </div>
        </div>
      </div>
    </article>
  );
}
