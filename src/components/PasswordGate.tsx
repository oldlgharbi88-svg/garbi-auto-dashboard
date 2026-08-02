import { useEffect, useState, type FormEvent, type ReactNode } from 'react';

const STORAGE_KEY = 'garbi_catalog_access';

interface PasswordGateProps {
  children: ReactNode;
}

export default function PasswordGate({ children }: PasswordGateProps) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const storedValue = window.localStorage.getItem(STORAGE_KEY);
    setIsUnlocked(storedValue === 'true');
  }, []);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const expectedPassword = import.meta.env.VITE_CATALOG_PASSWORD ?? 'garbi2024';

    if (password === expectedPassword) {
      window.localStorage.setItem(STORAGE_KEY, 'true');
      setIsUnlocked(true);
      setError('');
      return;
    }

    setError('Mot de passe incorrect. Veuillez réessayer.');
  };

  const handleLogout = () => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.removeItem(STORAGE_KEY);
    setIsUnlocked(false);
    setPassword('');
    setError('');
  };

  if (isUnlocked) {
    return (
      <div className="relative">
        <div className="absolute right-4 top-4 z-20">
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1.5 text-sm font-medium text-zinc-300 transition hover:border-red-400 hover:text-red-300"
          >
            Déconnexion
          </button>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(239,68,68,0.22),_transparent_35%),#09090b] px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950/95 p-6 shadow-2xl shadow-black/40 backdrop-blur">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600/15 text-red-500">
            <svg viewBox="0 0 24 24" className="h-7 w-7 fill-none stroke-current stroke-2" aria-hidden="true">
              <rect x="4" y="10" width="16" height="10" rx="2" />
              <path d="M8 10V8a4 4 0 1 1 8 0v2" />
            </svg>
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.35em] text-red-500">Garbi Auto Logistique</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Mot de passe requis</h2>
          <p className="mt-2 text-sm text-zinc-400">Accédez au catalogue public en saisissant le mot de passe.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <label className="block text-sm font-medium text-zinc-300" htmlFor="catalog-password">
            Mot de passe
          </label>
          <input
            id="catalog-password"
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              if (error) {
                setError('');
              }
            }}
            placeholder="Entrez le mot de passe"
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white outline-none ring-0 transition focus:border-red-500"
            autoComplete="current-password"
          />
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button
            type="submit"
            className="w-full rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-500"
          >
            Accéder au catalogue
          </button>
        </form>
      </div>
    </div>
  );
}
