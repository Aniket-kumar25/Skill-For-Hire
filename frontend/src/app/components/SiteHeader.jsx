'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Brand from './Brand';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
export default function SiteHeader() {
  const [role, setRole] = useState(null);
  const pathname = usePathname();
  useEffect(() => { let active = true; fetch(`${API}/auth/me`, { credentials: 'include' }).then(async r => r.ok ? r.json() : null).then(d => { if (active) setRole(d?.user?.role || d?.user?.roles?.[0] || null); }).catch(() => { if (active) setRole(null); }); return () => { active = false; }; }, [pathname]);
  const links = role === 'client' ? [
    ['Home', '/client'], ['My Gigs', '/client#gigs'], ['My Profile', '/profile'], ['Received Applications', '/client#applications'], ['My Work', '/work']
  ] : role === 'student' ? [
    ['Home', '/student'], ['Browse Gigs', '/gigs#listings'], ['My Profile', '/profile'], ['My Applications', '/applications'], ['My Work', '/work']
  ] : [];
  async function signOut() {
    try { await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' }); }
    finally { window.location.href = '/auth'; }
  }
  return <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8"><Brand/><nav aria-label="Main navigation" className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">{links.map(([label, href]) => <Link key={label} href={href} className={`font-semibold transition hover:text-teal-700 ${pathname === href.split('#')[0] ? 'text-teal-700' : 'text-slate-800'}`}>{label}</Link>)}{role && <button type="button" onClick={signOut} className="font-semibold text-slate-800 transition hover:text-rose-700">Sign Out</button>}</nav></div></header>;
}
