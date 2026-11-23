import Link from 'next/link';

function getApplicationStatusClass(status) {
  if (status === 'accepted') {
    return 'bg-emerald-50 text-emerald-700';
  }
  if (status === 'rejected') {
    return 'bg-rose-50 text-rose-700';
  }
  if (status === 'withdrawn') {
    return 'bg-slate-100 text-slate-600';
  }
  return 'bg-amber-50 text-amber-700';
}

export default function ApplicationsInbox({
  applications,
  loading,
  busyActions,
  onReview,
  formatBudget
}) {
  return (
    <section
      id="applications"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 lg:col-span-2"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Received Applications</h2>
          <p className="mt-1 text-sm text-slate-500">Review applications for your gigs.</p>
        </div>
        <span className="rounded-full bg-teal-50 px-3 py-1 text-sm font-bold text-teal-700">
          {loading ? '…' : applications.length}
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {loading ? (
          <p className="text-sm text-slate-500">Loading received applications…</p>
        ) : applications.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
            <p className="font-semibold">No applications yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Once students apply to your gigs, they will appear here.
            </p>
          </div>
        ) : (
          applications.map((application) => {
            const isAppBusy = Boolean(busyActions[`app-${application._id}`]);
            const matchedSkills = Array.isArray(application.matchedSkills)
              ? application.matchedSkills
              : [];

            return (
              <article key={application._id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold">
                      {application.studentId?.fullName || 'Student applicant'}
                    </h3>
                    {application.studentId?.email && (
                      <p className="text-xs text-slate-500">{application.studentId.email}</p>
                    )}
                    <p className="mt-1 text-sm text-slate-500">
                      {application.gigId?.title || 'Gig unavailable'}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${getApplicationStatusClass(
                      application.status
                    )}`}
                  >
                    {application.status}
                  </span>
                </div>

                <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
                  {application.proposal}
                </p>

                <div className="mt-3 flex flex-wrap gap-4 text-xs">
                  <span className="font-semibold text-teal-700">
                    Skill match: {application.matchScore ?? 0}%
                  </span>
                  {application.proposedBudget != null && (
                    <span className="text-slate-600">
                      Proposed budget: {formatBudget(application.proposedBudget)}
                    </span>
                  )}
                  {application.estimatedDays != null && (
                    <span className="text-slate-600">
                      Estimated: {application.estimatedDays}{' '}
                      {application.estimatedDays === 1 ? 'day' : 'days'}
                    </span>
                  )}
                </div>

                {matchedSkills.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">Matched skills:</span>
                    {matchedSkills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                {application.status === 'pending' && (
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      disabled={isAppBusy}
                      onClick={() => onReview(application._id, 'accepted')}
                      className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
                    >
                      {isAppBusy ? 'Updating…' : 'Accept'}
                    </button>
                    <button
                      type="button"
                      disabled={isAppBusy}
                      onClick={() => onReview(application._id, 'rejected')}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                )}

                {application.status === 'accepted' && (
                  <div className="mt-4">
                    <Link
                      href="/work"
                      className="inline-block rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-bold text-teal-800 hover:bg-teal-100"
                    >
                      My Work →
                    </Link>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
