import { useMemo, useState } from 'react';
import AddPaymentModal from '../components/AddPaymentModal';
import CompanyDetailModal from '../components/CompanyDetailModal';
import CompanyFormModal from '../components/CompanyFormModal';

interface CompanyRecord {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  ice: string;
  rc: string;
  address: string;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    status: string;
    createdAt: string;
  }>;
}

const initialCompanies: CompanyRecord[] = [
  {
    id: '1',
    name: 'Apex Logistics',
    contactPerson: 'Karim Bensaid',
    phone: '+212 600 112 233',
    email: 'karim@apex.ma',
    ice: '001234567890123',
    rc: 'RC123456',
    address: 'Casablanca, Maarif',
    invoices: [
      { id: 'inv-1', invoiceNumber: 'INV-001', totalAmount: 12500, paidAmount: 7000, remainingAmount: 5500, status: 'pending', createdAt: '2026-07-01' },
      { id: 'inv-2', invoiceNumber: 'INV-002', totalAmount: 8400, paidAmount: 8400, remainingAmount: 0, status: 'paid', createdAt: '2026-07-15' }
    ]
  },
  {
    id: '2',
    name: 'MediTrans Supply',
    contactPerson: 'Sara El Yami',
    phone: '+212 610 446 688',
    email: 'sara@meditrans.ma',
    ice: '001234567890124',
    rc: 'RC654321',
    address: 'Rabat, Agdal',
    invoices: [
      { id: 'inv-3', invoiceNumber: 'INV-003', totalAmount: 15420, paidAmount: 4200, remainingAmount: 11220, status: 'pending', createdAt: '2026-07-22' }
    ]
  }
];

export default function CompaniesPage() {
  const [companies, setCompanies] = useState(initialCompanies);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyRecord | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const filteredCompanies = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return companies;
    }

    return companies.filter((company) => `${company.name} ${company.contactPerson} ${company.ice}`.toLowerCase().includes(query));
  }, [companies, searchTerm]);

  const totals = useMemo(() => {
    const totalInvoiced = companies.reduce((sum, company) => sum + company.invoices.reduce((companyTotal, invoice) => companyTotal + invoice.totalAmount, 0), 0);
    const totalPaid = companies.reduce((sum, company) => sum + company.invoices.reduce((companyTotal, invoice) => companyTotal + invoice.paidAmount, 0), 0);
    const totalOutstanding = totalInvoiced - totalPaid;

    return { totalInvoiced, totalPaid, totalOutstanding };
  }, [companies]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-2xl shadow-black/20">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">Societes / Companies</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Societes</h1>
            <p className="mt-2 text-sm text-zinc-400">Suivi des societes B2B, factures et creances.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setShowAddModal(true)} className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500">
              Ajouter une societe
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_240px]">
          <label className="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-950/70 px-4 py-3 text-sm text-zinc-400">
            <span className="text-lg">🔎</span>
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full bg-transparent outline-none"
              placeholder="Rechercher une societe…"
            />
          </label>
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            <p className="text-[11px] uppercase tracking-[0.3em]">Total des creances</p>
            <p className="mt-1 text-lg font-semibold">{totals.totalOutstanding.toLocaleString('fr-FR')} MAD</p>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-800">
          <table className="min-w-full divide-y divide-zinc-800">
            <thead className="bg-zinc-950/70">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">Societe</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">Téléphone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">ICE</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">Factures</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">Montant</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">Payé</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">Restant</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 bg-zinc-900/60">
              {filteredCompanies.map((company) => {
                const totalInvoiced = company.invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
                const totalPaid = company.invoices.reduce((sum, invoice) => sum + invoice.paidAmount, 0);
                const outstanding = totalInvoiced - totalPaid;
                const lastInvoice = company.invoices[company.invoices.length - 1];

                return (
                  <tr key={company.id} className="text-sm text-zinc-200">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-white">{company.name}</p>
                        <p className="text-xs text-zinc-400">{company.address}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">{company.contactPerson}</td>
                    <td className="px-4 py-3">{company.phone}</td>
                    <td className="px-4 py-3">{company.ice}</td>
                    <td className="px-4 py-3">{company.invoices.length}</td>
                    <td className="px-4 py-3">{totalInvoiced.toLocaleString('fr-FR')} MAD</td>
                    <td className="px-4 py-3">{totalPaid.toLocaleString('fr-FR')} MAD</td>
                    <td className={`px-4 py-3 font-semibold ${outstanding > 0 ? 'text-amber-300' : 'text-emerald-300'}`}>{outstanding.toLocaleString('fr-FR')} MAD</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => { setSelectedCompany(company); setShowDetailModal(true); }} className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300">Voir</button>
                        <button type="button" onClick={() => { setSelectedCompany(company); setShowPaymentModal(true); }} className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300">Paiement</button>
                      </div>
                      {lastInvoice ? <p className="mt-2 text-[11px] text-zinc-500">Dernier: {lastInvoice.createdAt}</p> : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <CompanyFormModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={(company) => {
          setCompanies((current) => [
            {
              ...company,
              invoices: []
            },
            ...current
          ]);
          setShowAddModal(false);
        }}
      />
      <CompanyDetailModal
        open={showDetailModal}
        company={selectedCompany}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedCompany(null);
        }}
      />
      <AddPaymentModal
        open={showPaymentModal}
        company={selectedCompany}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedCompany(null);
        }}
        onSave={(invoiceNumber, amount) => {
          setCompanies((current) =>
            current.map((company) => {
              if (company.id !== selectedCompany?.id) {
                return company;
              }

              return {
                ...company,
                invoices: company.invoices.map((invoice) =>
                  invoice.invoiceNumber === invoiceNumber
                    ? {
                        ...invoice,
                        paidAmount: invoice.paidAmount + amount,
                        remainingAmount: Math.max(invoice.remainingAmount - amount, 0),
                        status: invoice.paidAmount + amount >= invoice.totalAmount ? 'paid' : 'pending'
                      }
                    : invoice
                )
              };
            })
          );
          setShowPaymentModal(false);
          setSelectedCompany(null);
        }}
      />
    </div>
  );
}
