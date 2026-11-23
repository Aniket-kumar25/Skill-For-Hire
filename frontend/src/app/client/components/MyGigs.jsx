import Link from 'next/link';

export default function MyGigs({
  gigs,
  loading,
  busyActions,
  onChangeStatus,
  formatBudget,
  formatDate
}) {
  return (
    <section
      id="gigs"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 lg:col-span-2"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Your published gigs</h2>
          <p className="mt-1 text-sm text-slate-500">
            Pause or close listings when you no longer need applicants.
          </p>
        </div>
        <span className="rounded-full bg-teal-50 px-3 py-1 text-sm font-bold text-teal-700">
          {loading ? '…' : gigs.length}
        </span>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-slate-500">Loading your published gigs…</p>
      ) : gigs.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">Your published gigs will appear here.</p>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {gigs.map((gig) => {
            const isGigBusy = Boolean(busyActions[`gig-${gig._id}`]);
            const deadlineText = formatDate(gig.deadline) || 'Not set';
            const nextStatus = gig.status === 'open' ? 'paused' : 'open';

            return (
              <article key={gig._id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold">{gig.title}</h3>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold capitalize">
                    {gig.status}
                  </span>
                </div>

                <p className="mt-2 text-sm text-slate-500">
                  {formatBudget(gig.budgetMin)} – {formatBudget(gig.budgetMax)} · Deadline{' '}
                  {deadlineText}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Link
                    href={`/gigs/${gig._id}`}
                    className="rounded-lg border border-teal-200 px-3 py-2 text-xs font-bold text-teal-700 hover:bg-teal-50"
                  >
                    View gig
                  </Link>

                  {gig.status !== 'closed' && (
                    <>
                      <button
                        type="button"
                        disabled={isGigBusy}
                        onClick={() => onChangeStatus(gig._id, nextStatus)}
                        className="rounded-lg border px-3 py-2 text-xs font-bold disabled:opacity-50"
                      >
                        {isGigBusy ? 'Updating…' : gig.status === 'open' ? 'Pause' : 'Reopen'}
                      </button>

                      <button
                        type="button"
                        disabled={isGigBusy}
                        onClick={() => onChangeStatus(gig._id, 'closed')}
                        className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 disabled:opacity-50"
                      >
                        Close gig
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
