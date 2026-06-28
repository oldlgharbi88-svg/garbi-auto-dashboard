interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  isAdmin: boolean;
}

interface NavItem {
  id: string;
  label: string;
  icon: string;
  adminOnly: boolean;
}

const navItems: NavItem[] = [
  { id: 'pos', label: 'POS', icon: 'point_of_sale', adminOnly: false },
  { id: 'inventory', label: 'Inventory / المخزون / Inventaire', icon: 'inventory_2', adminOnly: true },
  { id: 'invoices', label: 'Invoices / الفواتير / Factures', icon: 'receipt_long', adminOnly: false },
  { id: 'clients', label: 'Clients / العملاء / Clients', icon: 'contacts', adminOnly: true },
  { id: 'customers', label: 'Customers', icon: 'groups', adminOnly: true },
  { id: 'settings', label: 'Settings', icon: 'settings', adminOnly: true },
  { id: 'reports', label: 'Reports', icon: 'analytics', adminOnly: true }
];

export default function Sidebar({ activeView, setActiveView, isAdmin }: SidebarProps) {
  const visibleItems = navItems;

  return (
    <nav className="flex flex-col gap-2 p-4">
      <div className="mb-6 rounded-3xl border border-outline-variant bg-surface-container p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-on-surface-variant">Operations</p>
        <p className="mt-2 text-lg font-semibold text-on-surface">Garbi Auto</p>
      </div>

      {visibleItems.map((item) => {
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
  );
}
