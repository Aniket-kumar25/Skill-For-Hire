import Link from 'next/link';

function getGigStatusClass(status) {
  if (status === 'open') {
    return 'bg-emerald-50 text-emerald-700';
  }

  if (status === 'paused') {
    return 'bg-amber-50 text-amber-800';
  }

  if (status === 'closed') {
    return 'bg-rose-50 text-rose-700';
  }

  return 'bg-slate-100 text-slate-700';
}

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
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Your published gigs</h2>
          <p className="mt-1 text-sm text-slate-500">
            Pause or close listings when you no longer need applicants.
          </p>
        </div>
        <span className="rounded-full bg-teal-50 px-3 py-1 text-sm font-bold text-teal-700">
          {loading ? '…' : gigs.length}
        </span>
      </div>

      {loading && (
        <p className="mt-5 text-sm text-slate-500">Loading your published gigs…</p>
      )}

      {!loading && gigs.length === 0 && (
        <div className="mt-5 rounded-xl border border-dashed border-slate-200 p-8 text-center">
          <p className="font-semibold text-slate-900">No gigs published yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Create your first gig to start receiving applications from campus students.
          </p>
        </div>
      )}

      {!loading && gigs.length > 0 && (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {gigs.map((gig) => {
            const isGigBusy = Boolean(busyActions[`gig-${gig._id}`]);
            const deadlineText = formatDate(gig.deadline) || 'Not set';
            const nextStatus = gig.status === 'open' ? 'paused' : 'open';
            const skills = Array.isArray(gig.requiredSkills) ? gig.requiredSkills : [];

            let toggleButtonText = 'Reopen';
            if (isGigBusy) {
              toggleButtonText = 'Updating…';
            } else if (gig.status === 'open') {
              toggleButtonText = 'Pause';
            }

            return (
              <article
                key={gig._id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 p-5"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{gig.title}</h3>
                      {gig.category && (
                        <p className="mt-0.5 text-xs font-medium text-teal-700">{gig.category}</p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold capitalize ${getGigStatusClass(
                        gig.status
                      )}`}
                    >
                      {gig.status}
                    </span>
                  </div>

                  {gig.description && (
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                      {gig.description}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                    <span>
                      <strong className="font-semibold text-slate-800">Budget:</strong>{' '}
                      {formatBudget(gig.budgetMin)} – {formatBudget(gig.budgetMax)}
                    </span>
                    <span>
                      <strong className="font-semibold text-slate-800">Deadline:</strong>{' '}
                      {deadlineText}
                    </span>
                  </div>

                  {skills.length > 0 && (
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {skills.map((skill) => {
                        return (
                          <span
                            key={skill}
                            className="rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800"
                          >
                            {skill}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                  <Link
                    href={`/gigs/${gig._id}`}
                    className="rounded-lg border border-teal-200 px-3 py-2 text-xs font-bold text-teal-700 transition hover:bg-teal-50"
                  >
                    View gig
                  </Link>

                  {gig.status !== 'closed' && (
                    <>
                      <button
                        type="button"
                        disabled={isGigBusy}
                        onClick={() => {
                          onChangeStatus(gig._id, nextStatus);
                        }}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                      >
                        {toggleButtonText}
                      </button>

                      <button
                        type="button"
                        disabled={isGigBusy}
                        onClick={() => {
                          onChangeStatus(gig._id, 'closed');
                        }}
                        className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
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
