import { useState } from 'react';
import Sidebar from './components/Sidebar';
import POS from './components/POS';
import Customers from './components/Customers';
import Settings from './components/Settings';
import ClientDirectory from './components/ClientDirectory';
import Inventory from './components/Inventory';
import InvoicePrint from './components/InvoicePrint';
import Reports from './components/Reports';
import AccessModal from './components/AdminLogin';

type ActiveView = 'pos' | 'inventory' | 'invoices' | 'clients' | 'customers' | 'settings' | 'reports';
type Role = 'none' | 'manager' | 'employee';

const canAccess = (view: ActiveView, role: Role): boolean => {
  if (view === 'pos') {
    return true;
  }

  if (role === 'manager') {
    return true;
  }

  if (role === 'employee') {
    return view === 'invoices' || view === 'clients';
  }

  return false;
};

const requiresAuth = (view: ActiveView): boolean => view !== 'pos';

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('pos');
  const [currentRole, setCurrentRole] = useState<Role>('none');
  const [showAccessModal, setShowAccessModal] = useState<boolean>(false);
  const [pendingView, setPendingView] = useState<ActiveView | null>(null);
  const [accessError, setAccessError] = useState<string>('');

  const handleViewChange = (view: ActiveView): void => {
    if (requiresAuth(view) && !canAccess(view, currentRole)) {
      setPendingView(view);
      setAccessError('');
      setShowAccessModal(true);
      return;
    }

    setActiveView(view);
  };

  const handleAccessSuccess = (role: Role): void => {
    if (!pendingView) {
      setShowAccessModal(false);
      return;
    }

    if (!canAccess(pendingView, role)) {
      setAccessError('The selected role cannot access this page. Choose the correct role.');
      return;
    }

    setCurrentRole(role);
    setActiveView(pendingView);
    setPendingView(null);
    setShowAccessModal(false);
  };

  const handleAccessCancel = (): void => {
    setPendingView(null);
    setShowAccessModal(false);
    setAccessError('');
  };

  const handleLogout = (): void => {
    setCurrentRole('none');
    setActiveView('pos');
    setPendingView(null);
    setShowAccessModal(false);
    setAccessError('');
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface">
      <header className="fixed inset-x-0 top-0 z-30 flex h-20 items-center justify-between border-b border-outline-variant bg-surface-container/95 px-6 backdrop-blur-xl">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-on-surface-variant">Garbi Auto Logistique</p>
          <h1 className="mt-1 text-xl font-semibold text-on-surface">Ahmad Weld Al-Gharbi Auto Parts</h1>
          <p className="text-sm text-on-surface-variant">
            Current role: {currentRole === 'none' ? 'None' : currentRole === 'manager' ? 'Manager (مدير)' : 'Employee (موظف)'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-high px-4 py-2 text-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-lg">search</span>
            <input className="w-48 bg-transparent outline-none" placeholder="Search tickets" />
          </label>
        </div>
      </header>

      <div className="flex pt-20">
        <aside className="fixed left-0 top-20 h-[calc(100vh-5rem)] w-72 border-r border-outline-variant bg-surface-container/95 backdrop-blur-xl">
          <Sidebar activeView={activeView} setActiveView={handleViewChange} onLogout={handleLogout} />
        </aside>

        <main className="ml-72 flex-1 p-6">
          {activeView === 'pos' ? <POS /> : null}
          {activeView === 'inventory' ? <Inventory /> : null}
          {activeView === 'invoices' ? <InvoicePrint /> : null}
          {activeView === 'clients' ? <ClientDirectory onNavigateToPos={() => setActiveView('pos')} /> : null}
          {activeView === 'customers' ? <Customers /> : null}
          {activeView === 'settings' ? <Settings /> : null}
          {activeView === 'reports' ? <Reports /> : null}
        </main>
      </div>

      {showAccessModal && (
        <AccessModal
          pendingView={pendingView}
          onSuccess={handleAccessSuccess}
          onCancel={handleAccessCancel}
          error={accessError}
        />
      )}
    </div>
  );
}
