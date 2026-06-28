import { useState } from 'react';
import Sidebar from './components/Sidebar';
import POS from './components/POS';
import Customers from './components/Customers';
import Settings from './components/Settings';
import AdminLogin from './components/AdminLogin';
import Inventory from './components/Inventory';
import InvoicePrint from './components/InvoicePrint';
import ClientDirectory from './components/ClientDirectory';

type ActiveView = 'pos' | 'customers' | 'settings' | 'inventory' | 'invoices' | 'clients';

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('pos');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [showAdminLogin, setShowAdminLogin] = useState<boolean>(false);
  const [pendingView, setPendingView] = useState<ActiveView | null>(null);

  const handleViewChange = (view: string) => {
    const targetView = view as ActiveView | 'reports';

    if (targetView === 'reports') {
      return;
    }

    if ((targetView === 'customers' || targetView === 'settings' || targetView === 'inventory' || targetView === 'clients') && !isAdmin) {
      setPendingView(targetView);
      setShowAdminLogin(true);
      return;
    }

    setActiveView(targetView);
  };

  const handleClientSelection = (client: { id: number; name: string; phone: string; address: string; type: 'Retail' | 'Wholesale'; totalPurchases: number; history: Array<{ id: number; invoiceNumber: string; date: string; itemsCount: number; totalAmount: number }> }) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('selectedClientForPos', JSON.stringify(client));
    }
    setActiveView('pos');
  };

  const handleAdminSuccess = () => {
    setIsAdmin(true);
    if (pendingView) {
      setActiveView(pendingView);
    }
    setPendingView(null);
    setShowAdminLogin(false);
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    setActiveView('pos');
    setPendingView(null);
    setShowAdminLogin(false);
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface">
      <header className="fixed inset-x-0 top-0 z-30 flex h-20 items-center justify-between border-b border-outline-variant bg-surface-container/95 px-6 backdrop-blur-xl">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-on-surface-variant">Garbi Auto Logistique</p>
          <h1 className="mt-1 text-xl font-semibold text-on-surface">Ahmad Weld Al-Gharbi Auto Parts</h1>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-high px-4 py-2 text-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-lg">search</span>
            <input className="w-48 bg-transparent outline-none" placeholder="Search tickets" />
          </label>
          {isAdmin ? (
            <button type="button" onClick={handleAdminLogout} className="rounded-full border border-outline-variant bg-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface">
              Admin Logout
            </button>
          ) : null}
        </div>
      </header>

      <div className="flex pt-20">
        <aside className="fixed left-0 top-20 h-[calc(100vh-5rem)] w-72 border-r border-outline-variant bg-surface-container/95 backdrop-blur-xl">
          <Sidebar activeView={activeView} setActiveView={handleViewChange} isAdmin={isAdmin} />
        </aside>

        <main className="ml-72 flex-1 p-6">
          {activeView === 'pos' ? <POS /> : null}
          {activeView === 'customers' && isAdmin ? <Customers /> : null}
          {activeView === 'settings' && isAdmin ? <Settings /> : null}
          {activeView === 'inventory' && isAdmin ? <Inventory /> : null}
          {activeView === 'invoices' ? <InvoicePrint /> : null}
          {activeView === 'clients' && isAdmin ? <ClientDirectory onNavigateToPos={handleClientSelection} /> : null}
        </main>
      </div>

      {showAdminLogin ? <AdminLogin onSuccess={handleAdminSuccess} onCancel={() => { setShowAdminLogin(false); setPendingView(null); }} /> : null}
    </div>
  );
}
