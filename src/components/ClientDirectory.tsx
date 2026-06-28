import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

interface PurchaseHistoryEntry {
  id: number;
  invoiceNumber: string;
  date: string;
  itemsCount: number;
  totalAmount: number;
}

interface ClientRecord {
  id: number;
  name: string;
  phone: string;
  address: string;
  type: 'Retail' | 'Wholesale';
  totalPurchases: number;
  history: PurchaseHistoryEntry[];
}

interface ClientFormState {
  name: string;
  phone: string;
  address: string;
  type: 'Retail' | 'Wholesale';
}

interface ClientDirectoryProps {
  onNavigateToPos: (client: ClientRecord) => void;
}

const initialClients: ClientRecord[] = [
  {
    id: 1,
    name: 'Amina Benali',
    phone: '+212 6 00 11 22 33',
    address: 'Casablanca, Maarif',
    type: 'Wholesale',
    totalPurchases: 24850,
    history: [
      { id: 1, invoiceNumber: 'INV-20260628-0001', date: '2026-06-28', itemsCount: 4, totalAmount: 920 },
      { id: 2, invoiceNumber: 'INV-20260622-0004', date: '2026-06-22', itemsCount: 2, totalAmount: 540 }
    ]
  },
  {
    id: 2,
    name: 'Hassan Idrissi',
    phone: '+212 6 10 44 66 88',
    address: 'Rabat, Agdal',
    type: 'Retail',
    totalPurchases: 8750,
    history: [{ id: 3, invoiceNumber: 'INV-20260530-0008', date: '2026-05-30', itemsCount: 2, totalAmount: 360 }]
  },
  {
    id: 3,
    name: 'Sara Mouhaddine',
    phone: '+212 6 20 55 44 99',
    address: 'Marrakech, Gueliz',
    type: 'Wholesale',
    totalPurchases: 16420,
    history: [
      { id: 4, invoiceNumber: 'INV-20260511-0009', date: '2026-05-11', itemsCount: 6, totalAmount: 1340 },
      { id: 5, invoiceNumber: 'INV-20260404-0011', date: '2026-04-04', itemsCount: 3, totalAmount: 610 }
    ]
  },
  {
    id: 4,
    name: 'Karim Bensaid',
    phone: '+212 6 30 77 88 11',
    address: 'Tangier, Ville Nouvelle',
    type: 'Retail',
    totalPurchases: 5430,
    history: [{ id: 6, invoiceNumber: 'INV-20260318-0018', date: '2026-03-18', itemsCount: 1, totalAmount: 210 }]
  }
];

const emptyFormState: ClientFormState = {
  name: '',
  phone: '',
  address: '',
  type: 'Retail'
};

