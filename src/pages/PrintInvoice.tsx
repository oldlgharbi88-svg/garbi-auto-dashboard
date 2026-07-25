import { useEffect, useMemo, useState } from 'react';
import { useCart } from '../context/CartContext';
import { company } from '../config/company';

const STORAGE_KEY = 'public-invoice-customer-name';

function getInvoiceNumber() {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  return `INV-${stamp}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
}

export default function PrintInvoice() {
  const { cartItems, total } = useCart();
  const [customerName, setCustomerName] = useState('');
  const [invoiceNumber] = useState(() => getInvoiceNumber());
  const [invoiceDate] = useState(() => new Date());

  useEffect(() => {
    const savedName = window.localStorage.getItem(STORAGE_KEY) ?? '';
    setCustomerName(savedName);
  }, []);

  useEffect(() => {
    const shouldAutoPrint = new URLSearchParams(window.location.search).get('print') === '1';
    if (shouldAutoPrint) {
      const timeout = window.setTimeout(() => window.print(), 1000);
      return () => window.clearTimeout(timeout);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, customerName);
  }, [customerName]);

  const subtotal = useMemo(() => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0), [cartItems]);
  const vat = 0;
  const grandTotal = subtotal + vat;

  const invoiceTime = `${invoiceDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  const invoiceDateLabel = `${invoiceDate.toLocaleDateString('fr-FR')}`;

  return (
    <div className="min-h-screen bg-zinc-100 p-4 text-zinc-900 print:bg-white print:p-0">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 print:gap-0">
        <div className="flex items-center justify-end gap-3 print:hidden">
          <button type="button" onClick={() => window.print()} className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 shadow-sm">
            Imprimer
          </button>
        </div>

        <div className="rounded-3xl border border-zinc-300 bg-white p-6 shadow-sm print:rounded-none print:border-0 print:shadow-none">
          <header className="flex flex-wrap items-start justify-between gap-6 border-b border-zinc-200 pb-6">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-red-200 bg-red-50 text-xl font-black text-red-600">
                GA
              </div>
              <div>
                <h1 className="text-2xl font-bold text-zinc-900">{company.name}</h1>
                <p className="mt-1 text-sm text-zinc-600">{company.address}</p>
                <p className="text-sm text-zinc-600">{company.phone}</p>
                <p className="text-sm text-zinc-600">{company.email}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-500">
                  <span>ICE: {company.ice}</span>
                  <span>RC: {company.rc}</span>
                  <span>Patente: {company.patente}</span>
                </div>
              </div>
            </div>

            <div className="text-sm text-zinc-700">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-red-600">Facture</p>
              <p className="mt-2">N°: {invoiceNumber}</p>
              <p>Date: {invoiceDateLabel}</p>
              <p>Heure: {invoiceTime}</p>
            </div>
          </header>

          <section className="mt-6 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-zinc-500">Client</p>
              <label className="mt-3 block text-sm text-zinc-700">
                <span className="mb-1 block font-medium">Nom / Name</span>
                <input
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="Saisir le nom du client"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-red-500"
                />
              </label>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-zinc-500">Conditions</p>
              <p className="mt-3 text-sm text-zinc-700">Paiement à la livraison</p>
              <p className="mt-1 text-sm text-zinc-700">TVA non applicable, art. 89</p>
            </div>
          </section>

          <section className="mt-6 overflow-hidden rounded-2xl border border-zinc-200">
            <table className="min-w-full divide-y divide-zinc-200 text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-600">#</th>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-600">Référence</th>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-600">Désignation</th>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-600">Qté</th>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-600">Prix unitaire</th>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-600">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white">
                {cartItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-zinc-500">
                      Aucun article dans le panier.
                    </td>
                  </tr>
                ) : (
                  cartItems.map((item, index) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-zinc-700">{index + 1}</td>
                      <td className="px-4 py-3 text-zinc-700">{item.reference}</td>
                      <td className="px-4 py-3 text-zinc-700">{item.name}</td>
                      <td className="px-4 py-3 text-zinc-700">{item.quantity}</td>
                      <td className="px-4 py-3 text-zinc-700">{item.price.toLocaleString('fr-FR')} MAD</td>
                      <td className="px-4 py-3 text-zinc-700">{(item.price * item.quantity).toLocaleString('fr-FR')} MAD</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>

          <section className="mt-6 flex justify-end">
            <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="flex items-center justify-between text-sm text-zinc-600">
                <span>Sous-total</span>
                <span>{subtotal.toLocaleString('fr-FR')} MAD</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm text-zinc-600">
                <span>TVA</span>
                <span>0.00 MAD</span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-zinc-200 pt-3 text-lg font-semibold text-zinc-900">
                <span>Total</span>
                <span>{grandTotal.toLocaleString('fr-FR')} MAD</span>
              </div>
              <p className="mt-3 text-xs text-zinc-500">TVA non applicable, art. 89</p>
            </div>
          </section>

          <footer className="mt-8 border-t border-zinc-200 pt-6 text-center text-sm text-zinc-600">
            <p className="text-lg font-semibold text-zinc-900">Merci pour votre confiance</p>
            <p className="mt-2">شكراً لثقتكم</p>
            <p className="mt-3 text-xs">Paiement: Virement bancaire / Espèces / Carte bancaire</p>
          </footer>
        </div>
      </div>

      <button
        type="button"
        onClick={() => window.print()}
        className="fixed bottom-6 right-6 rounded-full bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-900/20 print:hidden"
      >
        طباعة / Imprimer
      </button>
    </div>
  );
}
