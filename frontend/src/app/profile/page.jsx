'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StudentProfileForm from './StudentProfileForm';
import ClientProfileForm from './ClientProfileForm';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
export default function ProfilePage() {
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  useEffect(() => {
    let active = true;
    fetch(`${API}/auth/me`, { credentials: 'include' }).then(async r => {
      if (r.status === 401) { router.replace('/auth'); return null; }
      const d = await r.json(); if (!r.ok) throw new Error(d.message || 'Could not verify account.'); return d;
    }).then(d => { if (!active || !d) return; const currentRole = d.user?.role || d.user?.roles?.[0]; if (!['student','client'].includes(currentRole)) throw new Error('Your account type could not be verified.'); setRole(currentRole); })
      .catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [router]);
  if (error) return <main className="min-h-screen bg-slate-50 p-8"><p role="alert" className="mx-auto max-w-xl rounded-xl bg-rose-50 p-4 text-rose-700">{error}</p></main>;
  if (!role) return <main className="min-h-screen bg-slate-50 p-10 text-center text-slate-500">Loading your profile…</main>;
  return role === 'client' ? <ClientProfileForm /> : <StudentProfileForm />;
}
