import { useMemo, useState } from 'react';

interface InvoiceItem {
  id: number;
  name: string;
  reference: string;
  quantity: number;
  unitPrice: number;
}

interface CustomerDetails {
  name: string;
  phone: string;
  address: string;
}

interface InvoiceTotals {
  subtotal: number;
  discount: number;
  total: number;
}

interface InvoicePreview {
  id: number;
  invoiceNumber: string;
  customer: CustomerDetails;
  items: InvoiceItem[];
  totals: InvoiceTotals;
  paymentTerms: string;
  poNumber: string;
  date: string;
}

interface InvoicePrintProps {
  items?: InvoiceItem[];
  customer?: CustomerDetails;
  totals?: InvoiceTotals;
  discount?: number;
  paymentTerms?: string;
  poNumber?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
}

const sampleInvoices: InvoicePreview[] = [
  {
    id: 1,
    invoiceNumber: 'INV-20260628-0001',
    customer: {
      name: 'Apex Logistics',
      phone: '+212 6 00 11 22 33',
      address: 'Rue Hassan II, Casablanca'
    },
    items: [
      { id: 1, name: 'Battery 12V', reference: 'BAT-12V', quantity: 2, unitPrice: 380 },
      { id: 2, name: 'Brake Pad Kit', reference: 'BRK-SET', quantity: 1, unitPrice: 210 }
    ],
    totals: { subtotal: 970, discount: 50, total: 920 },
    paymentTerms: '30 days',
    poNumber: 'PO-2026-001',
    date: '2026-06-28 14:32'
  },
  {
    id: 2,
    invoiceNumber: 'INV-20260627-0002',
    customer: {
      name: 'MediTrans Supply',
      phone: '+212 6 10 44 66 88',
      address: 'Bd Mohamed V, Rabat'
    },
    items: [
      { id: 1, name: 'Oil Filter', reference: 'OIL-FLT', quantity: 4, unitPrice: 110 },
      { id: 2, name: 'Air Filter', reference: 'AIR-FLT', quantity: 2, unitPrice: 125 }
    ],
    totals: { subtotal: 690, discount: 0, total: 690 },
    paymentTerms: 'Immediate',
    poNumber: 'PO-2026-002',
    date: '2026-06-27 10:15'
  }
];

const formatInvoiceNumber = (date: Date): string => {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  const random = `${Math.floor(Math.random() * 9000) + 1000}`;
  return `INV-${y}${m}${d}-${random}`;
};

