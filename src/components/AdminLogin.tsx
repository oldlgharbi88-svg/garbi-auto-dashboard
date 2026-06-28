import { useState } from 'react';

interface AdminLoginProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AdminLogin({ onSuccess, onCancel }: AdminLoginProps) {
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = () => {
    const storedPassword = localStorage.getItem('adminPassword') ?? 'admin1234';

    if (password === storedPassword) {
      setError('');
      onSuccess();
      return;
    }

    setError('Incorrect password.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-3xl border border-outline-variant bg-surface-container-lowest p-6 shadow-2xl shadow-black/40">
        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.3em] text-on-surface-variant">Protected Access</p>
          <h2 className="mt-2 text-2xl font-semibold text-on-surface">Administrator Login</h2>
        </div>

        <label className="flex flex-col gap-2 text-sm font-medium text-on-surface-variant">
          Password
          <div className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full bg-transparent text-on-surface outline-none"
              placeholder="Enter admin password"
            />
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="text-on-surface-variant">
              <span className="material-symbols-outlined text-xl">{showPassword ? 'visibility_off' : 'visibility'}</span>
            </button>
          </div>
        </label>

        {error ? <p className="mt-3 text-sm text-error">{error}</p> : null}

        <div className="mt-6 flex gap-3">
          <button type="button" onClick={handleSubmit} className="flex-1 rounded-full bg-primary px-4 py-3 font-semibold text-on-primary">
            Login as Admin
          </button>
          <button type="button" onClick={onCancel} className="rounded-full border border-outline-variant px-4 py-3 font-semibold text-on-surface">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
