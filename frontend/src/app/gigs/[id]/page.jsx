"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import SiteHeader from '../../components/SiteHeader';

const AUTH_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const GIG_API = process.env.NEXT_PUBLIC_GIG_API_URL || 'http://localhost:5001/api';

function getEntityId(value) {
  if (!value) {
    return '';
  }
  if (typeof value === 'object') {
    return String(value._id || value.id || '');
  }
  return String(value);
}

function hasRole(user, role) {
  if (!user || typeof user !== 'object') {
    return false;
  }
  if (Array.isArray(user.roles)) {
    return user.roles.includes(role);
  }
  return user.role === role;
}

function formatBudget(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(amount) || 0);
}

function getUnavailableReason(status, isExpired) {
  if (status === 'closed') {
    return 'This gig is closed and no longer accepting applications.';
  }
  if (status === 'paused') {
    return 'This gig is currently paused and not accepting applications.';
  }
  if (isExpired) {
    return 'The deadline for this gig has passed, so it is no longer accepting applications.';
  }
  return 'This gig is not currently accepting applications.';
}

export default function GigDetailsPage() {
  const params = useParams();
  const gigId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [gig, setGig] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [proposal, setProposal] = useState('');
  const [budget, setBudget] = useState('');
  const [days, setDays] = useState('');
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [needsSignIn, setNeedsSignIn] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [submittedApplication, setSubmittedApplication] = useState(null);

  useEffect(() => {
    let active = true;

    setGig(null);
    setLoadError('');
    setSubmitError('');
    setNeedsSignIn(false);
    setSubmitSuccess('');
    setSubmittedApplication(null);

    if (!gigId) {
      setLoadError('Gig ID is missing.');
      setLoading(false);
      return;
    }

    setLoading(true);

    async function loadCurrentUser() {
      try {
        const response = await fetch(`${AUTH_API}/auth/me`, {
          credentials: 'include'
        });

        if (!response.ok) {
          return null;
        }

        const data = await response.json().catch(() => ({}));
        return data?.user && typeof data.user === 'object' ? data.user : null;
      } catch {
        return null;
      }
    }

    async function loadGig() {
      try {
        const [response, user] = await Promise.all([
          fetch(`${GIG_API}/gigs/${gigId}`, {
            credentials: 'include'
          }),
          loadCurrentUser()
        ]);

        if (active) {
          setCurrentUser(user);
        }

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || 'Gig not found');
        }

        if (!data.gig || typeof data.gig !== 'object' || Array.isArray(data.gig)) {
          throw new Error('Gig details could not be loaded. Please try again.');
        }

        if (active) {
          setGig(data.gig);
        }
      } catch (err) {
        if (active) {
          setLoadError(err instanceof Error ? err.message : 'Gig not found');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadGig();

    return () => {
      active = false;
    };
  }, [gigId]);

  const isClient = hasRole(currentUser, 'client');
  const isStudent = hasRole(currentUser, 'student');
  const currentUserId = getEntityId(currentUser);
  const gigOwnerId = getEntityId(gig?.clientId);
  const isGigOwner = Boolean(currentUserId && gigOwnerId && currentUserId === gigOwnerId);

  const requiredSkills = Array.isArray(gig?.requiredSkills) ? gig.requiredSkills : [];
  const parsedDeadline = gig?.deadline ? new Date(gig.deadline) : null;
  const hasValidDeadline = Boolean(parsedDeadline && !Number.isNaN(parsedDeadline.getTime()));
  const formattedDeadline = hasValidDeadline ? parsedDeadline.toLocaleDateString() : 'Not set';
  const isExpired = hasValidDeadline && parsedDeadline < new Date();
  const isOpenGig = gig?.status === 'open' && !isExpired;
  const canApply = isStudent && !isClient && !isGigOwner && isOpenGig;
  const showUnavailableNotice = isStudent && !isClient && !isGigOwner && !isOpenGig;

  const returnedMatchedSkills = Array.isArray(submittedApplication?.matchedSkills)
    ? submittedApplication.matchedSkills
    : [];

  async function handleApply(event) {
    event.preventDefault();
    if (!canApply) {
      return;
    }

    setSubmitError('');
    setNeedsSignIn(false);
    setSubmitSuccess('');
    setSubmittedApplication(null);

    const trimmedProposal = proposal.trim();
    if (trimmedProposal.length < 30) {
      setSubmitError('Your proposal must contain at least 30 characters.');
      return;
    }

    const trimmedBudget = budget.trim();
    const trimmedDays = days.trim();

    setBusy(true);

    try {
      const response = await fetch(`${GIG_API}/gigs/${gigId}/applications`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposal: trimmedProposal,
          proposedBudget: trimmedBudget !== '' ? Number(trimmedBudget) : undefined,
          estimatedDays: trimmedDays !== '' ? Number(trimmedDays) : undefined
        })
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        setNeedsSignIn(true);
        setSubmitError(data.message || 'Please sign in.');
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || 'Could not submit application');
      }

      setSubmittedApplication(data.application || null);
      setSubmitSuccess('Application submitted successfully.');
      setProposal('');
      setBudget('');
      setDays('');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not submit application');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-5 py-8">
        <Link
          href={isClient ? '/client/gigs' : '/gigs'}
          className="text-sm font-semibold text-teal-700 hover:underline"
        >
          {isClient ? '← Back to My Gigs' : '← Back to Browse Gigs'}
        </Link>

        {loading && (
          <p className="py-16 text-center text-slate-500">Loading gig…</p>
        )}

        {!loading && loadError && (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
          >
            {loadError}
          </p>
        )}

        {!loading && !loadError && gig && (
          <>
            <article className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800">
                {gig.category}
              </span>
              <h1 className="mt-4 text-3xl font-bold">{gig.title}</h1>
              <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-600">
                {gig.description}
              </p>

              {requiredSkills.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {requiredSkills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-6 grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-slate-500">BUDGET</p>
                  <b>
                    {formatBudget(gig.budgetMin)} – {formatBudget(gig.budgetMax)}
                  </b>
                </div>
                <div>
                  <p className="text-xs text-slate-500">DEADLINE</p>
                  <b>{formattedDeadline}</b>
                </div>
                <div>
                  <p className="text-xs text-slate-500">STATUS</p>
                  <b className="capitalize">{gig.status}</b>
                </div>
              </div>
            </article>

            {showUnavailableNotice && (
              <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                {getUnavailableReason(gig.status, isExpired)}
              </p>
            )}

            {!currentUser && isOpenGig && (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-600">
                  Sign in with a student account to apply for this gig.
                </p>
                <Link
                  href="/auth"
                  className="mt-3 inline-block rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-800"
                >
                  Sign in
                </Link>
              </div>
            )}

            {canApply && (
              <form
                onSubmit={handleApply}
                className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h2 className="text-xl font-bold">Apply for this gig</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Explain why you are a good fit. Your skills are matched against the gig
                  requirements.
                </p>

                <label className="mt-5 block text-sm font-semibold">
                  Your proposal (at least 30 characters)
                  <textarea
                    required
                    minLength={30}
                    maxLength={3000}
                    rows={6}
                    value={proposal}
                    onChange={(event) => setProposal(event.target.value)}
                    placeholder="Describe your relevant experience, approach and expected outcome…"
                    className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal outline-none focus:border-teal-500"
                  />
                </label>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-semibold">
                    Your proposed budget (₹, optional)
                    <input
                      type="number"
                      min="0"
                      value={budget}
                      onChange={(event) => setBudget(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal"
                    />
                  </label>

                  <label className="text-sm font-semibold">
                    Estimated days (optional)
                    <input
                      type="number"
                      min="1"
                      value={days}
                      onChange={(event) => setDays(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal"
                    />
                  </label>
                </div>

                {submitError && (
                  <div
                    role="alert"
                    className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
                  >
                    <p>{submitError}</p>
                    {needsSignIn && (
                      <Link
                        href="/auth"
                        className="mt-2 inline-block font-semibold text-rose-800 underline"
                      >
                        Sign in
                      </Link>
                    )}
                  </div>
                )}

                {submitSuccess && (
                  <div
                    role="status"
                    className="mt-4 rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-900"
                  >
                    <p className="font-semibold">{submitSuccess}</p>

                    {typeof submittedApplication?.matchScore === 'number' && (
                      <p className="mt-1">
                        Skill match score: <b>{submittedApplication.matchScore}%</b>
                      </p>
                    )}

                    {returnedMatchedSkills.length > 0 && (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-teal-800">Matched skills:</span>
                        {returnedMatchedSkills.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-teal-800"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="mt-2">
                      Track your submission in{' '}
                      <Link href="/applications" className="font-semibold text-teal-800 underline">
                        My Applications
                      </Link>
                      .
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="mt-5 rounded-xl bg-teal-700 px-5 py-3 font-bold text-white hover:bg-teal-800 disabled:opacity-50"
                >
                  {busy ? 'Submitting…' : 'Submit application →'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </main>
  );
}

