'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SiteHeader from '../components/SiteHeader';
import {
  GIG_API,
  formatDate,
  requestJson,
  verifyClientSession
} from './clientHelpers';

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

export default function ClientDashboardPage() {
  const router = useRouter();

  const [authLoading, setAuthLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [authError, setAuthError] = useState('');
  const [clientName, setClientName] = useState('there');

  const [gigs, setGigs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState('');

  useEffect(() => {
    let active = true;

    async function checkSession() {
      let redirecting = false;

      try {
        const result = await verifyClientSession();

        if (!active) {
          return;
        }

        if (result.status === 'unauthenticated') {
          redirecting = true;
          router.replace('/auth');
          return;
        }

        if (result.status === 'forbidden') {
          redirecting = true;
          router.replace('/profile');
          return;
        }

        if (result.user?.fullName) {
          setClientName(result.user.fullName);
        }

        setAuthorized(true);
      } catch (err) {
        if (active) {
          setAuthError(err?.message || 'Could not verify your account.');
        }
      } finally {
        if (active && !redirecting) {
          setAuthLoading(false);
        }
      }
    }

    checkSession();

    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (!authorized) {
      return;
    }

    let active = true;

    async function loadDashboardData() {
      setDataLoading(true);
      setDataError('');

      try {
        const [gigsData, applicationsData] = await Promise.all([
          requestJson(`${GIG_API}/gigs/client/mine`, {}, 'Could not load your gigs.'),
          requestJson(
            `${GIG_API}/gigs/client/applications/inbox`,
            {},
            'Could not load received applications.'
          )
        ]);

        if (!active) {
          return;
        }

        if (Array.isArray(gigsData.gigs)) {
          setGigs(gigsData.gigs);
        } else {
          setGigs([]);
        }

        if (Array.isArray(applicationsData.applications)) {
          setApplications(applicationsData.applications);
        } else {
          setApplications([]);
        }
      } catch (err) {
        if (active) {
          setDataError(err?.message || 'Could not load dashboard overview.');
        }
      } finally {
        if (active) {
          setDataLoading(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      active = false;
    };
  }, [authorized]);

  const totalGigs = gigs.length;
  const openGigs = gigs.filter((gig) => {
    return gig.status === 'open';
  }).length;
  const totalApplications = applications.length;
  const pendingApplications = applications.filter((application) => {
    return application.status === 'pending';
  }).length;

  // Show only the 5 most recently received applications on the overview page.
  const recentApplications = applications.slice(0, 5);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <SiteHeader />

      <div className="mx-auto max-w-6xl px-5 py-9 sm:px-8">
        {authLoading && (
          <p className="py-16 text-center text-slate-500">Loading client dashboard…</p>
        )}

        {!authLoading && authError && (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          >
            {authError}
          </p>
        )}

        {!authLoading && !authError && authorized && (
          <>
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-teal-700">
                Client dashboard
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Welcome back, {clientName}.
              </h1>
              <p className="mt-2 max-w-2xl text-slate-600">
                Track your published gigs, monitor incoming student proposals and manage your campus hiring workflow from one place.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/client/gigs?create=true"
                  className="rounded-xl bg-teal-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-teal-800"
                >
                  + Create New Gig
                </Link>
                <Link
                  href="/client/gigs"
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-800 transition hover:border-teal-600 hover:text-teal-700"
                >
                  Manage My Gigs
                </Link>
                <Link
                  href="/client/applications"
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-800 transition hover:border-teal-600 hover:text-teal-700"
                >
                  Review Applications
                </Link>
              </div>
            </section>

            {dataError && (
              <p
                role="alert"
                className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
              >
                {dataError}
              </p>
            )}

            <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Total Published Gigs</p>
                <p className="mt-2 text-3xl font-bold text-slate-950">
                  {dataLoading ? '…' : totalGigs}
                </p>
                <Link
                  href="/client/gigs"
                  className="mt-3 inline-block text-sm font-semibold text-teal-700 hover:underline"
                >
                  View all gigs →
                </Link>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Open Gigs</p>
                <p className="mt-2 text-3xl font-bold text-teal-700">
                  {dataLoading ? '…' : openGigs}
                </p>
                <Link
                  href="/client/gigs"
                  className="mt-3 inline-block text-sm font-semibold text-teal-700 hover:underline"
                >
                  Manage listings →
                </Link>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Total Applications</p>
                <p className="mt-2 text-3xl font-bold text-slate-950">
                  {dataLoading ? '…' : totalApplications}
                </p>
                <Link
                  href="/client/applications"
                  className="mt-3 inline-block text-sm font-semibold text-teal-700 hover:underline"
                >
                  Open inbox →
                </Link>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Pending Applications</p>
                <p className="mt-2 text-3xl font-bold text-amber-700">
                  {dataLoading ? '…' : pendingApplications}
                </p>
                <Link
                  href="/client/applications"
                  className="mt-3 inline-block text-sm font-semibold text-teal-700 hover:underline"
                >
                  Review pending →
                </Link>
              </article>
            </section>

            <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Recently Received Applications
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Latest student proposals across your published gigs.
                  </p>
                </div>
                <Link
                  href="/client/applications"
                  className="text-sm font-bold text-teal-700 hover:underline"
                >
                  View all applications →
                </Link>
              </div>

              {dataLoading && (
                <p className="mt-5 text-sm text-slate-500">Loading recent applications…</p>
              )}

              {!dataLoading && recentApplications.length === 0 && (
                <div className="mt-5 rounded-xl border border-dashed border-slate-200 p-8 text-center">
                  <p className="font-semibold text-slate-900">No applications received yet</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Publish a gig and student applications will appear here as they arrive.
                  </p>
                  <Link
                    href="/client/gigs?create=true"
                    className="mt-4 inline-block rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-teal-800"
                  >
                    Create a gig →
                  </Link>
                </div>
              )}

              {!dataLoading && recentApplications.length > 0 && (
                <div className="mt-5 divide-y divide-slate-100">
                  {recentApplications.map((application) => {
                    const studentName = application.studentId?.fullName || 'Student applicant';
                    const gigTitle = application.gigId?.title || 'Gig unavailable';
                    const appliedDate = formatDate(application.createdAt);

                    return (
                      <article
                        key={application._id}
                        className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                      >
                        <div>
                          <h3 className="font-bold text-slate-900">{studentName}</h3>
                          <p className="mt-0.5 text-sm text-slate-600">
                            Applied for <span className="font-medium text-slate-800">{gigTitle}</span>
                          </p>
                          <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                            <span className="font-semibold text-teal-700">
                              Skill match: {application.matchScore ?? 0}%
                            </span>
                            {appliedDate && <span>Submitted on {appliedDate}</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${getStatusBadgeClass(
                              application.status
                            )}`}
                          >
                            {application.status}
                          </span>
                          <Link
                            href="/client/applications"
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:border-teal-300 hover:text-teal-700"
                          >
                            Review →
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
