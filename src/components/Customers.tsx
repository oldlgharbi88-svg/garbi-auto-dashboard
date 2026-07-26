import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Customer {
  id: string | number;
  name: string;
  phone: string | null;
  balance: number;
  last_transaction_date: string | null;
}

interface PaymentRecord {
  id: string | number;
  customer_id: string | number;
  amount: number;
  payment_method: string;
  payment_date: string;
  note: string | null;
  created_at: string | null;
}

interface PaymentFormState {
  amount: string;
  paymentMethod: string;
  paymentDate: string;
  note: string;
}

type ActiveTab = 'all' | 'debts';
type DebtFilter = 'all' | '7d' | '30d';
type Language = 'ar' | 'fr';

const emptyPaymentForm: PaymentFormState = {
  amount: '',
  paymentMethod: 'cash',
  paymentDate: new Date().toISOString().slice(0, 10),
  note: ''
};

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === 'undefined') {
      return 'fr';
    }

    return window.localStorage.getItem('customersLang') === 'ar' ? 'ar' : 'fr';
  });
  const [activeTab, setActiveTab] = useState<ActiveTab>('all');
  const [debtFilter, setDebtFilter] = useState<DebtFilter>('all');
  const [confirmDeleteCustomer, setConfirmDeleteCustomer] = useState<Customer | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState<boolean>(false);
  const [paymentTarget, setPaymentTarget] = useState<Customer | null>(null);
  const [paymentForm, setPaymentForm] = useState<PaymentFormState>(emptyPaymentForm);
  const [paymentSubmitting, setPaymentSubmitting] = useState<boolean>(false);
  const [historyTarget, setHistoryTarget] = useState<Customer | null>(null);
  const [historyItems, setHistoryItems] = useState<PaymentRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [deletingCustomerId, setDeletingCustomerId] = useState<string | number | null>(null);
  const [deletingAll, setDeletingAll] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('customersLang', language);
    }
  }, [language]);

  useEffect(() => {
    void loadCustomers();
  }, []);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timer = window.setTimeout(() => setFeedback(''), 2400);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const translations = {
    fr: {
      title: 'Gestion des clients',
      subtitle: 'Suivi des clients, dettes et encaissements.',
      languageToggle: 'Français',
      tabs: {
        all: 'Tous les clients',
        debts: 'Clients endettés'
      },
      table: {
        number: '#',
        name: 'Nom',
        phone: 'Téléphone',
        balance: 'Solde',
        lastTransaction: 'Dernière transaction',
        actions: 'Actions',
        amountOwed: 'Montant dû',
        debtSummary: 'Résumé des dettes',
        totalCustomers: 'Clients avec dette',
        totalAmount: 'Montant total dû',
        collect: 'Recouvrer',
        deleteAll: 'Tout supprimer',
        deleteAllDisabled: 'Suppression indisponible tant qu’il existe des dettes',
        delete: 'Supprimer',
        deleteTooltip: 'Impossible - dette en cours',
        call: 'Appeler',
        details: 'Détails',
        collectPayment: 'Encaisser',
        paid: 'Payé',
        noData: 'Aucun client trouvé.',
        confirmDeleteTitle: 'Confirmer la suppression',
        confirmDeleteMessage: 'Êtes-vous sûr de supprimer ce client ?',
        confirmDeleteAllTitle: 'Confirmer la suppression',
        confirmDeleteAllMessage: 'Êtes-vous sûr de supprimer tous les clients ?',
        cancel: 'Annuler',
        deleteLabel: 'Supprimer',
        paymentTitle: 'Encaisser un paiement',
        paymentCustomer: 'Client',
        paymentCurrentBalance: 'Solde actuel',
        paymentAmount: 'Montant',
        paymentMethod: 'Mode de paiement',
        paymentDate: 'Date',
        paymentNote: 'Note',
        paymentConfirm: 'Confirmer',
        paymentQuickFill: 'Remplissage rapide',
        historyTitle: 'Historique des paiements',
        historyEmpty: 'Aucun paiement enregistré pour ce client.',
        filters: {
          all: 'Tout',
          seven: '7 derniers jours',
          thirty: '30 derniers jours'
        }
      },
      success: {
        deleted: 'Supprimé avec succès',
        paymentRecorded: 'Paiement enregistré avec succès',
        deletedAll: 'Tous les clients ont été supprimés'
      },
      errors: {
        loadFailed: 'Impossible de charger les clients.',
        deleteFailed: 'La suppression a échoué.',
        paymentFailed: 'L’encaissement a échoué.'
      }
    },
    ar: {
      title: 'إدارة العملاء',
      subtitle: 'متابعة العملاء والديون والمدفوعات.',
      languageToggle: 'العربية',
      tabs: {
        all: 'جميع الزبناء',
        debts: 'الزبناء المدينون'
      },
      table: {
        number: '#',
        name: 'الاسم',
        phone: 'الهاتف',
        balance: 'الرصيد',
        lastTransaction: 'تاريخ آخر معاملة',
        actions: 'الإجراءات',
        amountOwed: 'المبلغ المستحق',
        debtSummary: 'ملخص الديون',
        totalCustomers: 'عدد الزبناء المدينين',
        totalAmount: 'إجمالي المبلغ المستحق',
        collect: 'تحصيل',
        deleteAll: 'حذف الكل',
        deleteAllDisabled: 'لا يمكن الحذف بينما توجد ديون مستحقة',
        delete: 'حذف',
        deleteTooltip: 'لا يمكن الحذف - يوجد ديون مستحقة',
        call: 'اتصال',
        details: 'تفاصيل',
        collectPayment: 'تحصيل',
        paid: 'مدفوع',
        noData: 'لا يوجد زبناء.',
        confirmDeleteTitle: 'تأكيد الحذف',
        confirmDeleteMessage: 'هل أنت متأكد من حذف هذا الزبون؟',
        confirmDeleteAllTitle: 'تأكيد الحذف',
        confirmDeleteAllMessage: 'هل أنت متأكد من حذف جميع الزبناء؟',
        cancel: 'إلغاء',
        deleteLabel: 'حذف',
        paymentTitle: 'تحصيل دفعة',
        paymentCustomer: 'الزبون',
        paymentCurrentBalance: 'الرصيد الحالي',
        paymentAmount: 'المبلغ',
        paymentMethod: 'طريقة الدفع',
        paymentDate: 'التاريخ',
        paymentNote: 'ملاحظة',
        paymentConfirm: 'تأكيد الدفع',
        paymentQuickFill: 'اختيار سريع',
        historyTitle: 'سجل المدفوعات',
        historyEmpty: 'لا توجد مدفوعات مسجلة لهذا الزبون.',
        filters: {
          all: 'الكل',
          seven: 'آخر 7 أيام',
          thirty: 'آخر 30 يومًا'
        }
      },
      success: {
        deleted: 'تم الحذف بنجاح',
        paymentRecorded: 'تم تسجيل الدفع بنجاح',
        deletedAll: 'تم حذف جميع الزبناء'
      },
      errors: {
        loadFailed: 'تعذر تحميل الزبناء.',
        deleteFailed: 'فشل الحذف.',
        paymentFailed: 'فشل التحصيل.'
      }
    }
  };

  const labels = translations[language];

  async function loadCustomers() {
    setLoading(true);
    setError('');

    const { data, error: fetchError } = await supabase
      .from('customers')
      .select('*')
      .order('name', { ascending: true });

    if (fetchError) {
      setError(labels.errors.loadFailed);
      setLoading(false);
      return;
    }

    const normalizedCustomers = (data ?? []).map((row: Record<string, unknown>) => {
      const rawBalance = row.balance ?? row.amount_due ?? row.amountDue ?? 0;
      const rawDate = row.last_transaction_date ?? row.lastTransactionDate ?? row.updated_at ?? row.created_at ?? null;
      return {
        id: row.id as string | number,
        name: (row.name as string) || '—',
        phone: (row.phone as string | null) || (row.phone_number as string | null) || null,
        balance: Number(rawBalance ?? 0),
        last_transaction_date: rawDate ? String(rawDate) : null
      } satisfies Customer;
    });

    setCustomers(normalizedCustomers);
    setLoading(false);
  }

  const formatCurrency = (value: number) => `${value.toLocaleString('fr-MA')} MAD`;

  const formatDate = (value: string | null) => {
    if (!value) {
      return language === 'ar' ? '—' : '—';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString(language === 'ar' ? 'ar-MA' : 'fr-MA');
  };

  const hasDebt = (customer: Customer) => customer.balance > 0;
  const debtCustomers = customers.filter((customer) => customer.balance > 0);
  const hasAnyDebt = debtCustomers.length > 0;

  const filteredDebtCustomers = debtCustomers.filter((customer) => {
    if (debtFilter === 'all') {
      return true;
    }

    const date = customer.last_transaction_date ? new Date(customer.last_transaction_date) : null;
    if (!date || Number.isNaN(date.getTime())) {
      return false;
    }

    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    return debtFilter === '7d' ? diffDays <= 7 : diffDays <= 30;
  }).sort((left, right) => right.balance - left.balance);

  const totalDebtAmount = debtCustomers.reduce((sum, customer) => sum + customer.balance, 0);

  const handleDeleteCustomer = async (customer: Customer) => {
    if (customer.balance > 0) {
      return;
    }

    setDeletingCustomerId(customer.id);
    const { error: deleteError } = await supabase.from('customers').delete().eq('id', customer.id);

    setDeletingCustomerId(null);

    if (deleteError) {
      setError(labels.errors.deleteFailed);
      return;
    }

    setConfirmDeleteCustomer(null);
    setFeedback(labels.success.deleted);
    await loadCustomers();
  };

  const handleDeleteAllCustomers = async () => {
    if (hasAnyDebt) {
      return;
    }

    setDeletingAll(true);
    const ids = customers.map((customer) => customer.id);
    const { error: deleteError } = await supabase.from('customers').delete().in('id', ids);
    setDeletingAll(false);

    if (deleteError) {
      setError(labels.errors.deleteFailed);
      return;
    }

    setConfirmBulkDelete(false);
    setFeedback(labels.success.deletedAll);
    await loadCustomers();
  };

  const handleOpenPaymentModal = (customer: Customer) => {
    setPaymentTarget(customer);
    setPaymentForm({
      ...emptyPaymentForm,
      amount: String(customer.balance),
      paymentDate: new Date().toISOString().slice(0, 10)
    });
  };

  const handlePaymentSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!paymentTarget) {
      return;
    }

    const amount = Number(paymentForm.amount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > paymentTarget.balance) {
      setError(labels.errors.paymentFailed);
      return;
    }

    setPaymentSubmitting(true);
    const { error: insertError } = await supabase.from('payments').insert({
      customer_id: paymentTarget.id,
      amount,
      payment_method: paymentForm.paymentMethod,
      payment_date: paymentForm.paymentDate,
      note: paymentForm.note || null
    });

    if (insertError) {
      setPaymentSubmitting(false);
      setError(labels.errors.paymentFailed);
      return;
    }

    const nextBalance = Math.max(0, paymentTarget.balance - amount);
    const { error: updateError } = await supabase.from('customers').update({ balance: nextBalance }).eq('id', paymentTarget.id);
    setPaymentSubmitting(false);

    if (updateError) {
      setError(labels.errors.paymentFailed);
      return;
    }

    setPaymentTarget(null);
    setPaymentForm(emptyPaymentForm);
    setFeedback(labels.success.paymentRecorded);
    await loadCustomers();
  };

  const handleOpenHistory = async (customer: Customer) => {
    setHistoryTarget(customer);
    setHistoryLoading(true);

    const { data, error: historyError } = await supabase
      .from('payments')
      .select('*')
      .eq('customer_id', customer.id)
      .order('payment_date', { ascending: false });

    setHistoryLoading(false);

    if (historyError) {
      setHistoryItems([]);
      return;
    }

    setHistoryItems((data ?? []).map((row: Record<string, unknown>) => ({
      id: row.id as string | number,
      customer_id: row.customer_id as string | number,
      amount: Number(row.amount ?? 0),
      payment_method: String(row.payment_method ?? 'cash'),
      payment_date: String(row.payment_date ?? ''),
      note: (row.note as string | null) ?? null,
      created_at: (row.created_at as string | null) ?? null
    })));
  };

  return (
    <div className="rounded-3xl border border-outline-variant bg-surface-container p-6 shadow-2xl shadow-black/20">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-on-surface-variant">Protected Workspace</p>
          <h1 className="mt-2 text-3xl font-semibold text-on-surface">{labels.title}</h1>
          <p className="mt-1 text-sm text-on-surface-variant">{labels.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setLanguage((previous) => (previous === 'fr' ? 'ar' : 'fr'))}
            className="rounded-full border border-outline-variant bg-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface"
          >
            {labels.languageToggle}
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-3 border-b border-outline-variant pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`rounded-t-lg border-b-2 px-4 py-2 text-sm font-semibold transition ${activeTab === 'all' ? 'border-red-600 text-red-600' : 'border-transparent text-on-surface-variant'}`}
        >
          {labels.tabs.all}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('debts')}
          className={`rounded-t-lg border-b-2 px-4 py-2 text-sm font-semibold transition ${activeTab === 'debts' ? 'border-red-600 text-red-600' : 'border-transparent text-on-surface-variant'}`}
        >
          {labels.tabs.debts}
          <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">{debtCustomers.length}</span>
        </button>
      </div>

      {feedback ? (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {feedback}
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {activeTab === 'all' ? (
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-on-surface-variant">{labels.subtitle}</div>
            <button
              type="button"
              onClick={() => setConfirmBulkDelete(true)}
              disabled={hasAnyDebt || deletingAll}
              title={hasAnyDebt ? labels.table.deleteAllDisabled : ''}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${hasAnyDebt || deletingAll ? 'cursor-not-allowed border border-outline-variant bg-surface-container-high text-on-surface-variant' : 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100'}`}
            >
              {deletingAll ? '…' : labels.table.deleteAll}
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-outline-variant">
            <table className="min-w-full divide-y divide-outline-variant">
              <thead className="bg-surface-container-high">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">{labels.table.number}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">{labels.table.name}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">{labels.table.phone}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">{labels.table.balance}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">{labels.table.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant bg-surface-container">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-on-surface-variant">{labels.table.noData}</td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-on-surface-variant">{labels.table.noData}</td>
                  </tr>
                ) : (
                  customers.map((customer, index) => (
                    <tr key={customer.id}>
                      <td className="px-4 py-4 text-sm text-on-surface-variant">{index + 1}</td>
                      <td className="px-4 py-4 text-sm font-medium text-on-surface">{customer.name}</td>
                      <td className="px-4 py-4 text-sm text-on-surface-variant">{customer.phone || '—'}</td>
                      <td className={`px-4 py-4 text-sm font-semibold ${customer.balance > 0 ? 'text-red-600' : 'text-on-surface'}`}>
                        {formatCurrency(customer.balance)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteCustomer(customer)}
                            disabled={customer.balance > 0 || deletingCustomerId === customer.id}
                            title={customer.balance > 0 ? labels.table.deleteTooltip : ''}
                            className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${customer.balance > 0 || deletingCustomerId === customer.id ? 'cursor-not-allowed border-outline-variant bg-surface-container-high text-on-surface-variant' : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'}`}
                          >
                            {deletingCustomerId === customer.id ? '…' : '🗑'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-red-700">{labels.table.debtSummary}</h2>
                <p className="mt-1 text-sm text-red-600">{labels.table.totalCustomers}: {debtCustomers.length}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-red-600">{labels.table.totalAmount}</p>
                <p className="text-xl font-semibold text-red-700">{formatCurrency(totalDebtAmount)}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className="rounded-full border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700">
                {labels.table.collect}
              </button>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            {(['all', '7d', '30d'] as DebtFilter[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setDebtFilter(option)}
                className={`rounded-full px-3 py-2 text-sm font-semibold ${debtFilter === option ? 'bg-red-600 text-white' : 'border border-outline-variant bg-surface-container-high text-on-surface'}`}
              >
                {labels.table.filters[option === 'all' ? 'all' : option === '7d' ? 'seven' : 'thirty']}
              </button>
            ))}
          </div>

          <div className="overflow-hidden rounded-2xl border border-outline-variant">
            <table className="min-w-full divide-y divide-outline-variant">
              <thead className="bg-surface-container-high">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">{labels.table.number}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">{labels.table.name}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">{labels.table.phone}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">{labels.table.amountOwed}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">{labels.table.lastTransaction}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">{labels.table.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant bg-surface-container">
                {filteredDebtCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-on-surface-variant">{labels.table.noData}</td>
                  </tr>
                ) : (
                  filteredDebtCustomers.map((customer, index) => (
                    <tr key={customer.id}>
                      <td className="px-4 py-4 text-sm text-on-surface-variant">{index + 1}</td>
                      <td className="px-4 py-4 text-sm font-medium text-on-surface">{customer.name}</td>
                      <td className="px-4 py-4 text-sm text-on-surface-variant">{customer.phone || '—'}</td>
                      <td className="px-4 py-4 text-sm font-semibold text-red-600">{formatCurrency(customer.balance)}</td>
                      <td className="px-4 py-4 text-sm text-on-surface-variant">{formatDate(customer.last_transaction_date)}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => handleOpenPaymentModal(customer)} className="rounded-full bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700">
                            {labels.table.collectPayment}
                          </button>
                          <a href={`tel:${customer.phone || ''}`} className="rounded-full border border-outline-variant bg-surface-container-high px-3 py-2 text-sm font-semibold text-on-surface">
                            {labels.table.call}
                          </a>
                          <button type="button" onClick={() => void handleOpenHistory(customer)} className="rounded-full border border-outline-variant bg-surface-container-high px-3 py-2 text-sm font-semibold text-on-surface">
                            {labels.table.details}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {confirmDeleteCustomer ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-3xl bg-surface-container p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-on-surface">{labels.table.confirmDeleteTitle}</h3>
            <p className="mt-3 text-sm text-on-surface-variant">{labels.table.confirmDeleteMessage}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setConfirmDeleteCustomer(null)} className="rounded-full border border-outline-variant bg-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface">
                {labels.table.cancel}
              </button>
              <button type="button" onClick={() => void handleDeleteCustomer(confirmDeleteCustomer)} className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
                {labels.table.deleteLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {confirmBulkDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-3xl bg-surface-container p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-on-surface">{labels.table.confirmDeleteAllTitle}</h3>
            <p className="mt-3 text-sm text-on-surface-variant">{labels.table.confirmDeleteAllMessage}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setConfirmBulkDelete(false)} className="rounded-full border border-outline-variant bg-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface">
                {labels.table.cancel}
              </button>
              <button type="button" onClick={() => void handleDeleteAllCustomers()} className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
                {labels.table.deleteLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {paymentTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-xl rounded-3xl bg-surface-container p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-on-surface">{labels.table.paymentTitle}</h3>
                <p className="mt-1 text-sm text-on-surface-variant">{labels.table.paymentCustomer}: {paymentTarget.name}</p>
              </div>
              <button type="button" onClick={() => setPaymentTarget(null)} className="rounded-full border border-outline-variant bg-surface-container-high p-2 text-on-surface">
                ×
              </button>
            </div>
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
                <p className="text-sm">{labels.table.paymentCurrentBalance}</p>
                <p className="text-xl font-semibold">{formatCurrency(paymentTarget.balance)}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-on-surface">{labels.table.paymentAmount}</label>
                  <input type="number" min="1" max={paymentTarget.balance} step="0.01" value={paymentForm.amount} onChange={(event) => setPaymentForm((previous) => ({ ...previous, amount: event.target.value }))} className="w-full rounded-xl border border-outline-variant bg-surface-container-high px-3 py-2 text-on-surface" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-on-surface">{labels.table.paymentMethod}</label>
                  <select value={paymentForm.paymentMethod} onChange={(event) => setPaymentForm((previous) => ({ ...previous, paymentMethod: event.target.value }))} className="w-full rounded-xl border border-outline-variant bg-surface-container-high px-3 py-2 text-on-surface">
                    <option value="cash">{language === 'ar' ? 'نقدا' : 'Espèces'}</option>
                    <option value="cheque">{language === 'ar' ? 'شيك' : 'Chèque'}</option>
                    <option value="bank_transfer">{language === 'ar' ? 'تحويل بنكي' : 'Virement'}</option>
                    <option value="card">{language === 'ar' ? 'بطاقة' : 'Carte'}</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-semibold text-on-surface-variant">{labels.table.paymentQuickFill}</span>
                {[50, 100, 200, paymentTarget.balance].map((value) => (
                  <button key={value} type="button" onClick={() => setPaymentForm((previous) => ({ ...previous, amount: String(value) }))} className="rounded-full border border-outline-variant bg-surface-container-high px-3 py-2 text-sm font-semibold text-on-surface">
                    {value === paymentTarget.balance ? (language === 'ar' ? 'الرصيد بالكامل' : 'Solde total') : `${value}`}
                  </button>
                ))}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-on-surface">{labels.table.paymentDate}</label>
                  <input type="date" value={paymentForm.paymentDate} onChange={(event) => setPaymentForm((previous) => ({ ...previous, paymentDate: event.target.value }))} className="w-full rounded-xl border border-outline-variant bg-surface-container-high px-3 py-2 text-on-surface" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-on-surface">{labels.table.paymentNote}</label>
                  <textarea value={paymentForm.note} onChange={(event) => setPaymentForm((previous) => ({ ...previous, note: event.target.value }))} rows={4} className="w-full rounded-xl border border-outline-variant bg-surface-container-high px-3 py-2 text-on-surface" />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setPaymentTarget(null)} className="rounded-full border border-outline-variant bg-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface">
                  {labels.table.cancel}
                </button>
                <button type="submit" disabled={paymentSubmitting} className="rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70">
                  {labels.table.paymentConfirm}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {historyTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-2xl rounded-3xl bg-surface-container p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-on-surface">{labels.table.historyTitle}</h3>
                <p className="mt-1 text-sm text-on-surface-variant">{historyTarget.name}</p>
              </div>
              <button type="button" onClick={() => setHistoryTarget(null)} className="rounded-full border border-outline-variant bg-surface-container-high p-2 text-on-surface">
                ×
              </button>
            </div>
            {historyLoading ? (
              <div className="text-sm text-on-surface-variant">Chargement…</div>
            ) : historyItems.length === 0 ? (
              <div className="text-sm text-on-surface-variant">{labels.table.historyEmpty}</div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-outline-variant">
                <table className="min-w-full divide-y divide-outline-variant">
                  <thead className="bg-surface-container-high">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">Date</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">Montant</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">Mode</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant bg-surface-container">
                    {historyItems.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-4 text-sm text-on-surface-variant">{formatDate(item.payment_date)}</td>
                        <td className="px-4 py-4 text-sm font-semibold text-on-surface">{formatCurrency(item.amount)}</td>
                        <td className="px-4 py-4 text-sm text-on-surface-variant">{item.payment_method}</td>
                        <td className="px-4 py-4 text-sm text-on-surface-variant">{item.note || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
