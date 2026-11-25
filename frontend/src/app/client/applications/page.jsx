'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SiteHeader from '../../components/SiteHeader';
import ApplicationsInbox from '../components/ApplicationsInbox';
import {
  GIG_API,
  formatBudget,
  requestJson,
  verifyClientSession
} from '../clientHelpers';

export default function ClientApplicationsPage() {
  const router = useRouter();

  const [authLoading, setAuthLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [authError, setAuthError] = useState('');

  const [applications, setApplications] = useState([]);
  const [inboxLoading, setInboxLoading] = useState(true);

  const [busyActions, setBusyActions] = useState({});
  const [notice, setNotice] = useState(null);

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

  function showError(text) {
    setNotice({ type: 'error', text });
  }

  function showSuccess(text, showWorkLink = false) {
    setNotice({ type: 'success', text, showWorkLink });
  }

  function setActionBusy(key, isBusy) {
    setBusyActions((prev) => {
      return { ...prev, [key]: isBusy };
    });
  }

  async function loadApplications() {
    setInboxLoading(true);

    try {
      const data = await requestJson(
        `${GIG_API}/gigs/client/applications/inbox`,
        {},
        'Could not load applications.'
      );

      if (!Array.isArray(data.applications)) {
        throw new Error('Could not load applications. Please try again.');
      }

      setApplications(data.applications);
    } catch (err) {
      showError(err?.message || 'Could not load applications.');
    } finally {
      setInboxLoading(false);
    }
  }

  useEffect(() => {
    if (!authorized) {
      return;
    }

    loadApplications();
  }, [authorized]);

  async function handleReviewApplication(applicationId, status) {
    const busyKey = `app-${applicationId}`;
    if (busyActions[busyKey]) {
      return;
    }

    setActionBusy(busyKey, true);
    setNotice(null);

    try {
      await requestJson(
        `${GIG_API}/gigs/applications/${applicationId}`,
        {
          method: 'PATCH',
          body: { status }
        },
        'Could not update application.'
      );

      showSuccess(`Application ${status}.`, status === 'accepted');
      await loadApplications();
    } catch (err) {
      showError(err?.message || 'Could not update application.');
    } finally {
      setActionBusy(busyKey, false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <SiteHeader />

      <div className="mx-auto max-w-6xl px-5 py-9 sm:px-8">
        {authLoading && (
          <p className="py-16 text-center text-slate-500">Loading applications…</p>
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
            <p className="text-xs font-bold uppercase tracking-[.18em] text-teal-700">
              Client workspace
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Applications
            </h1>
            <p className="mt-2 max-w-2xl text-slate-600">
              Review student proposals, compare matched skills and accept or reject candidates for your gigs.
            </p>

            {notice?.type === 'error' && (
              <p
                role="alert"
                className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
              >
                {notice.text}
              </p>
            )}

            {notice?.type === 'success' && (
              <div
                role="status"
                className="mt-5 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900"
              >
                <span>{notice.text}</span>
                {notice.showWorkLink && (
                  <>
                    {' '}
                    Manage milestones in{' '}
                    <Link href="/work" className="font-semibold text-teal-800 underline">
                      My Work
                    </Link>
                    .
                  </>
                )}
              </div>
            )}

            <div className="mt-6">
              <ApplicationsInbox
                applications={applications}
                loading={inboxLoading}
                busyActions={busyActions}
                onReview={handleReviewApplication}
                formatBudget={formatBudget}
              />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
