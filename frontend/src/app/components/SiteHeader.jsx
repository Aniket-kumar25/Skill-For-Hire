'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Brand from './Brand';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const CLIENT_LINKS = [
  { label: 'Dashboard', href: '/client' },
  { label: 'My Gigs', href: '/client/gigs' },
  { label: 'Applications', href: '/client/applications' },
  { label: 'My Profile', href: '/profile' },
  { label: 'My Work', href: '/work' }
];

const STUDENT_LINKS = [
  { label: 'Home', href: '/student' },
  { label: 'Browse Gigs', href: '/gigs#listings' },
  { label: 'My Profile', href: '/profile' },
  { label: 'My Applications', href: '/applications' },
  { label: 'My Work', href: '/work' }
];

export default function SiteHeader() {
  const [role, setRole] = useState(null);
  const pathname = usePathname();

  useEffect(() => {
    let active = true;

    async function loadUserRole() {
      try {
        const response = await fetch(`${API}/auth/me`, {
          credentials: 'include'
        });

        if (!response.ok) {
          if (active) {
            setRole(null);
          }
          return;
        }

        const data = await response.json();
        const currentRole = data?.user?.role || data?.user?.roles?.[0] || null;

        if (active) {
          setRole(currentRole);
        }
      } catch {
        if (active) {
          setRole(null);
        }
      }
    }

    loadUserRole();

    return () => {
      active = false;
    };
  }, [pathname]);

  let links = [];
  if (role === 'client') {
    links = CLIENT_LINKS;
  } else if (role === 'student') {
    links = STUDENT_LINKS;
  }

  async function signOut() {
    try {
      await fetch(`${API}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } finally {
      window.location.href = '/auth';
    }
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Brand />
        <nav
          aria-label="Main navigation"
          className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm"
        >
          {links.map((item) => {
            const basePath = item.href.split('#')[0];
            const isActive = pathname === basePath;
            const linkClass = isActive
              ? 'font-semibold text-teal-700 transition hover:text-teal-700'
              : 'font-semibold text-slate-800 transition hover:text-teal-700';

            return (
              <Link key={item.label} href={item.href} className={linkClass}>
                {item.label}
              </Link>
            );
          })}

          {role && (
            <button
              type="button"
              onClick={signOut}
              className="font-semibold text-slate-800 transition hover:text-rose-700"
            >
              Sign Out
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
