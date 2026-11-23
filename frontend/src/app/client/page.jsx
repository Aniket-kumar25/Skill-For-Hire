"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SiteHeader from '../components/SiteHeader';
import CreateGigForm from './components/CreateGigForm';
import MyGigs from './components/MyGigs';
import ApplicationsInbox from './components/ApplicationsInbox';

const AUTH_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const GIG_API = process.env.NEXT_PUBLIC_GIG_API_URL || 'http://localhost:5001/api';

const INITIAL_FORM = {
  title: '',
  description: '',
  category: 'Web Development',
  requiredSkills: '',
  budgetMin: '1000',
  budgetMax: '5000',
  deadline: ''
};

function formatBudget(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(amount) || 0);
}

function formatDate(value) {
  if (!value) {
    return '';
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toLocaleDateString();
}

function checkClientAccount(user) {
  if (!user || typeof user !== 'object') {
    return null;
  }
  if (Array.isArray(user.roles)) {
    return user.roles.includes('client');
  }
  if (typeof user.role === 'string') {
    return user.role === 'client';
  }
  return null;
}

async function requestJson(url, { method = 'GET', body } = {}, fallbackMessage) {
  const options = { method, credentials: 'include' };
  if (body !== undefined) {
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || fallbackMessage);
  }

  return data;
}

export default function ClientDashboard() {
  const router = useRouter();

  const [authLoading, setAuthLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [authError, setAuthError] = useState('');

  const [form, setForm] = useState(INITIAL_FORM);
  const [submittingGig, setSubmittingGig] = useState(false);

  const [myGigs, setMyGigs] = useState([]);
  const [gigsLoading, setGigsLoading] = useState(true);

  const [applications, setApplications] = useState([]);
  const [inboxLoading, setInboxLoading] = useState(true);

  const [busyActions, setBusyActions] = useState({});
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    let active = true;

    async function verifyClientSession() {
      let redirecting = false;

      try {
        const response = await fetch(`${AUTH_API}/auth/me`, {
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

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.message || 'Could not verify your account.');
        }

        const isClient = checkClientAccount(data.user);
        if (isClient === null) {
          throw new Error('Could not verify your account.');
        }

        if (!isClient) {
          redirecting = true;
          router.replace('/profile');
          return;
        }

        if (active) {
          setAuthorized(true);
        }
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

    verifyClientSession();

    return () => {
      active = false;
    };
  }, [router]);

  const showError = (text) => setNotice({ type: 'error', text });
  const showSuccess = (text, showWorkLink = false) =>
    setNotice({ type: 'success', text, showWorkLink });

  async function loadMyGigs() {
    setGigsLoading(true);
    try {
      const data = await requestJson(`${GIG_API}/gigs/client/mine`, {}, 'Could not load your gigs.');
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

  async function loadInbox() {
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

    loadMyGigs();
    loadInbox();
  }, [authorized]);

  function handleFieldChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function setActionBusy(key, isBusy) {
    setBusyActions((prev) => ({ ...prev, [key]: isBusy }));
  }

  async function handleCreateGig(event) {
    event.preventDefault();
    setNotice(null);

    const title = form.title.trim();
    const description = form.description.trim();
    const requiredSkills = form.requiredSkills
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    if (title.length < 5) {
      return showError('Gig title must contain at least 5 characters.');
    }
    if (description.length < 20) {
      return showError('Description must contain at least 20 characters.');
    }
    if (requiredSkills.length === 0) {
      return showError('Enter at least one required skill.');
    }
    if (requiredSkills.length > 20) {
      return showError('You can list at most 20 required skills.');
    }

    const minText = String(form.budgetMin).trim();
    const maxText = String(form.budgetMax).trim();
    const budgetMin = minText !== '' ? Number(minText) : NaN;
    const budgetMax = maxText !== '' ? Number(maxText) : NaN;

    if (!Number.isFinite(budgetMin) || !Number.isFinite(budgetMax) || budgetMin < 0 || budgetMax < 0) {
      return showError('Enter valid non-negative minimum and maximum budgets.');
    }
    if (budgetMax < budgetMin) {
      return showError('Maximum budget must be at least minimum budget.');
    }

    const parsedDeadline = new Date(form.deadline);
    if (!form.deadline || Number.isNaN(parsedDeadline.getTime()) || parsedDeadline <= new Date()) {
      return showError('Gig deadline must be a valid future date.');
    }

    setSubmittingGig(true);

    try {
      await requestJson(
        `${GIG_API}/gigs`,
        {
          method: 'POST',
          body: {
            title,
            description,
            category: form.category,
            requiredSkills,
            budgetMin,
            budgetMax,
            deadline: form.deadline
          }
        },
        'Could not publish gig.'
      );

      setForm(INITIAL_FORM);
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
        { method: 'PATCH', body: { status } },
        'Could not update gig.'
      );

      showSuccess(`Gig ${status}.`);
      await loadMyGigs();
    } catch (err) {
      showError(err?.message || 'Could not update gig.');
    } finally {
      setActionBusy(busyKey, false);
    }
  }

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
        { method: 'PATCH', body: { status } },
        'Could not update application.'
      );

      showSuccess(`Application ${status}.`, status === 'accepted');
      await loadInbox();
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
          <p className="py-16 text-center text-slate-500">Loading client workspace…</p>
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
              Find the right people for your work.
            </h1>
            <p className="mt-2 max-w-2xl text-slate-600">
              Publish a clear gig, review student applications and build your project team.
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

            <div className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
              <CreateGigForm
                form={form}
                onChange={handleFieldChange}
                onSubmit={handleCreateGig}
                submitting={submittingGig}
              />

              <MyGigs
                gigs={myGigs}
                loading={gigsLoading}
                busyActions={busyActions}
                onChangeStatus={handleChangeGigStatus}
                formatBudget={formatBudget}
                formatDate={formatDate}
              />

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