export default function InvoicePrint({
  items,
  customer,
  totals,
  discount,
  paymentTerms,
  poNumber,
  invoiceNumber,
  invoiceDate
}: InvoicePrintProps) {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number>(sampleInvoices[0].id);

  const storeName = typeof window !== 'undefined' ? window.localStorage.getItem('storeName') ?? 'Garbi Auto Logistique' : 'Garbi Auto Logistique';
  const storeAddress = typeof window !== 'undefined' ? window.localStorage.getItem('storeAddress') ?? 'Lot 14, Zone Industrielle, Casablanca' : 'Lot 14, Zone Industrielle, Casablanca';
  const storePhone = typeof window !== 'undefined' ? window.localStorage.getItem('phoneNumber') ?? '+212 5 22 11 22 33' : '+212 5 22 11 22 33';
  const taxId = typeof window !== 'undefined' ? window.localStorage.getItem('taxId') ?? 'ICE 0011223344' : 'ICE 0011223344';

  const selectedInvoice = useMemo(() => {
    const fallback = sampleInvoices.find((invoice) => invoice.id === selectedInvoiceId) ?? sampleInvoices[0];
    return {
      invoiceNumber: invoiceNumber ?? fallback.invoiceNumber,
      customer: customer ?? fallback.customer,
      items: items ?? fallback.items,
      totals: totals ?? fallback.totals,
      paymentTerms: paymentTerms ?? fallback.paymentTerms,
      poNumber: poNumber ?? fallback.poNumber,
      date: invoiceDate ?? fallback.date,
      storeName,
      storeAddress,
      storePhone,
      taxId
    };
  }, [customer, discount, invoiceDate, invoiceNumber, items, paymentTerms, poNumber, selectedInvoiceId, storeAddress, storeName, storePhone, taxId, totals]);

  const printInvoice = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-outline-variant bg-surface-container p-6 shadow-2xl shadow-black/20">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-on-surface-variant">Invoices / الفواتير / Factures</p>
            <h1 className="mt-2 text-3xl font-semibold text-on-surface">Invoice Preview</h1>
          </div>
          <button type="button" onClick={printInvoice} className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary">
            Print Invoice
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <div className="rounded-2xl border border-outline-variant bg-surface-container-high p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-on-surface-variant">Recent invoices</p>
            <div className="mt-4 space-y-3">
              {sampleInvoices.map((invoice) => (
                <button
                  key={invoice.id}
                  type="button"
                  onClick={() => setSelectedInvoiceId(invoice.id)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${selectedInvoiceId === invoice.id ? 'border-primary bg-secondary-container text-on-secondary-container' : 'border-outline-variant bg-surface-container text-on-surface'}`}
                >
                  <p className="font-semibold">{invoice.invoiceNumber}</p>
                  <p className="mt-1 text-xs opacity-80">{invoice.customer.name}</p>
                </button>
              ))}
            </div>
          </div>

          <div id="invoice-print-area" className="rounded-3xl border border-outline-variant bg-surface-container-lowest p-6 shadow-inner shadow-black/20">
            <div className="flex flex-wrap items-start justify-between gap-6 border-b border-outline-variant pb-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-outline-variant bg-surface-container-high text-lg font-semibold text-on-surface">
                  GA
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-on-surface">{selectedInvoice.storeName}</h2>
                  <p className="mt-1 text-sm text-on-surface-variant">{selectedInvoice.storeAddress}</p>
                  <p className="text-sm text-on-surface-variant">{selectedInvoice.storePhone}</p>
                  <p className="text-sm text-on-surface-variant">Tax ID: {selectedInvoice.taxId}</p>
                </div>
              </div>

              <div className="text-sm text-on-surface-variant">
                <p className="font-semibold uppercase tracking-[0.3em] text-on-surface">Invoice</p>
                <p className="mt-2">Invoice #: {selectedInvoice.invoiceNumber}</p>
                <p className="mt-1">Date: {selectedInvoice.date}</p>
                <p className="mt-1">Terms: {selectedInvoice.paymentTerms}</p>
                <p className="mt-1">PO: {selectedInvoice.poNumber}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-[1fr_1fr]">
              <div className="rounded-2xl border border-outline-variant bg-surface-container p-4">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-on-surface-variant">Bill To</p>
                <p className="mt-3 font-semibold text-on-surface">{selectedInvoice.customer.name}</p>
                <p className="mt-1 text-sm text-on-surface-variant">{selectedInvoice.customer.phone}</p>
                <p className="mt-1 text-sm text-on-surface-variant">{selectedInvoice.customer.address}</p>
              </div>
              <div className="rounded-2xl border border-outline-variant bg-surface-container p-4">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-on-surface-variant">Invoice Details</p>
                <p className="mt-3 text-sm text-on-surface-variant">Payment terms: {selectedInvoice.paymentTerms}</p>
                <p className="mt-1 text-sm text-on-surface-variant">PO Number: {selectedInvoice.poNumber}</p>
                <p className="mt-1 text-sm text-on-surface-variant">Invoice date: {selectedInvoice.date}</p>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-outline-variant">
              <table className="min-w-full divide-y divide-outline-variant">
                <thead className="bg-surface-container-high">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">Part Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">Reference</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">Qty</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">Unit Price</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant bg-surface-container">
                  {selectedInvoice.items.map((item) => {
                    const lineTotal = item.quantity * item.unitPrice;
                    return (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm text-on-surface">{item.name}</td>
                        <td className="px-4 py-3 text-sm text-on-surface-variant">{item.reference}</td>
                        <td className="px-4 py-3 text-sm font-data-tabular text-on-surface">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm font-data-tabular text-on-surface">{item.unitPrice.toFixed(2)} MAD</td>
                        <td className="px-4 py-3 text-sm font-data-tabular text-on-surface">{lineTotal.toFixed(2)} MAD</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex flex-col items-end gap-3 rounded-2xl border border-outline-variant bg-surface-container p-4">
              <div className="flex w-full max-w-xs items-center justify-between text-sm text-on-surface-variant">
                <span>Subtotal</span>
                <span className="font-data-tabular">{selectedInvoice.totals.subtotal.toFixed(2)} MAD</span>
              </div>
              <div className="flex w-full max-w-xs items-center justify-between text-sm text-on-surface-variant">
                <span>Discount</span>
                <span className="font-data-tabular">-{selectedInvoice.totals.discount.toFixed(2)} MAD</span>
              </div>
              <div className="flex w-full max-w-xs items-center justify-between border-t border-outline-variant pt-3 text-xl font-semibold text-on-surface">
                <span>Total</span>
                <span className="font-data-tabular">{selectedInvoice.totals.total.toFixed(2)} MAD</span>
              </div>
            </div>

            <div className="mt-8 border-t border-outline-variant pt-6 text-center text-sm text-on-surface-variant">
              <p>Merci pour votre confiance — شكراً لثقتكم</p>
              <p className="mt-1">Thank you for your trust — Merci pour votre confiance</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
