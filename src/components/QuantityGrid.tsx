interface QuantityGridProps {
  quantity: number;
  setQuantity: (quantity: number) => void;
  maxQuantity?: number;
}

export default function QuantityGrid({ quantity, setQuantity, maxQuantity = 80 }: QuantityGridProps) {
  const columns = 8;

  const handleArrowNavigation = (current: number, key: string) => {
    let target = current;
    if (key === 'ArrowLeft') {
      target = current - 1;
    }
    if (key === 'ArrowRight') {
      target = current + 1;
    }
    if (key === 'ArrowUp') {
      target = current - columns;
    }
    if (key === 'ArrowDown') {
      target = current + columns;
    }

    if (target >= 1 && target <= maxQuantity) {
      setQuantity(target);
      const element = document.getElementById(`qty-btn-${target}`);
      if (element) {
        element.focus();
      }
    }
  };

  return (
    <div className="grid grid-cols-5 gap-2 sm:grid-cols-8">
      {Array.from({ length: maxQuantity }, (_, i) => i + 1).map((num) => (
        <button
          key={num}
          id={`qty-btn-${num}`}
          type="button"
          onClick={() => setQuantity(num)}
          onKeyDown={(event) => {
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
              event.preventDefault();
              handleArrowNavigation(num, event.key);
            }
          }}
          aria-pressed={quantity === num}
          className={`aspect-square min-h-[44px] rounded-lg border-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-red-500
            ${quantity === num
              ? 'bg-red-500 border-red-500 text-white scale-105'
              : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-red-500 hover:bg-gray-700'
            }`}
        >
          {num}
        </button>
      ))}
    </div>
  );
}
