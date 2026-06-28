import { useEffect, useState } from 'react';

interface InvoiceItem {
  id: number;
  name: string;
  sku: string;
  price: number;
  qty: number;
}

export default function POS() {
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: 1, name: 'Battery 12V', sku: 'BAT-12V', price: 340, qty: 1 },
    { id: 2, name: 'Brake Pad Kit', sku: 'BRK-SET', price: 185, qty: 2 },
    { id: 3, name: 'Oil Filter', sku: 'OIL-FLT', price: 95, qty: 1 }
  ]);
  const [mode, setMode] = useState<'retail' | 'wholesale'>('retail');
  const [company, setCompany] = useState<string>('Apex Logistics');
  const [poNumber, setPoNumber] = useState<string>('PO-2026-001');
  const [discount, setDiscount] = useState<string>('5');
  const [paymentTerms, setPaymentTerms] = useState<string>('30 days');
  const [selectedClientName, setSelectedClientName] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const storedClient = window.localStorage.getItem('selectedClientForPos');
    if (storedClient) {
      try {
        const parsedClient = JSON.parse(storedClient) as { name: string };
        setSelectedClientName(parsedClient.name);
      } catch {
        setSelectedClientName(null);
      }
    }
  }, []);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discountValue = subtotal * (Number(discount) / 100);
  const total = subtotal - discountValue;

  const incrementItem = (id: number) => {
    setItems((previousItems) =>
      previousItems.map((item) => (item.id === id ? { ...item, qty: item.qty + 1 } : item))
    );
  };

  const decrementItem = (id: number) => {
    setItems((previousItems) =>
      previousItems.map((item) => (item.id === id ? { ...item, qty: Math.max(1, item.qty - 1) } : item))
    );
  };

  const removeItem = (id: number) => {
    setItems((previousItems) => previousItems.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-outline-variant bg-surface-container p-6 shadow-2xl shadow-black/20">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-on-surface-variant">Workspace</p>
          <h1 className="mt-2 text-3xl font-semibold text-on-surface">POS / Invoice Console</h1>
        </div>
        <div className="rounded-2xl border border-outline-variant bg-surface-container-high px-4 py-3 text-sm text-on-surface-variant">
          <span className="font-semibold text-on-surface">Station: </span>Bay 03 · 14:32
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          {selectedClientName ? (
            <div className="rounded-2xl border border-outline-variant bg-secondary-container p-4 text-sm text-on-secondary-container">
              <p className="font-semibold">Selected client</p>
              <p className="mt-1">{selectedClientName}</p>
            </div>
          ) : null}

          <section className="rounded-3xl border border-outline-variant bg-surface-container p-6 shadow-2xl shadow-black/20">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-on-surface">Invoice Items</h2>
                <p className="text-sm text-on-surface-variant">Live order adjustment and item control</p>
              </div>
              <button
                type="button"
                className="rounded-full border border-outline-variant bg-surface-container-high px-3 py-2 text-sm font-semibold text-on-surface"
              >
                Print Preview
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex flex-wrap items-center justify-between rounded-2xl border border-outline-variant bg-surface-container-highest p-4">
                  <div>
                    <p className="font-semibold text-on-surface">{item.name}</p>
                    <p className="text-sm text-on-surface-variant">{item.sku}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container p-2">
                      <button type="button" onClick={() => decrementItem(item.id)} className="rounded-full px-2 py-1 text-on-surface">
                        −
                      </button>
                      <span className="min-w-6 text-center font-semibold text-on-surface">{item.qty}</span>
                      <button type="button" onClick={() => incrementItem(item.id)} className="rounded-full px-2 py-1 text-on-surface">
                        +
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-on-surface">{item.price * item.qty} MAD</p>
                      <p className="text-sm text-on-surface-variant">{item.price} MAD each</p>
                    </div>
                    <button type="button" onClick={() => removeItem(item.id)} className="rounded-full border border-outline-variant p-2 text-on-surface-variant">
                      <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-outline-variant bg-surface-container p-6 shadow-2xl shadow-black/20">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-on-surface">Wholesale / B2B</h2>
                <p className="text-sm text-on-surface-variant">Corporate client and logistics billing flow</p>
              </div>
              <button
                type="button"
                onClick={() => setMode((previousMode) => (previousMode === 'retail' ? 'wholesale' : 'retail'))}
                className="rounded-full border border-outline-variant bg-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface"
              >
                {mode === 'retail' ? 'Retail Mode' : 'Wholesale / B2B'}
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-on-surface-variant">
                Company client
                <select
                  value={company}
                  onChange={(event) => setCompany(event.target.value)}
                  className="rounded-2xl border border-outline-variant bg-surface-container-highest px-4 py-3 text-on-surface"
                >
                  <option value="Apex Logistics">Apex Logistics · ICE 0011223344</option>
                  <option value="MediTrans Supply">MediTrans Supply · ICE 0044556677</option>
                  <option value="Nordic Parts">Nordic Parts · ICE 0077889900</option>
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-on-surface-variant">
                Purchase Order
                <input
                  value={poNumber}
                  onChange={(event) => setPoNumber(event.target.value)}
                  className="rounded-2xl border border-outline-variant bg-surface-container-highest px-4 py-3 text-on-surface"
                  placeholder="PO Number"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-on-surface-variant">
                Discount %
                <input
                  type="number"
                  value={discount}
                  onChange={(event) => setDiscount(event.target.value)}
                  className="rounded-2xl border border-outline-variant bg-surface-container-highest px-4 py-3 text-on-surface"
                  placeholder="0"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-on-surface-variant">
                Payment terms
                <select
                  value={paymentTerms}
                  onChange={(event) => setPaymentTerms(event.target.value)}
                  className="rounded-2xl border border-outline-variant bg-surface-container-highest px-4 py-3 text-on-surface"
                >
                  <option value="Immediate">Immediate</option>
                  <option value="30 days">30 days</option>
                  <option value="60 days">60 days</option>
                  <option value="90 days">90 days</option>
                </select>
              </label>
            </div>
          </section>
        </div>

        <aside className="rounded-3xl border border-outline-variant bg-surface-container p-6 shadow-2xl shadow-black/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-on-surface-variant">Right Panel</p>
              <h2 className="mt-2 text-xl font-semibold text-on-surface">Invoice Summary</h2>
            </div>
            <span className="rounded-full border border-outline-variant bg-surface-container-high px-3 py-1 text-sm text-on-surface-variant">
              {mode === 'retail' ? 'Retail' : 'B2B'}
            </span>
          </div>

          <div className="mt-6 space-y-4 rounded-2xl border border-outline-variant bg-surface-container-highest p-4">
            <div className="flex items-center justify-between text-sm text-on-surface-variant">
              <span>Subtotal</span>
              <span>{subtotal.toFixed(2)} MAD</span>
            </div>
            <div className="flex items-center justify-between text-sm text-on-surface-variant">
              <span>Discount</span>
              <span>-{discountValue.toFixed(2)} MAD</span>
            </div>
            <div className="flex items-center justify-between text-sm text-on-surface-variant">
              <span>Tax</span>
              <span>0.00 MAD</span>
            </div>
            <div className="flex items-center justify-between border-t border-outline-variant pt-4 text-lg font-semibold text-on-surface">
              <span>Total</span>
              <span>{total.toFixed(2)} MAD</span>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-outline-variant bg-surface-container-high p-4 text-sm text-on-surface-variant">
            <p className="font-semibold text-on-surface">{company}</p>
            <p className="mt-2">PO: {poNumber}</p>
            <p className="mt-1">Terms: {paymentTerms}</p>
            <p className="mt-1">Discount: {discount}%</p>
          </div>

          <button type="button" className="mt-6 w-full rounded-2xl bg-primary px-4 py-3 font-semibold text-on-primary">
            Confirm Sale
          </button>
        </aside>
      </div>
    </div>
  );
}
