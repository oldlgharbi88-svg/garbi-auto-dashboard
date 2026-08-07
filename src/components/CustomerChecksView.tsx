import { useMemo } from 'react';
import { CustomerCheck } from '../lib/types';

interface Props {
  checks: CustomerCheck[];
}

export default function CustomerChecksView({ checks }: Props) {
  const openChecks = useMemo(
    () => checks.filter((check) => !check.paid),
    [checks]
  );

  const paidChecks = useMemo(
    () => checks.filter((check) => check.paid),
    [checks]
  );

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-outline-variant bg-surface-container p-5">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-on-surface">Chèques clients ouverts</h3>
            <p className="text-sm text-on-surface-variant">Voir les chèques clients qui n'ont pas encore été payés.</p>
          </div>
          <span className="rounded-full bg-warning-container px-3 py-1 text-sm font-semibold text-warning">{openChecks.length} ouverts</span>
        </div>

        <div className="grid gap-3">
          {openChecks.length === 0 ? (
            <p className="text-sm text-on-surface-variant">Aucun chèque client ouvert.</p>
          ) : (
            openChecks.map((check) => (
              <article key={check.id} className="rounded-3xl border border-outline-variant bg-surface-container-high p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-on-surface">{check.customer_name}</p>
                    <p className="text-sm text-on-surface-variant">{check.reference || 'Référence non disponible'}</p>
                  </div>
                  <p className="text-xl font-semibold text-on-surface">{Number(check.amount).toFixed(2)} MAD</p>
                </div>
                <p className="mt-3 text-sm text-on-surface-variant">Échéance: {check.due_date}</p>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-outline-variant bg-surface-container p-5">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-on-surface">Chèques clients payés</h3>
            <p className="text-sm text-on-surface-variant">Suivi des paiements déjà réalisés auprès des clients.</p>
          </div>
          <span className="rounded-full bg-success-container px-3 py-1 text-sm font-semibold text-success">{paidChecks.length} payés</span>
        </div>

        <div className="grid gap-3">
          {paidChecks.length === 0 ? (
            <p className="text-sm text-on-surface-variant">Aucun chèque client payé.</p>
          ) : (
            paidChecks.map((check) => (
              <article key={check.id} className="rounded-3xl border border-outline-variant bg-surface-container-high p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-on-surface">{check.customer_name}</p>
                    <p className="text-sm text-on-surface-variant">{check.reference || 'Référence non disponible'}</p>
                  </div>
                  <p className="text-xl font-semibold text-success">{Number(check.amount).toFixed(2)} MAD</p>
                </div>
                <p className="mt-3 text-sm text-on-surface-variant">Payé le: {check.paid_date || 'N/A'}</p>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
