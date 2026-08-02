import { useEffect, useMemo, useState } from 'react';
import { company } from '../config/company';

interface HistoricalInvoiceData {
  invoiceNumber: string;
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  customerAddress?: string | null;
  customerCity?: string | null;
  items: Array<{ id: string; name: string; reference: string; quantity: number; price: number }>;
  totalAmount: number;
  status: string;
  createdAt?: string | null;
}

export default function PrintHistoricalInvoice() {
  const [invoiceData, setInvoiceData] = useState<HistoricalInvoiceData | null>(null);
  const [downloadMode, setDownloadMode] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('data');
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as HistoricalInvoiceData;
      setInvoiceData(parsed);
      if (params.get('download') === '1') {
        setDownloadMode(true);
        window.setTimeout(() => window.print(), 600);
      }
    } catch {
      setInvoiceData(null);
    }
  }, []);

  const subtotal = useMemo(() => (invoiceData?.items ?? []).reduce((sum, item) => sum + item.price * item.quantity, 0), [invoiceData]);

  if (!invoiceData) {
    return <div className="p-8 text-center text-zinc-600">Aucune facture à afficher.</div>;
  }

  return (
    <div className={`min-h-screen bg-zinc-100 p-4 text-zinc-900 ${downloadMode ? 'print:bg-white print:p-0' : ''}`}>
      <div className="mx-auto max-w-5xl rounded-3xl border border-zinc-300 bg-white p-6 shadow-sm print:rounded-none print:border-0 print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-zinc-200 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">{company.name}</h1>
            <p className="mt-1 text-sm text-zinc-600">{company.address}</p>
            <p className="text-sm text-zinc-600">{company.addressAr}</p>
            <a href={`tel:${company.phone1}`} className="block text-sm text-zinc-600">{company.phone1}</a>
            <a href={`mailto:${company.email}`} className="block text-sm text-zinc-600">{company.email}</a>
          </div>
          <div className="text-sm text-zinc-700">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-red-600">Facture</p>
            <p className="mt-2">N°: {invoiceData.invoiceNumber}</p>
            <p>Date: {invoiceData.createdAt ? new Date(invoiceData.createdAt).toLocaleDateString('fr-FR') : '—'}</p>
            <p>Status: {invoiceData.status}</p>
          </div>
        </header>

        <section className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-zinc-500">Client</p>
          <div className="mt-3 grid gap-2 text-sm text-zinc-700">
            <p className="font-semibold text-zinc-900">{invoiceData.customerName}</p>
            {invoiceData.customerPhone ? <p>Tél: {invoiceData.customerPhone}</p> : null}
            {invoiceData.customerEmail ? <p>Email: {invoiceData.customerEmail}</p> : null}
            {invoiceData.customerAddress ? <p>Adresse: {invoiceData.customerAddress}</p> : null}
            {invoiceData.customerCity ? <p>Ville: {invoiceData.customerCity}</p> : null}
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-zinc-200">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-zinc-600">Référence</th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-600">Désignation</th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-600">Qté</th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-600">Prix</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white">
              {invoiceData.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 text-zinc-700">{item.reference}</td>
                  <td className="px-4 py-3 text-zinc-700">{item.name}</td>
                  <td className="px-4 py-3 text-zinc-700">{item.quantity}</td>
                  <td className="px-4 py-3 text-zinc-700">{(item.price * item.quantity).toLocaleString('fr-FR')} MAD</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mt-6 flex justify-end">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="flex items-center justify-between text-sm text-zinc-600">
              <span>Sous-total</span>
              <span>{subtotal.toLocaleString('fr-FR')} MAD</span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-zinc-200 pt-3 text-lg font-semibold text-zinc-900">
              <span>Total</span>
              <span>{invoiceData.totalAmount.toLocaleString('fr-FR')} MAD</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
