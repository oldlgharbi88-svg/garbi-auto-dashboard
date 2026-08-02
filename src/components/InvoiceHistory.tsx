import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

interface InvoiceRecord {
  id: number | string;
  invoice_number: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  customer_address: string | null;
  customer_city: string | null;
  items: Array<{ id: string; name: string; reference: string; quantity: number; price: number }>;
  total_amount: number;
  status: string;
  created_at?: string | null;
}

export default function InvoiceHistory() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadInvoices = async () => {
      const { data, error } = await supabase.from('invoice_history').select('*').order('created_at', { ascending: false });
      if (!error) {
        setInvoices((data ?? []) as InvoiceRecord[]);
      }
      setLoading(false);
    };

    void loadInvoices();
  }, []);

  useEffect(() => {
    if (!toastMessage) {
      return undefined;
    }

    const timer = window.setTimeout(() => setToastMessage(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const filteredInvoices = useMemo(() => {
    const searchValue = search.trim().toLowerCase();
    const customerValue = customerFilter.trim().toLowerCase();

    return invoices.filter((invoice) => {
      const matchesSearch =
        searchValue.length === 0 ||
        invoice.invoice_number.toLowerCase().includes(searchValue) ||
        invoice.customer_name.toLowerCase().includes(searchValue);

      const matchesCustomer = customerValue.length === 0 || invoice.customer_name.toLowerCase().includes(customerValue);
      const matchesDateFrom = !dateFrom || (invoice.created_at ? invoice.created_at.slice(0, 10) >= dateFrom : false);
      const matchesDateTo = !dateTo || (invoice.created_at ? invoice.created_at.slice(0, 10) <= dateTo : false);

      return matchesSearch && matchesCustomer && matchesDateFrom && matchesDateTo;
    });
  }, [customerFilter, dateFrom, dateTo, invoices, search]);

  const handlePrintAgain = (invoice: InvoiceRecord) => {
    const payload = JSON.stringify({
      invoiceNumber: invoice.invoice_number,
      customerName: invoice.customer_name,
      customerPhone: invoice.customer_phone,
      customerEmail: invoice.customer_email,
      customerAddress: invoice.customer_address,
      customerCity: invoice.customer_city,
      items: invoice.items,
      totalAmount: invoice.total_amount,
      status: invoice.status,
      createdAt: invoice.created_at
    });
    const url = `/print-history?data=${encodeURIComponent(payload)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setToastMessage('Facture ouverte pour réimpression.');
  };

  const handleDownloadPdf = (invoice: InvoiceRecord) => {
    const payload = JSON.stringify({
      invoiceNumber: invoice.invoice_number,
      customerName: invoice.customer_name,
      customerPhone: invoice.customer_phone,
      customerEmail: invoice.customer_email,
      customerAddress: invoice.customer_address,
      customerCity: invoice.customer_city,
      items: invoice.items,
      totalAmount: invoice.total_amount,
      status: invoice.status,
      createdAt: invoice.created_at
    });
    const url = `/print-history?download=1&data=${encodeURIComponent(payload)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setToastMessage('Préparation du PDF…');
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-outline-variant bg-surface-container p-6 shadow-2xl shadow-black/20">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-on-surface-variant">Invoice history</p>
            <h1 className="mt-2 text-3xl font-semibold text-on-surface">Historique des factures</h1>
          </div>
          <div className="rounded-2xl border border-outline-variant bg-surface-container-high p-3 text-sm text-on-surface-variant">
            {invoices.length} factures enregistrées
          </div>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
          <label className="rounded-2xl border border-outline-variant bg-surface-container-high px-3 py-2 text-sm text-on-surface-variant">
            <span className="mb-1 block text-xs uppercase tracking-[0.24em]">Recherche</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="N° facture ou client" className="w-full bg-transparent outline-none" />
          </label>
          <label className="rounded-2xl border border-outline-variant bg-surface-container-high px-3 py-2 text-sm text-on-surface-variant">
            <span className="mb-1 block text-xs uppercase tracking-[0.24em]">Client</span>
            <input value={customerFilter} onChange={(event) => setCustomerFilter(event.target.value)} placeholder="Nom du client" className="w-full bg-transparent outline-none" />
          </label>
          <label className="rounded-2xl border border-outline-variant bg-surface-container-high px-3 py-2 text-sm text-on-surface-variant">
            <span className="mb-1 block text-xs uppercase tracking-[0.24em]">Depuis</span>
            <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="w-full bg-transparent outline-none" />
          </label>
          <label className="rounded-2xl border border-outline-variant bg-surface-container-high px-3 py-2 text-sm text-on-surface-variant">
            <span className="mb-1 block text-xs uppercase tracking-[0.24em]">Jusqu&apos;à</span>
            <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="w-full bg-transparent outline-none" />
          </label>
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-outline-variant bg-surface-container p-6 text-center text-on-surface-variant">Chargement…</div>
      ) : filteredInvoices.length === 0 ? (
        <div className="rounded-3xl border border-outline-variant bg-surface-container p-6 text-center text-on-surface-variant">Aucune facture ne correspond à votre recherche.</div>
      ) : (
        <div className="space-y-4">
          {filteredInvoices.map((invoice) => (
            <div key={invoice.id} className="rounded-3xl border border-outline-variant bg-surface-container p-5 shadow-lg shadow-black/10">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-semibold text-on-surface">{invoice.invoice_number}</p>
                    <span className="rounded-full bg-red-500/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-red-300">{invoice.status}</span>
                  </div>
                  <p className="mt-2 text-sm text-on-surface-variant">Client: {invoice.customer_name}</p>
                  <p className="text-sm text-on-surface-variant">Date: {invoice.created_at ? new Date(invoice.created_at).toLocaleString('fr-FR') : '—'}</p>
                  <p className="text-sm text-on-surface-variant">Montant: {invoice.total_amount.toLocaleString('fr-FR')} MAD</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => handlePrintAgain(invoice)} className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-300">Réimprimer</button>
                  <button type="button" onClick={() => handleDownloadPdf(invoice)} className="rounded-full border border-outline-variant bg-surface-container-high px-3 py-2 text-sm font-semibold text-on-surface">Télécharger PDF</button>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-outline-variant bg-surface-container-low p-4 text-sm text-on-surface-variant">
                <p className="font-semibold text-on-surface">Articles</p>
                <div className="mt-2 space-y-1">
                  {invoice.items.map((item) => (
                    <div key={`${invoice.id}-${item.id}`} className="flex items-center justify-between gap-3">
                      <span>{item.name}</span>
                      <span>{item.quantity} × {item.price.toLocaleString('fr-FR')} MAD</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {toastMessage ? <div className="fixed bottom-4 right-4 rounded-2xl border border-red-500/30 bg-zinc-900/95 px-4 py-3 text-sm font-semibold text-white shadow-2xl shadow-black/40">{toastMessage}</div> : null}
    </div>
  );
}
