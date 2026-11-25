'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SiteHeader from '../../components/SiteHeader';
import CreateGigForm from '../components/CreateGigForm';
import MyGigs from '../components/MyGigs';
import {
  GIG_API,
  INITIAL_GIG_FORM,
  formatBudget,
  formatDate,
  requestJson,
  validateGigForm,
  verifyClientSession
} from '../clientHelpers';

export default function ClientGigsPage() {
  const router = useRouter();

  const [authLoading, setAuthLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [authError, setAuthError] = useState('');

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState(INITIAL_GIG_FORM);
  const [submittingGig, setSubmittingGig] = useState(false);

  const [myGigs, setMyGigs] = useState([]);
  const [gigsLoading, setGigsLoading] = useState(true);

  const [busyActions, setBusyActions] = useState({});
  const [notice, setNotice] = useState(null);

  // Open the Create Gig form automatically when coming from the Dashboard quick action button.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('create') === 'true') {
      setShowCreateForm(true);
    }
  }, []);

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

  function showSuccess(text) {
    setNotice({ type: 'success', text });
  }

  function setActionBusy(key, isBusy) {
    setBusyActions((prev) => {
      return { ...prev, [key]: isBusy };
    });
  }

  async function loadMyGigs() {
    setGigsLoading(true);

    try {
      const data = await requestJson(
        `${GIG_API}/gigs/client/mine`,
        {},
        'Could not load your gigs.'
      );

      if (!Array.isArray(data.gigs)) {
        throw new Error('Could not load your gigs. Please try again.');
      }

      setMyGigs(data.gigs);
    } catch (err) {
      showError(err?.message || 'Could not load your gigs.');
    } finally {
      setGigsLoading(false);
    }
  }

  useEffect(() => {
    if (!authorized) {
      return;
    }

    loadMyGigs();
  }, [authorized]);

  function handleFieldChange(field, value) {
    setForm((prev) => {
      return { ...prev, [field]: value };
    });
  }

  function handleToggleCreateForm() {
    setNotice(null);
    setShowCreateForm((prev) => {
      return !prev;
    });
  }

  async function handleCreateGig(event) {
    event.preventDefault();
    setNotice(null);

    const validation = validateGigForm(form);
    if (validation.error) {
      showError(validation.error);
      return;
    }

    setSubmittingGig(true);

    try {
      await requestJson(
        `${GIG_API}/gigs`,
        {
          method: 'POST',
          body: validation.payload
        },
        'Could not publish gig.'
      );

      setForm(INITIAL_GIG_FORM);
      setShowCreateForm(false);
      showSuccess('Your gig has been published.');
      await loadMyGigs();
    } catch (err) {
      showError(err?.message || 'Could not publish gig.');
    } finally {
      setSubmittingGig(false);
    }
  }

  async function handleChangeGigStatus(gigId, status) {
    const busyKey = `gig-${gigId}`;
    if (busyActions[busyKey]) {
      return;
    }

    setActionBusy(busyKey, true);
    setNotice(null);

    try {
      await requestJson(
        `${GIG_API}/gigs/${gigId}/status`,
        {
          method: 'PATCH',
          body: { status }
        },
        'Could not update gig status.'
      );

      showSuccess(`Gig status updated to ${status}.`);
      await loadMyGigs();
    } catch (err) {
      showError(err?.message || 'Could not update gig status.');
    } finally {
      setActionBusy(busyKey, false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <SiteHeader />

      <div className="mx-auto max-w-6xl px-5 py-9 sm:px-8">
        {authLoading && (
          <p className="py-16 text-center text-slate-500">Loading your gigs…</p>
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
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.18em] text-teal-700">
                  Client workspace
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                  My Gigs
                </h1>
                <p className="mt-2 max-w-2xl text-slate-600">
                  Publish new campus gigs and manage the status of your existing listings.
                </p>
              </div>

              <button
                type="button"
                onClick={handleToggleCreateForm}
                className="rounded-xl bg-teal-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-teal-800"
              >
                {showCreateForm ? 'Close Form' : '+ Create New Gig'}
              </button>
            </div>

            {notice?.type === 'error' && (
              <p
                role="alert"
                className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
              >
                {notice.text}
              </p>
            )}

            {notice?.type === 'success' && (
              <p
                role="status"
                className="mt-5 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900"
              >
                {notice.text}
              </p>
            )}

            {showCreateForm && (
              <div className="mt-6">
                <CreateGigForm
                  form={form}
                  onChange={handleFieldChange}
                  onSubmit={handleCreateGig}
                  submitting={submittingGig}
                />
              </div>
            )}

            <div className="mt-6">
              <MyGigs
                gigs={myGigs}
                loading={gigsLoading}
                busyActions={busyActions}
                onChangeStatus={handleChangeGigStatus}
                formatBudget={formatBudget}
                formatDate={formatDate}
              />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
