interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  onLogout: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { id: 'pos', label: 'POS', icon: 'point_of_sale' },
  { id: 'inventory', label: 'Inventory', icon: 'inventory_2' },
  { id: 'invoices', label: 'Invoices', icon: 'receipt_long' },
  { id: 'clients', label: 'Clients', icon: 'groups' },
  { id: 'customers', label: 'Customers', icon: 'people' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
  { id: 'reports', label: 'Reports', icon: 'analytics' }
];

export default function Sidebar({ activeView, setActiveView, onLogout }: SidebarProps) {
  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-6 rounded-3xl border border-outline-variant bg-surface-container p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-on-surface-variant">Operations</p>
        <p className="mt-2 text-lg font-semibold text-on-surface">Garbi Auto</p>
      </div>

      <nav className="flex flex-1 flex-col gap-2">
        {navItems.map((item) => {
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveView(item.id)}
              className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                isActive
                  ? 'bg-secondary-container text-on-secondary-container shadow-lg shadow-blue-950/20'
                  : 'bg-transparent text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="material-symbols-outlined text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </span>
              {isActive ? <span className="material-symbols-outlined text-lg">chevron_right</span> : null}
            </button>
          );
        })}
      </nav>

      <div className="mt-6 border-t border-outline-variant pt-4">
        <button
          type="button"
          onClick={onLogout}
          className="w-full rounded-2xl border border-outline-variant bg-surface-container-high px-4 py-3 text-sm font-semibold text-on-surface transition hover:bg-surface-container"
        >
          <span className="material-symbols-outlined align-middle">logout</span>
          <span className="ml-2">Logout</span>
        </button>
      </div>
    </div>
  );
}
