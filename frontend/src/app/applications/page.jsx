"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SiteHeader from '../components/SiteHeader';

const GIG_API = process.env.NEXT_PUBLIC_GIG_API_URL || 'http://localhost:5001/api';

function getStatusBadgeClass(status) {
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

export default function ApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadApplications() {
      let redirecting = false;

      try {
        const response = await fetch(`${GIG_API}/gigs/student/applications/mine`, {
          credentials: 'include'
        });

        if (!active) {
          return;
        }

        if (response.status === 401) {
          redirecting = true;
          router.replace('/auth');
          return;
        }

        if (response.status === 403) {
          redirecting = true;
          router.replace('/client');
          return;
        }

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.message || 'Could not load applications');
        }

        if (active) {
          setApplications(Array.isArray(data.applications) ? data.applications : []);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Could not load applications');
        }
      } finally {
        if (active && !redirecting) {
          setLoading(false);
        }
      }
    }

    loadApplications();

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-5 py-9">
        <h1 className="text-3xl font-bold">My Applications</h1>
        <p className="mt-2 text-slate-600">Track every proposal you have submitted.</p>

        {error && (
          <p role="alert" className="mt-5 rounded-xl bg-rose-50 p-4 text-rose-700">
            {error}
          </p>
        )}

        <div className="mt-6 space-y-3">
          {loading && (
            <p className="py-12 text-center text-slate-500">Loading your applications...</p>
          )}

          {!loading &&
            applications.map((application) => {
              const hasGig = Boolean(application.gigId && application.gigId._id);
              const appliedDate = application.createdAt
                ? new Date(application.createdAt).toLocaleDateString()
                : '';
              const matchedSkills = Array.isArray(application.matchedSkills)
                ? application.matchedSkills
                : [];

              return (
                <article
                  key={application._id}
                  className="rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-bold">
                        {hasGig ? (
                          <Link
                            href={`/gigs/${application.gigId._id}`}
                            className="hover:text-teal-700 hover:underline"
                          >
                            {application.gigId.title || 'Gig'}
                          </Link>
                        ) : (
                          'Gig unavailable'
                        )}
                      </h2>
                      {appliedDate && (
                        <p className="mt-1 text-sm text-slate-500">Applied {appliedDate}</p>
                      )}
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${getStatusBadgeClass(
                        application.status
                      )}`}
                    >
                      {application.status}
                    </span>
                  </div>

                  <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">
                    {application.proposal}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-4 text-sm">
                    <span className="font-semibold text-teal-700">
                      Skill match: {application.matchScore ?? 0}%
                    </span>
                    {application.proposedBudget != null && (
                      <span className="text-slate-500">
                        Proposed: ₹{application.proposedBudget}
                      </span>
                    )}
                    {application.estimatedDays != null && (
                      <span className="text-slate-500">
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
                </article>
              );
            })}

          {!loading && !applications.length && !error && (
            <div className="rounded-2xl border border-dashed bg-white p-12 text-center">
              <h2 className="font-bold">No applications yet</h2>
              <p className="mt-1 text-sm text-slate-500">
                Browse open gigs and submit your first proposal.
              </p>
              <Link
                href="/gigs"
                className="mt-4 inline-block rounded-xl bg-teal-700 px-4 py-3 font-bold text-white hover:bg-teal-800"
              >
                Browse Gigs →
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