export default function ClientDirectory({ onNavigateToPos }: ClientDirectoryProps) {
  const [clients, setClients] = useState<ClientRecord[]>(initialClients);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [selectedClient, setSelectedClient] = useState<ClientRecord | null>(null);
  const [formState, setFormState] = useState<ClientFormState>(emptyFormState);

  const filteredClients = clients.filter((client) => {
    const query = searchTerm.toLowerCase();
    return client.name.toLowerCase().includes(query) || client.phone.toLowerCase().includes(query);
  });

  const openHistory = (client: ClientRecord) => {
    setSelectedClient(client);
    setShowHistoryModal(true);
  };

  const handleFormChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormState((previousState) => ({ ...previousState, [name]: value }));
  };

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formState.name.trim() || !formState.phone.trim()) {
      return;
    }

    const nextClient: ClientRecord = {
      id: Date.now(),
      name: formState.name.trim(),
      phone: formState.phone.trim(),
      address: formState.address.trim(),
      type: formState.type,
      totalPurchases: 0,
      history: []
    };

    setClients((previousClients) => [nextClient, ...previousClients]);
    setShowAddModal(false);
    setFormState(emptyFormState);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-outline-variant bg-surface-container p-6 shadow-2xl shadow-black/20">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-on-surface-variant">Clients / العملاء / Clients</p>
            <h1 className="mt-2 text-3xl font-semibold text-on-surface">B2B Client Directory</h1>
            <p className="mt-2 text-sm text-on-surface-variant">Professional contacts and purchasing history.</p>
          </div>
          <button type="button" onClick={() => setShowAddModal(true)} className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary">
            Add New Client
          </button>
        </div>

        <label className="mb-6 flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-high px-4 py-3 text-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-lg">search</span>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full bg-transparent outline-none"
            placeholder="Search by client name or phone…"
          />
        </label>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredClients.map((client) => (
            <div key={client.id} className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-container text-lg font-semibold text-on-secondary-container">
                    {client.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-headline-sm font-semibold text-on-surface">{client.name}</h2>
                    <span className="mt-1 inline-flex rounded-full bg-surface-variant px-3 py-1 text-xs font-semibold text-on-surface-variant">
                      {client.type}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-3 text-sm text-on-surface-variant">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">call</span>
                  <span>{client.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">location_on</span>
                  <span>{client.address}</span>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-outline-variant bg-surface-container p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-on-surface-variant">Total purchases</p>
                <p className="mt-2 font-data-tabular text-lg font-semibold text-secondary">{client.totalPurchases.toLocaleString()} MAD</p>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" onClick={() => openHistory(client)} className="rounded-full border border-outline-variant bg-surface-container-high px-3 py-2 text-sm font-semibold text-on-surface">
                  View History
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateToPos(client)}
                  className="rounded-full bg-primary px-3 py-2 text-sm font-semibold text-on-primary"
                >
                  New Sale
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showAddModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-3xl border border-outline-variant bg-surface-container p-6 shadow-2xl shadow-black/30">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-on-surface-variant">New client</p>
                <h2 className="mt-2 text-2xl font-semibold text-on-surface">Add New Client</h2>
              </div>
              <button type="button" onClick={() => setShowAddModal(false)} className="rounded-full border border-outline-variant bg-surface-container-high p-2 text-on-surface">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form className="grid gap-4" onSubmit={handleFormSubmit}>
              <label className="flex flex-col gap-2 text-sm text-on-surface-variant">
                Name
                <input name="name" value={formState.name} onChange={handleFormChange} className="bg-surface-container-lowest border border-outline-variant rounded-lg h-touch-target px-4 focus:ring-2 focus:ring-secondary-container" />
              </label>
              <label className="flex flex-col gap-2 text-sm text-on-surface-variant">
                Phone
                <input name="phone" value={formState.phone} onChange={handleFormChange} className="bg-surface-container-lowest border border-outline-variant rounded-lg h-touch-target px-4 focus:ring-2 focus:ring-secondary-container" />
              </label>
              <label className="flex flex-col gap-2 text-sm text-on-surface-variant">
                Address
                <input name="address" value={formState.address} onChange={handleFormChange} className="bg-surface-container-lowest border border-outline-variant rounded-lg h-touch-target px-4 focus:ring-2 focus:ring-secondary-container" />
              </label>
              <label className="flex flex-col gap-2 text-sm text-on-surface-variant">
                Client Type
                <select name="type" value={formState.type} onChange={handleFormChange} className="bg-surface-container-lowest border border-outline-variant rounded-lg h-touch-target px-4 focus:ring-2 focus:ring-secondary-container">
                  <option value="Retail">Retail</option>
                  <option value="Wholesale">Wholesale</option>
                </select>
              </label>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="rounded-full border border-outline-variant bg-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface">
                  Cancel
                </button>
                <button type="submit" className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary">
                  Save Client
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {showHistoryModal && selectedClient ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-3xl border border-outline-variant bg-surface-container p-6 shadow-2xl shadow-black/30">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-on-surface-variant">Purchase history</p>
                <h2 className="mt-2 text-2xl font-semibold text-on-surface">{selectedClient.name}</h2>
              </div>
              <button type="button" onClick={() => setShowHistoryModal(false)} className="rounded-full border border-outline-variant bg-surface-container-high p-2 text-on-surface">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-outline-variant">
              <table className="min-w-full divide-y divide-outline-variant">
                <thead className="bg-surface-container-high">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">Invoice Number</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">Items Count</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">Total Amount</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant bg-surface-container">
                  {selectedClient.history.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-4 py-3 text-sm text-on-surface">{entry.invoiceNumber}</td>
                      <td className="px-4 py-3 text-sm text-on-surface-variant">{entry.date}</td>
                      <td className="px-4 py-3 text-sm text-on-surface">{entry.itemsCount}</td>
                      <td className="px-4 py-3 text-sm font-data-tabular text-secondary">{entry.totalAmount.toFixed(2)} MAD</td>
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => window.print()} className="rounded-full border border-outline-variant bg-surface-container-high px-3 py-2 text-sm font-semibold text-on-surface">
                          Print
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
