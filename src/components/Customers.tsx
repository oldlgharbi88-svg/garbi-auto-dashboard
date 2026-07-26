import { useEffect, useState } from 'react';
import CustomerFormModal from './CustomerFormModal';
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

type ActiveTab = 'all' | 'debts' | 'paid';
type DebtFilter = 'all' | '7d' | '30d';
type PaidFilter = 'all' | 'week' | 'month' | 'year';
type Language = 'ar' | 'fr';

const emptyPaymentForm: PaymentFormState = {
  amount: '',
  paymentMethod: 'cash',
  paymentDate: new Date().toISOString().slice(0, 10),
  note: ''
};

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [paymentsByCustomer, setPaymentsByCustomer] = useState<Record<string | number, PaymentRecord[]>>({});
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
  const [paidFilter, setPaidFilter] = useState<PaidFilter>('all');
  const [paidSearch, setPaidSearch] = useState<string>('');
  const [selectedPaidCustomerIds, setSelectedPaidCustomerIds] = useState<Array<string | number>>([]);
  const [confirmDeleteCustomer, setConfirmDeleteCustomer] = useState<Customer | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState<boolean>(false);
  const [confirmClearPaid, setConfirmClearPaid] = useState<boolean>(false);
  const [paymentTarget, setPaymentTarget] = useState<Customer | null>(null);
  const [paymentForm, setPaymentForm] = useState<PaymentFormState>(emptyPaymentForm);
  const [paymentSubmitting, setPaymentSubmitting] = useState<boolean>(false);
  const [historyTarget, setHistoryTarget] = useState<Customer | null>(null);
  const [historyItems, setHistoryItems] = useState<PaymentRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [deletingCustomerId, setDeletingCustomerId] = useState<string | number | null>(null);
  const [deletingAll, setDeletingAll] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'regular' | 'credit' | null>(null);

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
        debts: 'Clients endettés',
        paid: 'Clients qui ont payé'
      },
      table: {
        number: '#',
        name: 'Nom',
        phone: 'Téléphone',
        balance: 'Solde',
        lastTransaction: 'Dernière transaction',
        actions: 'Actions',
        amountOwed: 'Montant dû',
        amountPaid: 'Montant payé',
        lastPayment: 'Dernier paiement',
        paymentCount: 'Nombre de paiements',
        debtSummary: 'Résumé des dettes',
        paidSummary: 'Résumé des paiements',
        totalCustomers: 'Clients avec dette',
        totalPaidCustomers: 'Clients réglés',
        totalAmount: 'Montant total dû',
        totalCollected: 'Montant total collecté',
        collect: 'Recouvrer',
        export: 'Exporter',
        deleteAll: 'Tout supprimer',
        deleteAllDisabled: 'Suppression indisponible tant qu’il existe des dettes',
        clearFilters: 'Tout effacer',
        clearFiltersDisabled: 'Impossible avec des lignes sélectionnées',
        delete: 'Supprimer',
        deleteTooltip: 'Impossible - dette en cours',
        call: 'Appeler',
        details: 'Détails',
        history: 'Voir l’historique',
        collectPayment: 'Encaisser',
        paid: 'Payé',
        paidBadge: 'Payé',
        paidButton: '✓ Payé',
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
          thirty: '30 derniers jours',
          week: 'Cette semaine',
          month: 'Ce mois',
          year: 'Cette année'
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
        debts: 'الزبناء المدينون',
        paid: 'الزبناء الدي خلّصو'
      },
      table: {
        number: '#',
        name: 'الاسم',
        phone: 'الهاتف',
        balance: 'الرصيد',
        lastTransaction: 'تاريخ آخر معاملة',
        actions: 'الإجراءات',
        amountOwed: 'المبلغ المستحق',
        amountPaid: 'المبلغ المدفوع',
        lastPayment: 'تاريخ آخر دفعة',
        paymentCount: 'عدد الدفعات',
        debtSummary: 'ملخص الديون',
        paidSummary: 'ملخص المدفوعات',
        totalCustomers: 'عدد الزبناء المدينين',
        totalPaidCustomers: 'عدد الزبناء الذين انتهوا',
        totalAmount: 'إجمالي المبلغ المستحق',
        totalCollected: 'إجمالي المبلغ المحصل',
        collect: 'تحصيل',
        export: 'تحميل كشف',
        deleteAll: 'حذف الكل',
        deleteAllDisabled: 'لا يمكن الحذف بينما توجد ديون مستحقة',
        clearFilters: 'مسح الكل',
        clearFiltersDisabled: 'غير متاح عند وجود أسطر محددة',
        delete: 'حذف',
        deleteTooltip: 'لا يمكن الحذف - يوجد ديون مستحقة',
        call: 'اتصال',
        details: 'تفاصيل',
        history: 'عرض السجل',
        collectPayment: 'تحصيل',
        paid: 'مدفوع',
        paidBadge: 'مدفوع',
        paidButton: '✓ مدفوع',
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
          thirty: 'آخر 30 يومًا',
          week: 'هذا الأسبوع',
          month: 'هذا الشهر',
          year: 'هذا العام'
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

    const [customersResponse, paymentsResponse] = await Promise.all([
      supabase.from('customers').select('*').order('name', { ascending: true }),
      supabase.from('payments').select('*').order('payment_date', { ascending: false })
    ]);

    const { data: customersData, error: customersError } = customersResponse;
    const { data: paymentsData, error: paymentsError } = paymentsResponse;

    if (customersError || paymentsError) {
      setError(labels.errors.loadFailed);
      setLoading(false);
      return;
    }

    const normalizedCustomers = (customersData ?? []).map((row: Record<string, unknown>) => {
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

    const normalizedPayments = (paymentsData ?? []).map((row: Record<string, unknown>) => ({
      id: row.id as string | number,
      customer_id: row.customer_id as string | number,
      amount: Number(row.amount ?? 0),
      payment_method: String(row.payment_method ?? 'cash'),
      payment_date: String(row.payment_date ?? ''),
      note: (row.note as string | null) ?? null,
      created_at: (row.created_at as string | null) ?? null
    })) satisfies PaymentRecord[];

    const groupedPayments: Record<string | number, PaymentRecord[]> = {};
    normalizedPayments.forEach((payment) => {
      const key = payment.customer_id;
      if (!groupedPayments[key]) {
        groupedPayments[key] = [];
      }
      groupedPayments[key].push(payment);
    });

    setCustomers(normalizedCustomers);
    setPaymentsByCustomer(groupedPayments);
    setLoading(false);
  }

  const formatCurrency = (value: number) => `${value.toLocaleString('fr-MA')} MAD`;

  const formatDate = (value: string | null) => {
    if (!value) {
      return '—';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString(language === 'ar' ? 'ar-MA' : 'fr-MA');
  };

  const getPaymentSummary = (customer: Customer) => {
    const payments = paymentsByCustomer[customer.id] ?? [];
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const lastPayment = payments[0] ?? null;
    return { payments, totalPaid, paymentCount: payments.length, lastPayment };
  };

  const debtCustomers = customers.filter((customer) => {
    const summary = getPaymentSummary(customer);
    return customer.balance > 0 || summary.paymentCount > 0;
  }).sort((left, right) => {
    const leftSummary = getPaymentSummary(left);
    const rightSummary = getPaymentSummary(right);
    const leftSettled = left.balance <= 0 && leftSummary.paymentCount > 0;
    const rightSettled = right.balance <= 0 && rightSummary.paymentCount > 0;
    if (leftSettled !== rightSettled) {
      return leftSettled ? 1 : -1;
    }

    const leftBalance = left.balance;
    const rightBalance = right.balance;
    if (leftBalance !== rightBalance) {
      return rightBalance - leftBalance;
    }

    const leftDate = leftSummary.lastPayment?.payment_date ?? left.last_transaction_date ?? '';
    const rightDate = rightSummary.lastPayment?.payment_date ?? right.last_transaction_date ?? '';
    return new Date(rightDate).getTime() - new Date(leftDate).getTime();
  });

  const hasAnyDebt = customers.some((customer) => customer.balance > 0);
  const totalDebtAmount = customers.reduce((sum, customer) => sum + customer.balance, 0);

  const paidCustomers = customers.filter((customer) => {
    const summary = getPaymentSummary(customer);
    return customer.balance <= 0 && summary.paymentCount > 0;
  }).sort((left, right) => {
    const leftSummary = getPaymentSummary(left);
    const rightSummary = getPaymentSummary(right);
    const leftDate = leftSummary.lastPayment?.payment_date ?? left.last_transaction_date ?? '';
    const rightDate = rightSummary.lastPayment?.payment_date ?? right.last_transaction_date ?? '';
    return new Date(rightDate).getTime() - new Date(leftDate).getTime();
  });

  const totalCollectedAmount = paidCustomers.reduce((sum, customer) => sum + getPaymentSummary(customer).totalPaid, 0);

  const filteredPaidCustomers = paidCustomers.filter((customer) => {
    const summary = getPaymentSummary(customer);
    const matchesSearch = customer.name.toLowerCase().includes(paidSearch.toLowerCase());

    if (!matchesSearch) {
      return false;
    }

    if (paidFilter === 'all') {
      return true;
    }

    const baseDate = summary.lastPayment?.payment_date ?? customer.last_transaction_date ?? null;
    if (!baseDate) {
      return false;
    }

    const date = new Date(baseDate);
    if (Number.isNaN(date.getTime())) {
      return false;
    }

    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (paidFilter === 'week') {
      return diffDays <= 7;
    }
    if (paidFilter === 'month') {
      return diffDays <= 30;
    }
    return diffDays <= 365;
  });

  const filteredDebtCustomers = debtCustomers.filter((customer) => {
    const summary = getPaymentSummary(customer);
    const isSettled = customer.balance <= 0 && summary.paymentCount > 0;
    if (debtFilter === 'all') {
      return true;
    }

    const date = customer.last_transaction_date ?? summary.lastPayment?.payment_date ?? null;
    if (!date) {
      return false;
    }

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) {
      return false;
    }

    const now = new Date();
    const diffDays = Math.floor((now.getTime() - parsedDate.getTime()) / (1000 * 60 * 60 * 24));
    if (debtFilter === '7d') {
      return !isSettled ? diffDays <= 7 : diffDays <= 7;
    }
    return !isSettled ? diffDays <= 30 : diffDays <= 30;
  });

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
    const { error: updateError } = await supabase.from('customers').update({ balance: nextBalance, last_transaction_date: paymentForm.paymentDate }).eq('id', paymentTarget.id);
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

  const handleClearPaidFilters = () => {
    setPaidSearch('');
    setPaidFilter('all');
    setSelectedPaidCustomerIds([]);
    setConfirmClearPaid(false);
  };

  const togglePaidSelection = (customerId: string | number) => {
    setSelectedPaidCustomerIds((current) => (current.includes(customerId) ? current.filter((value) => value !== customerId) : [...current, customerId]));
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
          className={`rounded-t-lg border-b-2 px-4 py-2 text-sm font-semibold transition-all duration-300 ${activeTab === 'all' ? 'border-red-600 text-red-600' : 'border-transparent text-on-surface-variant'}`}
        >
          {labels.tabs.all}
          <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">{customers.length}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('debts')}
          className={`rounded-t-lg border-b-2 px-4 py-2 text-sm font-semibold transition-all duration-300 ${activeTab === 'debts' ? 'border-red-600 text-red-600' : 'border-transparent text-on-surface-variant'}`}
        >
          {labels.tabs.debts}
          <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">{debtCustomers.length}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('paid')}
          className={`rounded-t-lg border-b-2 px-4 py-2 text-sm font-semibold transition-all duration-300 ${activeTab === 'paid' ? 'border-green-600 text-green-600' : 'border-transparent text-on-surface-variant'}`}
        >
          {labels.tabs.paid}
          <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">{paidCustomers.length}</span>
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
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-outline-variant bg-surface-container-high p-2">
              <button
                type="button"
                onClick={() => setModalMode('regular')}
                className="flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                <span className="text-base">+</span>
                <span>{language === 'ar' ? 'إضافة زبون' : 'Ajouter un client'}</span>
              </button>
              <button
                type="button"
                onClick={() => setModalMode('credit')}
                className="flex items-center gap-2 rounded-full border-2 border-red-600 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-600 hover:text-white"
              >
                <span className="text-base">💰</span>
                <span>{language === 'ar' ? 'إضافة زبون مدين' : 'Ajouter un client endetté'}</span>
              </button>
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
      ) : null}

      {activeTab === 'debts' ? (
        <div>
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-red-700">{labels.table.debtSummary}</h2>
                <p className="mt-1 text-sm text-red-600">{labels.table.totalCustomers}: {debtCustomers.filter((customer) => customer.balance > 0).length}</p>
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
                className={`rounded-full px-3 py-2 text-sm font-semibold transition-all duration-300 ${debtFilter === option ? 'bg-red-600 text-white' : 'border border-outline-variant bg-surface-container-high text-on-surface'}`}
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
                  filteredDebtCustomers.map((customer, index) => {
                    const summary = getPaymentSummary(customer);
                    const isSettled = customer.balance <= 0 && summary.paymentCount > 0;
                    return (
                      <tr key={customer.id} className={isSettled ? 'border-l-4 border-green-500 bg-green-900/20' : ''}>
                        <td className="px-4 py-4 text-sm text-on-surface-variant">{index + 1}</td>
                        <td className="px-4 py-4 text-sm font-medium text-on-surface">
                          <div className="flex items-center gap-2">
                            <span className={isSettled ? 'line-through opacity-80' : ''}>{customer.name}</span>
                            {isSettled ? (
                              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">{labels.table.paidBadge}</span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-on-surface-variant">{customer.phone || '—'}</td>
                        <td className={`px-4 py-4 text-sm font-semibold ${isSettled ? 'text-green-700 line-through' : 'text-red-600'}`}>
                          {formatCurrency(customer.balance)}
                        </td>
                        <td className="px-4 py-4 text-sm text-on-surface-variant">{formatDate(customer.last_transaction_date ?? summary.lastPayment?.payment_date ?? null)}</td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            {isSettled ? (
                              <button type="button" onClick={() => void handleOpenHistory(customer)} className="rounded-full border border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">
                                {labels.table.history}
                              </button>
                            ) : (
                              <>
                                <button type="button" onClick={() => handleOpenPaymentModal(customer)} className="rounded-full bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700">
                                  {labels.table.collectPayment}
                                </button>
                                <button type="button" onClick={() => void handleOpenHistory(customer)} className="rounded-full border border-outline-variant bg-surface-container-high px-3 py-2 text-sm font-semibold text-on-surface">
                                  {labels.table.details}
                                </button>
                              </>
                            )}
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
      ) : null}

      {activeTab === 'paid' ? (
        <div>
          <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-green-700">{labels.table.paidSummary}</h2>
                <p className="mt-1 text-sm text-green-600">{labels.table.totalPaidCustomers}: {paidCustomers.length}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-green-600">{labels.table.totalCollected}</p>
                <p className="text-xl font-semibold text-green-700">{formatCurrency(totalCollectedAmount)}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className="rounded-full border border-green-200 bg-white px-3 py-2 text-sm font-semibold text-green-700">
                {labels.table.export}
              </button>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="search"
                value={paidSearch}
                onChange={(event) => setPaidSearch(event.target.value)}
                placeholder={language === 'ar' ? 'ابحث بالاسم…' : 'Rechercher par nom…'}
                className="rounded-full border border-outline-variant bg-surface-container-high px-3 py-2 text-sm text-on-surface"
              />
              {(['all', 'week', 'month', 'year'] as PaidFilter[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setPaidFilter(option)}
                  className={`rounded-full px-3 py-2 text-sm font-semibold transition-all duration-300 ${paidFilter === option ? 'bg-green-600 text-white' : 'border border-outline-variant bg-surface-container-high text-on-surface'}`}
                >
                  {labels.table.filters[option === 'all' ? 'all' : option === 'week' ? 'week' : option === 'month' ? 'month' : 'year']}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setConfirmClearPaid(true)}
              disabled={selectedPaidCustomerIds.length > 0}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${selectedPaidCustomerIds.length > 0 ? 'cursor-not-allowed border border-outline-variant bg-surface-container-high text-on-surface-variant' : 'border border-green-200 bg-green-50 text-green-700 hover:bg-green-100'}`}
            >
              {labels.table.clearFilters}
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-outline-variant">
            <table className="min-w-full divide-y divide-outline-variant">
              <thead className="bg-surface-container-high">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
                    <input
                      type="checkbox"
                      checked={selectedPaidCustomerIds.length === filteredPaidCustomers.length && filteredPaidCustomers.length > 0}
                      onChange={() => {
                        if (selectedPaidCustomerIds.length === filteredPaidCustomers.length) {
                          setSelectedPaidCustomerIds([]);
                        } else {
                          setSelectedPaidCustomerIds(filteredPaidCustomers.map((customer) => customer.id));
                        }
                      }}
                      className="rounded border-outline-variant"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">{labels.table.number}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">{labels.table.name}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">{labels.table.phone}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">{labels.table.amountPaid}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">{labels.table.lastPayment}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">{labels.table.paymentCount}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">{labels.table.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant bg-surface-container">
                {filteredPaidCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-on-surface-variant">{labels.table.noData}</td>
                  </tr>
                ) : (
                  filteredPaidCustomers.map((customer, index) => {
                    const summary = getPaymentSummary(customer);
                    return (
                      <tr key={customer.id}>
                        <td className="px-4 py-4 text-sm text-on-surface-variant">
                          <input
                            type="checkbox"
                            checked={selectedPaidCustomerIds.includes(customer.id)}
                            onChange={() => togglePaidSelection(customer.id)}
                            className="rounded border-outline-variant"
                          />
                        </td>
                        <td className="px-4 py-4 text-sm text-on-surface-variant">{index + 1}</td>
                        <td className="px-4 py-4 text-sm font-medium text-on-surface">{customer.name}</td>
                        <td className="px-4 py-4 text-sm text-on-surface-variant">{customer.phone || '—'}</td>
                        <td className="px-4 py-4 text-sm font-semibold text-green-700">{formatCurrency(summary.totalPaid)}</td>
                        <td className="px-4 py-4 text-sm text-on-surface-variant">{formatDate(summary.lastPayment?.payment_date ?? customer.last_transaction_date ?? null)}</td>
                        <td className="px-4 py-4 text-sm text-on-surface-variant">{summary.paymentCount}</td>
                        <td className="px-4 py-4">
                          <button type="button" onClick={() => void handleOpenHistory(customer)} className="rounded-full border border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">
                            {labels.table.history}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {modalMode ? (
        <CustomerFormModal
          mode={modalMode}
          language={language}
          onClose={() => setModalMode(null)}
          onSuccess={() => {
            void loadCustomers();
            setFeedback(modalMode === 'regular' ? (language === 'ar' ? 'تمت إضافة الزبون بنجاح' : 'Client ajouté avec succès') : (language === 'ar' ? 'تمت إضافة الزبون المدين بنجاح' : 'Client endetté ajouté avec succès'));
          }}
        />
      ) : null}

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

      {confirmClearPaid ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-3xl bg-surface-container p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-on-surface">{labels.table.clearFilters}</h3>
            <p className="mt-3 text-sm text-on-surface-variant">{language === 'ar' ? 'هل تريد مسح المرشحات؟' : 'Voulez-vous effacer les filtres ?'}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setConfirmClearPaid(false)} className="rounded-full border border-outline-variant bg-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface">
                {labels.table.cancel}
              </button>
              <button type="button" onClick={() => handleClearPaidFilters()} className="rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">
                {labels.table.clearFilters}
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
