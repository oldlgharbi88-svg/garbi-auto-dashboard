import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import SupplierChecks from './SupplierChecks';
import CustomerChecks from './CustomerChecks';

const formatCurrency = (value: number) => `${value.toFixed(2)} MAD`;

export default function ChecksManagement() {
  const [activeTab, setActiveTab] = useState<'supplier' | 'customer'>('supplier');
  const [supplierCount, setSupplierCount] = useState(0);
  const [supplierAmount, setSupplierAmount] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);
  const [customerAmount, setCustomerAmount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSummary = async () => {
      setLoading(true);
      try {
        const [supplierResponse, customerResponse] = await Promise.all([
          supabase.from('supplier_checks').select('amount'),
          supabase.from('customer_checks').select('amount')
        ]);

        const supplierRows = Array.isArray(supplierResponse.data) ? supplierResponse.data : [];
        const customerRows = Array.isArray(customerResponse.data) ? customerResponse.data : [];

        setSupplierCount(supplierRows.length);
        setSupplierAmount(supplierRows.reduce((sum, row) => sum + Number(row.amount ?? 0), 0));
        setCustomerCount(customerRows.length);
        setCustomerAmount(customerRows.reduce((sum, row) => sum + Number(row.amount ?? 0), 0));
      } catch {
        setSupplierCount(0);
        setSupplierAmount(0);
        setCustomerCount(0);
        setCustomerAmount(0);
      } finally {
        setLoading(false);
      }
    };

    void loadSummary();
  }, []);

  const tabs = useMemo(
    () => [
      { id: 'supplier' as const, label: 'Supplier Checks' },
      { id: 'customer' as const, label: 'Customer Checks' }
    ],
    []
  );

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-outline-variant bg-surface-container p-6 shadow-2xl shadow-black/10">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-on-surface-variant">Chèques</p>
            <h1 className="mt-2 text-3xl font-semibold text-on-surface">Gestion des chèques</h1>
            <p className="mt-2 text-sm text-on-surface-variant">Suivez les chèques fournisseurs et clients dans un seul espace.</p>
          </div>
          <div className="inline-flex items-center gap-3 rounded-2xl border border-outline-variant bg-surface-container-high px-4 py-3 text-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-2xl">check_circle</span>
            <span>Statut centralisé</span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-outline-variant bg-surface-container-high p-5">
            <p className="text-sm font-semibold text-on-surface-variant">Fournisseurs</p>
            <p className="mt-4 text-3xl font-semibold text-on-surface">{supplierCount}</p>
            <p className="mt-2 text-sm text-on-surface-variant">Total des chèques: {formatCurrency(supplierAmount)}</p>
          </div>
          <div className="rounded-3xl border border-outline-variant bg-surface-container-high p-5">
            <p className="text-sm font-semibold text-on-surface-variant">Clients</p>
            <p className="mt-4 text-3xl font-semibold text-on-surface">{customerCount}</p>
            <p className="mt-2 text-sm text-on-surface-variant">Total des chèques: {formatCurrency(customerAmount)}</p>
          </div>
        </div>
      </section>

      <div className="rounded-3xl border border-outline-variant bg-surface-container p-4 shadow-2xl shadow-black/5">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-secondary-container text-on-secondary-container'
                    : 'bg-surface-container-high text-on-surface hover:bg-surface-container-high'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === 'supplier' ? <SupplierChecks /> : <CustomerChecks />}

      {loading ? (
        <div className="rounded-3xl border border-outline-variant bg-surface-container p-5 text-sm text-on-surface-variant">Chargement des données de chèques…</div>
      ) : null}
    </div>
  );
}
