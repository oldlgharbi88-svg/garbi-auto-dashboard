import { useState } from 'react';

interface Customer {
  id: number;
  name: string;
  phone: string;
  amountDue: number;
}

const initialCustomers: Customer[] = [
  { id: 1, name: 'Apex Logistics', phone: '+212 6 00 11 22 33', amountDue: 12450 },
  { id: 2, name: 'MediTrans Supply', phone: '+212 6 10 44 66 88', amountDue: 7600 },
  { id: 3, name: 'Nordic Parts', phone: '+212 6 20 55 44 99', amountDue: 3210 }
];

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);

  const handleRecordPayment = (id: number): void => {
    setCustomers((previousCustomers) =>
      previousCustomers.map((customer) => (customer.id === id ? { ...customer, amountDue: 0 } : customer))
    );
  };

  return (
    <div className="rounded-3xl border border-outline-variant bg-surface-container p-6 shadow-2xl shadow-black/20">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-on-surface-variant">Protected Workspace</p>
          <h1 className="mt-2 text-3xl font-semibold text-on-surface">Customer Debt Management</h1>
        </div>
        <button type="button" className="rounded-full border border-outline-variant bg-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface">
          Export Ledger
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-outline-variant">
        <table className="min-w-full divide-y divide-outline-variant">
          <thead className="bg-surface-container-high">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">Customer Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">Phone Number</th>
              <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">Amount Due</th>
              <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant bg-surface-container">
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td className="px-4 py-4 text-sm font-medium text-on-surface">{customer.name}</td>
                <td className="px-4 py-4 text-sm text-on-surface-variant">{customer.phone}</td>
                <td className="px-4 py-4 text-sm font-semibold text-on-surface font-data-tabular">{customer.amountDue.toLocaleString()} MAD</td>
                <td className="px-4 py-4">
                  <button
                    type="button"
                    onClick={() => handleRecordPayment(customer.id)}
                    className="rounded-full border border-outline-variant bg-surface-container-high px-3 py-2 text-sm font-semibold text-on-surface"
                  >
                    {customer.amountDue > 0 ? 'Record Payment' : 'Paid'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
