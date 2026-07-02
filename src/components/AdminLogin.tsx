import { useState } from 'react';

type ActiveView = 'pos' | 'inventory' | 'invoices' | 'clients' | 'customers' | 'settings' | 'reports';
type Role = 'manager' | 'employee';

interface AccessModalProps {
  pendingView: ActiveView | null;
  onSuccess: (role: Role) => void;
  onCancel: () => void;
  error: string;
}

const viewLabels: Record<ActiveView, string> = {
  pos: 'POS',
  inventory: 'Inventory',
  invoices: 'Invoices',
  clients: 'Clients',
  customers: 'Customers',
  settings: 'Settings',
  reports: 'Reports'
};

export default function AccessModal({ pendingView, onSuccess, onCancel, error }: AccessModalProps) {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string>('');

  const managerPassword = typeof window !== 'undefined' ? window.localStorage.getItem('managerPassword') ?? 'admin123' : 'admin123';
  const employeePassword = typeof window !== 'undefined' ? window.localStorage.getItem('employeePassword') ?? 'staff123' : 'staff123';

  const handlePasswordSubmit = (): void => {
    if (!selectedRole) {
      setLocalError('Please choose a role.');
      return;
    }

    const storedPassword = selectedRole === 'manager' ? managerPassword : employeePassword;
    if (password === storedPassword) {
      setLocalError('');
      onSuccess(selectedRole);
      return;
    }

    setLocalError('Incorrect password.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-3xl border border-outline-variant bg-surface-container-lowest p-6 shadow-2xl shadow-black/40">
        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.3em] text-on-surface-variant">Protected Route</p>
          <h2 className="mt-2 text-2xl font-semibold text-on-surface">Access Required</h2>
          <p className="mt-2 text-sm text-on-surface-variant">
            {pendingView ? `Enter credentials to access ${viewLabels[pendingView]}.` : 'Select a role and enter your password.'}
          </p>
        </div>

        {!selectedRole ? (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setSelectedRole('manager')}
              className="w-full rounded-2xl border border-outline-variant bg-surface-container-high px-4 py-3 text-left text-sm font-semibold text-on-surface transition hover:bg-surface-container"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Manager</p>
                  <p className="text-sm text-on-surface-variant">مدير — full access</p>
                </div>
                <span className="material-symbols-outlined">chevron_right</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('employee')}
              className="w-full rounded-2xl border border-outline-variant bg-surface-container-high px-4 py-3 text-left text-sm font-semibold text-on-surface transition hover:bg-surface-container"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Employee</p>
                  <p className="text-sm text-on-surface-variant">موظف — limited access</p>
                </div>
                <span className="material-symbols-outlined">chevron_right</span>
              </div>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-on-surface">Selected role</p>
              <p className="mt-1 text-base text-on-surface">{selectedRole === 'manager' ? 'Manager (مدير)' : 'Employee (موظف)'}</p>
            </div>

            <label className="flex flex-col gap-2 text-sm font-medium text-on-surface-variant">
              Password
              <div className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full bg-transparent text-on-surface outline-none"
                  placeholder="Enter password"
                />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="text-on-surface-variant">
                  <span className="material-symbols-outlined text-xl">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </label>
          </div>
        )}

        {(localError || error) ? (
          <p className="mt-3 text-sm text-error">{localError || error}</p>
        ) : null}

        <div className="mt-6 flex gap-3">
          {selectedRole ? (
            <button type="button" onClick={handlePasswordSubmit} className="flex-1 rounded-full bg-primary px-4 py-3 font-semibold text-on-primary">
              Continue
            </button>
          ) : null}
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full border border-outline-variant px-4 py-3 font-semibold text-on-surface"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
