import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface SummaryCounts {
  supplierCount: number;
  supplierAmount: number;
  customerCount: number;
  customerAmount: number;
}

export default function Dashboard() {
  const [summary, setSummary] = useState<SummaryCounts>({
    supplierCount: 0,
    supplierAmount: 0,
    customerCount: 0,
    customerAmount: 0
  });

  useEffect(() => {
    const loadSummary = async () => {
      const [supplierRes, customerRes] = await Promise.all([
        supabase.from('supplier_checks').select('amount', { head: false }),
        supabase.from('customer_checks').select('amount', { head: false })
      ]);

      const supplierRows = Array.isArray(supplierRes.data) ? supplierRes.data : [];
      const customerRows = Array.isArray(customerRes.data) ? customerRes.data : [];

      setSummary({
        supplierCount: supplierRows.length,
        supplierAmount: supplierRows.reduce((sum, row) => sum + Number(row.amount ?? 0), 0),
        customerCount: customerRows.length,
        customerAmount: customerRows.reduce((sum, row) => sum + Number(row.amount ?? 0), 0)
      });
    };

    void loadSummary();
  }, []);

  return (
    <section className="rounded-3xl border border-outline-variant bg-surface-container p-6 shadow-2xl shadow-black/10">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-on-surface-variant">Suivi des chèques</p>
          <h2 className="mt-2 text-3xl font-semibold text-on-surface">Gestion des Chèques</h2>
          <p className="mt-2 text-sm text-on-surface-variant">Gérer les chèques fournisseurs et clients depuis un même tableau de bord.</p>
        </div>
        <div className="inline-flex items-center gap-3 rounded-2xl border border-outline-variant bg-surface-container-high px-4 py-3 text-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-2xl">payments</span>
          <span>Accédez aux rapports de chèques</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-outline-variant bg-surface-container-high p-4">
          <p className="text-sm font-semibold text-on-surface-variant">Chèques Fournisseurs</p>
          <p className="mt-4 text-3xl font-semibold text-on-surface">{summary.supplierCount}</p>
          <p className="mt-2 text-sm text-on-surface-variant">Total: {summary.supplierAmount.toFixed(2)} MAD</p>
        </div>
        <div className="rounded-3xl border border-outline-variant bg-surface-container-high p-4">
          <p className="text-sm font-semibold text-on-surface-variant">Chèques Clients</p>
          <p className="mt-4 text-3xl font-semibold text-on-surface">{summary.customerCount}</p>
          <p className="mt-2 text-sm text-on-surface-variant">Total: {summary.customerAmount.toFixed(2)} MAD</p>
        </div>
      </div>
    </section>
  );
}
