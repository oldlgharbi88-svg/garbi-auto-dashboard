import { useEffect, useState } from 'react';

export default function Settings() {
  const [storeName, setStoreName] = useState<string>(() => {
    if (typeof window === 'undefined') {
      return 'Garbi Auto Logistique';
    }
    return window.localStorage.getItem('storeName') ?? 'Garbi Auto Logistique';
  });
  const [invoiceHeader, setInvoiceHeader] = useState<string>(() => {
    if (typeof window === 'undefined') {
      return 'Ahmad Weld Al-Gharbi Auto Parts';
    }
    return window.localStorage.getItem('invoiceHeader') ?? 'Ahmad Weld Al-Gharbi Auto Parts';
  });
  const [phoneNumber, setPhoneNumber] = useState<string>(() => {
    if (typeof window === 'undefined') {
      return '+212 5 22 11 22 33';
    }
    return window.localStorage.getItem('phoneNumber') ?? '+212 5 22 11 22 33';
  });
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('storeName', storeName);
    }
  }, [storeName]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('invoiceHeader', invoiceHeader);
    }
  }, [invoiceHeader]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('phoneNumber', phoneNumber);
    }
  }, [phoneNumber]);

  const handlePasswordSave = (): void => {
    const storedPassword = window.localStorage.getItem('adminPassword') ?? 'admin1234';

    if (currentPassword !== storedPassword) {
      setMessage('Current password is incorrect.');
      return;
    }

    if (!newPassword || newPassword !== confirmPassword) {
      setMessage('Please confirm the new password correctly.');
      return;
    }

    window.localStorage.setItem('adminPassword', newPassword);
    setMessage('Admin password updated.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-outline-variant bg-surface-container p-6 shadow-2xl shadow-black/20">
        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.3em] text-on-surface-variant">Protected Workspace</p>
          <h1 className="mt-2 text-3xl font-semibold text-on-surface">Settings</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-on-surface-variant">
            Store Name
            <input
              value={storeName}
              onChange={(event) => setStoreName(event.target.value)}
              className="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-on-surface"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-on-surface-variant">
            Invoice Header
            <input
              value={invoiceHeader}
              onChange={(event) => setInvoiceHeader(event.target.value)}
              className="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-on-surface"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-on-surface-variant md:col-span-2">
            Phone Number
            <input
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              className="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-on-surface"
            />
          </label>
        </div>
      </div>

      <div className="rounded-3xl border border-outline-variant bg-surface-container p-6 shadow-2xl shadow-black/20">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-on-surface">Change Admin Password</h2>
          <p className="mt-2 text-sm text-on-surface-variant">The password is stored securely in localStorage.</p>
        </div>

        <div className="grid gap-4">
          <label className="flex flex-col gap-2 text-sm font-medium text-on-surface-variant">
            Current Password
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-on-surface"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-on-surface-variant">
            New Password
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-on-surface"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-on-surface-variant">
            Confirm New Password
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-on-surface"
            />
          </label>

          {message ? <p className="text-sm text-error">{message}</p> : null}

          <button type="button" onClick={handlePasswordSave} className="w-fit rounded-full bg-primary px-5 py-3 font-semibold text-on-primary">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
