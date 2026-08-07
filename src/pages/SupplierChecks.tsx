import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { SupplierCheck } from '../lib/types';
import AddSupplierCheckModal from '../components/AddSupplierCheckModal';
import CheckDetailModal from '../components/CheckDetailModal';

const statusForCheck = (check: SupplierCheck): 'paid' | 'pending' | 'overdue' => {
  if (check.paid) {
    return 'paid';
  }
  if (new Date(check.due_date) < new Date()) {
    return 'overdue';
  }
  return 'pending';
};

const badgeClass = (status: 'paid' | 'pending' | 'overdue') => {
  switch (status) {
    case 'paid':
      return 'bg-success-container text-success';
    case 'overdue':
      return 'bg-error-container text-error';
    default:
      return 'bg-warning-container text-warning';
  }
};

const formatCurrency = (value: number) => `${value.toFixed(2)} MAD`;

export default function SupplierChecks() {
  const [checks, setChecks] = useState<SupplierCheck[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [selectedSupplier, setSelectedSupplier] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState<SupplierCheck | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');

  const refreshData = async () => {
    setLoading(true);
    setActionError('');

    const { data, error } = await supabase
      .from('supplier_checks')
      .select('*')
      .order('due_date', { ascending: false });

    if (error) {
      setActionError('Unable to load supplier checks.');
      setLoading(false);
      return;
    }

    setChecks((data ?? []) as SupplierCheck[]);
    setLoading(false);
  };

  useEffect(() => {
    void refreshData();
  }, []);

  const supplierOptions = useMemo(() => {
    const values = new Set(checks.map((check) => check.supplier_name));
    return Array.from(values).sort();
  }, [checks]);

  const filteredChecks = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return checks.filter((check) => {
      const status = statusForCheck(check);
      const matchesTab = activeTab === 'all' ? true : status === activeTab;
      const matchesFilter = statusFilter === 'all' ? true : status === statusFilter;
      const matchesSearch = !query || [check.supplier_name, check.reference ?? ''].some((value) => value.toLowerCase().includes(query));
      const matchesSupplier = selectedSupplier === 'all' ? true : check.supplier_name === selectedSupplier;
      const dueDate = new Date(check.due_date);
      const matchesDateFrom = !dateFrom || dueDate >= new Date(dateFrom);
      const matchesDateTo = !dateTo || dueDate <= new Date(dateTo);
      return matchesTab && matchesFilter && matchesSearch && matchesSupplier && matchesDateFrom && matchesDateTo;
    });
  }, [activeTab, checks, dateFrom, dateTo, searchTerm, selectedSupplier, statusFilter]);

  const summary = useMemo(() => {
    const now = new Date();
    const thisMonth = checks.filter((check) => {
      const dueDate = new Date(check.due_date);
      return dueDate.getMonth() === now.getMonth() && dueDate.getFullYear() === now.getFullYear();
    });

    return {
      total: checks.length,
      amount: checks.reduce((sum, check) => sum + Number(check.amount || 0), 0),
      paidAmount: checks.filter((check) => check.paid).reduce((sum, check) => sum + Number(check.amount || 0), 0),
      pendingAmount: checks.filter((check) => !check.paid).reduce((sum, check) => sum + Number(check.amount || 0), 0),
      thisMonthCount: thisMonth.length,
      thisMonthAmount: thisMonth.reduce((sum, check) => sum + Number(check.amount || 0), 0)
    };
  }, [checks]);

  const handleSaveCheck = async (newCheck: Omit<SupplierCheck, 'id' | 'created_at' | 'updated_at'>) => {
    const { error } = await supabase.from('supplier_checks').insert([newCheck]);
    if (error) {
      throw error;
    }
    await refreshData();
  };

  const handleMarkAsPaid = async () => {
    if (!selectedCheck) return;

    const { error } = await supabase
      .from('supplier_checks')
      .update({ paid: true, paid_date: new Date().toISOString().slice(0, 10) })
      .eq('id', selectedCheck.id);

    if (error) {
      setActionError('Unable to update check status.');
      return;
    }

    setSelectedCheck((current) => (current ? { ...current, paid: true, paid_date: new Date().toISOString().slice(0, 10) } : null));
    await refreshData();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-outline-variant bg-surface-container p-6 shadow-2xl shadow-black/20">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-on-surface-variant">Supplier checks</p>
            <h1 className="mt-2 text-3xl font-semibold text-on-surface">Fournisseurs</h1>
            <p className="mt-2 text-sm text-on-surface-variant">Rechercher, filtrer et suivre l’état des chèques fournisseurs.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setShowModal(true)} className="rounded-full bg-primary px-4 py-3 text-sm font-semibold text-on-primary transition hover:bg-primary/90">
              Add supplier check
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_260px]">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <label className="rounded-3xl border border-outline-variant bg-surface-container-high p-4">
              <p className="text-sm text-on-surface-variant">Total checks</p>
              <p className="mt-2 text-2xl font-semibold text-on-surface">{summary.total}</p>
            </label>
            <label className="rounded-3xl border border-outline-variant bg-surface-container-high p-4">
              <p className="text-sm text-on-surface-variant">Total amount</p>
              <p className="mt-2 text-2xl font-semibold text-on-surface">{formatCurrency(summary.amount)}</p>
            </label>
            <label className="rounded-3xl border border-outline-variant bg-surface-container-high p-4">
              <p className="text-sm text-on-surface-variant">Paid amount</p>
              <p className="mt-2 text-2xl font-semibold text-on-surface">{formatCurrency(summary.paidAmount)}</p>
            </label>
            <label className="rounded-3xl border border-outline-variant bg-surface-container-high p-4">
              <p className="text-sm text-on-surface-variant">Pending amount</p>
              <p className="mt-2 text-2xl font-semibold text-on-surface">{formatCurrency(summary.pendingAmount)}</p>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="rounded-3xl border border-outline-variant bg-surface-container-high p-4">
              <p className="text-sm text-on-surface-variant">This month</p>
              <p className="mt-2 text-2xl font-semibold text-on-surface">{summary.thisMonthCount}</p>
              <p className="text-sm text-on-surface-variant">{formatCurrency(summary.thisMonthAmount)}</p>
            </label>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-outline-variant bg-surface-container p-5 shadow-2xl shadow-black/10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {(['all', 'paid', 'pending', 'overdue'] as const).map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isActive ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-high text-on-surface hover:bg-surface-container'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-4">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search supplier or reference"
              className="rounded-2xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
              className="rounded-2xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none"
            >
              <option value="all">All statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
            <select
              value={selectedSupplier}
              onChange={(event) => setSelectedSupplier(event.target.value)}
              className="rounded-2xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none"
            >
              <option value="all">All suppliers</option>
              {supplierOptions.map((supplier) => (
                <option key={supplier} value={supplier}>{supplier}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl border border-outline-variant">
          <table className="min-w-full divide-y divide-outline-variant text-sm text-on-surface">
            <thead className="bg-surface-container-high">
              <tr>
                <th className="px-4 py-4 text-left font-semibold text-on-surface-variant">Supplier</th>
                <th className="px-4 py-4 text-left font-semibold text-on-surface-variant">Reference</th>
                <th className="px-4 py-4 text-left font-semibold text-on-surface-variant">Due date</th>
                <th className="px-4 py-4 text-left font-semibold text-on-surface-variant">Amount</th>
                <th className="px-4 py-4 text-left font-semibold text-on-surface-variant">Status</th>
                <th className="px-4 py-4 text-left font-semibold text-on-surface-variant">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant bg-surface-container">
              {filteredChecks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-on-surface-variant">No supplier checks found.</td>
                </tr>
              ) : (
                filteredChecks.map((check) => {
                  const status = statusForCheck(check);
                  return (
                    <tr key={check.id} className="border-b border-outline-variant hover:bg-surface-container-highest">
                      <td className="px-4 py-4">{check.supplier_name}</td>
                      <td className="px-4 py-4">{check.reference || '—'}</td>
                      <td className="px-4 py-4">{check.due_date}</td>
                      <td className="px-4 py-4">{formatCurrency(check.amount)}</td>
                      <td className="px-4 py-4">
                        <span className={`${badgeClass(status)} rounded-full px-3 py-1 text-xs font-semibold`}>{status}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => { setSelectedCheck(check); setShowDetailModal(true); }}
                            className="rounded-full border border-outline-variant bg-surface-container-high px-3 py-2 text-xs font-semibold text-on-surface transition hover:bg-surface-container"
                          >
                            View
                          </button>
                          {!check.paid ? (
                            <button
                              type="button"
                              onClick={async () => {
                                setSelectedCheck(check);
                                await handleMarkAsPaid();
                              }}
                              className="rounded-full bg-success px-3 py-2 text-xs font-semibold text-on-primary transition hover:bg-success/90"
                            >
                              Mark paid
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedCheck ? (
        <CheckDetailModal open={showDetailModal} check={selectedCheck} onClose={() => setShowDetailModal(false)} onMarkPaid={handleMarkAsPaid} />
      ) : null}

      <AddSupplierCheckModal open={showModal} onClose={() => setShowModal(false)} onSave={handleSaveCheck} />

      {actionError ? <div className="rounded-3xl border border-error bg-error-container p-4 text-sm text-error">{actionError}</div> : null}
      {loading ? <div className="rounded-3xl border border-outline-variant bg-surface-container p-4 text-sm text-on-surface-variant">Loading supplier checks…</div> : null}
    </div>
  );
}
