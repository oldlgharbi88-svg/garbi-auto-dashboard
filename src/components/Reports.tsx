export default function Reports() {
  return (
    <div className="rounded-3xl border border-outline-variant bg-surface-container p-6 shadow-2xl shadow-black/20">
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.3em] text-on-surface-variant">Reports / تقارير</p>
        <h1 className="mt-2 text-3xl font-semibold text-on-surface">Business Insights</h1>
        <p className="mt-2 text-sm text-on-surface-variant">View summaries and analytics for sales, inventory and customer activity.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-outline-variant bg-surface-container-high p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-on-surface-variant">Recent sales</p>
          <p className="mt-3 text-sm text-on-surface-variant">A quick summary of invoices and revenue trends.</p>
        </div>
        <div className="rounded-2xl border border-outline-variant bg-surface-container-high p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-on-surface-variant">Inventory health</p>
          <p className="mt-3 text-sm text-on-surface-variant">Stock levels, low inventory alerts and product movement.</p>
        </div>
        <div className="rounded-2xl border border-outline-variant bg-surface-container-high p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-on-surface-variant">Customer activity</p>
          <p className="mt-3 text-sm text-on-surface-variant">Tracking customer interactions and purchases.</p>
        </div>
        <div className="rounded-2xl border border-outline-variant bg-surface-container-high p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-on-surface-variant">Access control</p>
          <p className="mt-3 text-sm text-on-surface-variant">Manager can view all reports; employees are limited to POS and invoice workflows.</p>
        </div>
      </div>
    </div>
  );
}
