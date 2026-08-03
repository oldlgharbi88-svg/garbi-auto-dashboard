import { useMemo, useState } from 'react';
import CustomerDetailModal from '../components/CustomerDetailModal';
import CustomerCreateModal from '../components/CustomerCreateModal';

interface CustomerRecord {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  notes: string;
  totalCredit: number;
  totalPaid: number;
  remainingBalance: number;
  lastPaymentDate: string | null;
  status: 'À jour' | 'En retard';
  overdueDays: number;
}

const initialCustomers: CustomerRecord[] = [
  {
    id: 'cust-1',
    name: 'Amina Benali',
    phone: '+212 600 112 233',
    email: 'amina@example.com',
    address: 'Rue Hassan II',
    city: 'Casablanca',
    notes: 'Compte VIP',
    totalCredit: 18000,
    totalPaid: 7000,
    remainingBalance: 11000,
    lastPaymentDate: '2026-07-18',
    status: 'En retard',
    overdueDays: 45
  },
  {
    id: 'cust-2',
    name: 'Hassan Idrissi',
    phone: '+212 610 446 688',
    email: 'hassan@example.com',
    address: 'Bd Mohammed V',
    city: 'Rabat',
    notes: '',
    totalCredit: 9500,
    totalPaid: 9500,
    remainingBalance: 0,
    lastPaymentDate: '2026-07-25',
    status: 'À jour',
    overdueDays: 0
  }
];

export default function CustomersPage() {
  const [customers, setCustomers] = useState(initialCustomers);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const filteredCustomers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return customers;

    return customers.filter((customer) => `${customer.name} ${customer.phone} ${customer.city}`.toLowerCase().includes(query));
  }, [customers, searchTerm]);

  const totalDebt = useMemo(() => customers.reduce((sum, customer) => sum + customer.remainingBalance, 0), [customers]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-2xl shadow-black/20">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">Clients / الزبناء</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Clients</h1>
            <p className="mt-2 text-sm text-zinc-400">Clients ayant un crédit en cours</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setShowAddModal(true)} className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500">
              Ajouter un client
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_260px]">
          <label className="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-950/70 px-4 py-3 text-sm text-zinc-400">
            <span className="text-lg">🔎</span>
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="w-full bg-transparent outline-none" placeholder="Rechercher un client…" />
          </label>
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            <p className="text-[11px] uppercase tracking-[0.3em]">Total des créances clients</p>
            <p className="mt-1 text-lg font-semibold">{totalDebt.toLocaleString('fr-FR')} MAD</p>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-800">
          <table className="min-w-full divide-y divide-zinc-800">
            <thead className="bg-zinc-950/70">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">Client</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">Téléphone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">Ville</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">Crédit</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">Payé</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">Reste</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">Statut</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 bg-zinc-900/60">
              {filteredCustomers.sort((a, b) => b.remainingBalance - a.remainingBalance).map((customer) => (
                <tr key={customer.id} className="text-sm text-zinc-200">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-semibold text-white">{customer.name}</p>
                      <p className="text-xs text-zinc-400">{customer.address}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">{customer.phone}</td>
                  <td className="px-4 py-3">{customer.city}</td>
                  <td className="px-4 py-3">{customer.totalCredit.toLocaleString('fr-FR')} MAD</td>
                  <td className="px-4 py-3">{customer.totalPaid.toLocaleString('fr-FR')} MAD</td>
                  <td className={`px-4 py-3 font-semibold ${customer.remainingBalance > 0 ? 'text-amber-300' : 'text-emerald-300'}`}>{customer.remainingBalance.toLocaleString('fr-FR')} MAD</td>
                  <td className="px-4 py-3">
                    {customer.remainingBalance > 0 ? <span className="rounded-full bg-amber-500/20 px-2.5 py-1 text-[11px] font-semibold text-amber-300">À payer</span> : <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">À jour</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => { setSelectedCustomer(customer); setShowDetailModal(true); }} className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300">Voir</button>
                      <button type="button" className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300">Paiement</button>
                      <button type="button" className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300">Relance</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <CustomerCreateModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={(customer) => {
          setCustomers((current) => [
            {
              id: `customer-${Date.now()}`,
              name: customer.name,
              phone: customer.phone,
              email: customer.email,
              address: customer.address,
              city: customer.city,
              notes: customer.notes,
              totalCredit: customer.initialCredit ?? 0,
              totalPaid: 0,
              remainingBalance: customer.initialCredit ?? 0,
              lastPaymentDate: null,
              status: (customer.initialCredit ?? 0) > 0 ? 'En retard' : 'À jour',
              overdueDays: 0
            },
            ...current
          ]);
          setShowAddModal(false);
        }}
      />
      <CustomerDetailModal open={showDetailModal} customer={selectedCustomer} onClose={() => { setShowDetailModal(false); setSelectedCustomer(null); }} />
    </div>
  );
}
