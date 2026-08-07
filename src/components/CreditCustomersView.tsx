import type { CustomerCheck } from '../lib/types';

interface Props {
  checks: CustomerCheck[];
}

const formatCurrency = (value: number) => `${value.toFixed(2)} MAD`;

export default function CreditCustomersView({ checks }: Props) {
  const creditChecks = checks.filter((check) => !check.paid);

  return (
    <section className="rounded-3xl border border-outline-variant bg-surface-container p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-on-surface">Client credits</h3>
          <p className="text-sm text-on-surface-variant">List of unpaid customer checks.</p>
        </div>
        <span className="rounded-full bg-warning-container px-3 py-1 text-sm font-semibold text-warning">{creditChecks.length} open</span>
      </div>

      {creditChecks.length === 0 ? (
        <p className="text-sm text-on-surface-variant">No unpaid customer checks available.</p>
      ) : (
        <div className="grid gap-3">
          {creditChecks.map((check) => (
            <article key={check.id} className="rounded-3xl border border-outline-variant bg-surface-container-high p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-on-surface">{check.customer_name}</p>
                  <p className="text-sm text-on-surface-variant">{check.reference || 'No reference'}</p>
                </div>
                <p className="text-lg font-semibold text-on-surface">{formatCurrency(check.amount)}</p>
              </div>
              <p className="mt-3 text-sm text-on-surface-variant">Due: {check.due_date}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
