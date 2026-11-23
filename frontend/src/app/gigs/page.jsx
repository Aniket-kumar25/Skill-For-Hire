"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SiteHeader from '../components/SiteHeader';

const AUTH_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const GIG_API = process.env.NEXT_PUBLIC_GIG_API_URL || 'http://localhost:5001/api';

const CATEGORIES = [
  'Web Development',
  'UI/UX Design',
  'Content Writing',
  'Data & AI',
  'Marketing',
  'Other'
];

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
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return parsed.toLocaleDateString();
}

function checkStudentAccount(user) {
  if (!user || typeof user !== 'object') {
    return null;
  }

  if (Array.isArray(user.roles)) {
    return user.roles.includes('student');
  }

  if (typeof user.role === 'string') {
    return user.role === 'student';
  }

  return null;
}

export default function BrowseGigsPage() {
  const router = useRouter();

  const [authLoading, setAuthLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [authError, setAuthError] = useState('');

  const [gigs, setGigs] = useState([]);
  const [q, setQ] = useState('');
  const [skill, setSkill] = useState('');
  const [category, setCategory] = useState('');
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');
  const [loading, setLoading] = useState(true);
  const [gigsError, setGigsError] = useState('');

  useEffect(() => {
    let active = true;

    async function verifyStudentSession() {
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
          throw new Error(data.message || 'Could not verify session');
        }

        const isStudent = checkStudentAccount(data.user);
        if (isStudent === null) {
          throw new Error('Could not verify session.');
        }

        if (!isStudent) {
          redirecting = true;
          router.replace('/client');
          return;
        }

        if (active) {
          setAuthorized(true);
        }
      } catch (err) {
        if (active) {
          setAuthError(err instanceof Error ? err.message : 'Could not verify session');
        }
      } finally {
        if (active && !redirecting) {
          setAuthLoading(false);
        }
      }
    }

    verifyStudentSession();

    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (!authorized) {
      return;
    }

    const trimmedMin = min.trim();
    const trimmedMax = max.trim();

    if (trimmedMin !== '' && trimmedMax !== '') {
      const minValue = Number(trimmedMin);
      const maxValue = Number(trimmedMax);

      if (Number.isFinite(minValue) && Number.isFinite(maxValue) && minValue > maxValue) {
        setGigs([]);
        setGigsError('Minimum budget cannot exceed maximum budget.');
        setLoading(false);
        return;
      }
    }

    let active = true;
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      if (!active) {
        return;
      }

      setLoading(true);
      setGigsError('');

      try {
        const params = new URLSearchParams();
        const trimmedQuery = q.trim();
        const trimmedSkill = skill.trim();
        const trimmedCategory = category.trim();

        if (trimmedQuery) {
          params.set('q', trimmedQuery);
        }
        if (trimmedSkill) {
          params.set('skill', trimmedSkill);
        }
        if (trimmedCategory) {
          params.set('category', trimmedCategory);
        }
        if (trimmedMin) {
          params.set('minBudget', trimmedMin);
        }
        if (trimmedMax) {
          params.set('maxBudget', trimmedMax);
        }

        const queryString = params.toString();
        const url = `${GIG_API}/gigs${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(url, {
          credentials: 'include',
          signal: controller.signal
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || 'Unable to load gigs');
        }

        if (!Array.isArray(data.gigs)) {
          throw new Error('Unable to load gigs. Please try again.');
        }

        if (active) {
          setGigs(data.gigs);
        }
      } catch (err) {
        if (err?.name === 'AbortError' || !active) {
          return;
        }
        setGigs([]);
        setGigsError(err instanceof Error ? err.message : 'Unable to load gigs');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [authorized, q, skill, category, min, max]);

  function clearFilters() {
    setQ('');
    setSkill('');
    setCategory('');
    setMin('');
    setMax('');
  }

  const isLoading = authLoading || (authorized && loading);
  const activeError = authError || gigsError;
  const countLabel = isLoading
    ? 'Loading…'
    : `${gigs.length} ${gigs.length === 1 ? 'open gig' : 'open gigs'}`;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <SiteHeader />

      <div id="listings" className="mx-auto max-w-6xl px-5 py-9">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-teal-700">
          Student opportunities
        </p>

        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Find your next opportunity.</h1>
            <p className="mt-2 text-slate-600">
              Search real projects, compare budgets and apply with your skills.
            </p>
          </div>
          <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
            {countLabel}
          </span>
        </div>

        <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            <label className="lg:col-span-2">
              <span className="mb-1 block text-xs font-bold text-slate-500">SEARCH GIGS</span>
              <input
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder="Search title, description or skill…"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-teal-500"
              />
            </label>

            <label>
              <span className="mb-1 block text-xs font-bold text-slate-500">SKILL</span>
              <input
                value={skill}
                onChange={(event) => setSkill(event.target.value)}
                placeholder="e.g. React"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-teal-500"
              />
            </label>

            <label>
              <span className="mb-1 block text-xs font-bold text-slate-500">CATEGORY</span>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3"
              >
                <option value="">All categories</option>
                {CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label>
                <span className="mb-1 block text-xs font-bold text-slate-500">MIN ₹</span>
                <input
                  type="number"
                  min="0"
                  value={min}
                  onChange={(event) => setMin(event.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl border border-slate-200 px-3 py-3"
                />
              </label>

              <label>
                <span className="mb-1 block text-xs font-bold text-slate-500">MAX ₹</span>
                <input
                  type="number"
                  min="0"
                  value={max}
                  onChange={(event) => setMax(event.target.value)}
                  placeholder="Any"
                  className="w-full rounded-xl border border-slate-200 px-3 py-3"
                />
              </label>
            </div>
          </div>

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm font-semibold text-teal-700 hover:underline"
            >
              Clear filters
            </button>
          </div>
        </section>

        {activeError && (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
          >
            {activeError}
          </p>
        )}

        {isLoading && (
          <p className="py-16 text-center text-slate-500">Loading available gigs…</p>
        )}

        {!isLoading && !activeError && gigs.length > 0 && (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {gigs.map((gig) => {
              const requiredSkills = Array.isArray(gig.requiredSkills) ? gig.requiredSkills : [];
              const postedDate = formatDate(gig.createdAt);
              const deadlineDate = formatDate(gig.deadline) || 'Not set';

              return (
                <article
                  key={gig._id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800">
                      {gig.category}
                    </span>
                    <span className="text-xs text-slate-500">{postedDate}</span>
                  </div>

                  <h2 className="mt-3 text-xl font-bold">{gig.title}</h2>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                    {gig.description}
                  </p>

                  {requiredSkills.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {requiredSkills.map((requiredSkill) => (
                        <span
                          key={requiredSkill}
                          className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
                        >
                          {requiredSkill}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                    <div>
                      <p className="text-xs text-slate-500">BUDGET</p>
                      <p className="font-bold text-teal-800">
                        {formatBudget(gig.budgetMin)} – {formatBudget(gig.budgetMax)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">Deadline: {deadlineDate}</p>
                    </div>

                    <Link
                      href={`/gigs/${gig._id}`}
                      className="rounded-xl bg-teal-700 px-4 py-3 text-sm font-bold text-white hover:bg-teal-800"
                    >
                      View & Apply →
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!isLoading && !activeError && gigs.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <div className="text-3xl">⌕</div>
            <h2 className="mt-3 text-lg font-bold">No gigs found</h2>
            <p className="mt-1 text-sm text-slate-500">
              Try changing your search or filters. New gigs appear here when clients publish them.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

