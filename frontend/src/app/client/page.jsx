"use client";
import SiteHeader from '../components/SiteHeader';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Brand from '../components/Brand';



const AUTH_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const GIG_API = process.env.NEXT_PUBLIC_GIG_API_URL || 'http://localhost:5001/api';
const initial = { title: '', description: '', category: 'Web Development', requiredSkills: '', budgetMin: '1000', budgetMax: '5000', deadline: '' };

export default function ClientDashboard() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState(initial);
  const [applications, setApplications] = useState([]);
  const [myGigs, setMyGigs] = useState([]);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    fetch(`${AUTH_API}/auth/me`, { credentials: 'include' }).then(async r => { if (r.status === 401) { window.location.href = '/auth'; return null; } if (!r.ok) throw new Error('Could not verify your account.'); return r.json(); }).then(d => { if (!d) return; setUser(d.user); if (!d.user.roles.includes('client')) { window.location.href = '/profile'; return; } loadInbox(); loadMyGigs(); }).catch(e => setNotice(e.message));
  }, []);
  async function loadInbox() {
    try { const r = await fetch(`${GIG_API}/gigs/client/applications/inbox`, { credentials: 'include' }); const d = await r.json(); if (!r.ok) throw new Error(d.message || 'Could not load applications.'); setApplications(d.applications || []); } catch (e) { setNotice(e.message); }
  }
  async function loadMyGigs() { try { const r = await fetch(`${GIG_API}/gigs/client/mine`, { credentials: 'include' }); const d = await r.json(); if (!r.ok) throw new Error(d.message || 'Could not load your gigs.'); setMyGigs(d.gigs || []); } catch (e) { setNotice(e.message); } }
  async function changeGigStatus(id, status) { try { const r = await fetch(`${GIG_API}/gigs/${id}/status`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); const d = await r.json(); if (!r.ok) throw new Error(d.message || 'Could not update gig.'); setNotice(`Gig ${status}.`); loadMyGigs(); } catch (e) { setNotice(e.message); } }
  async function createGig(e) {
    e.preventDefault(); setBusy(true); setNotice('');
    try { const payload = { ...form, budgetMin: Number(form.budgetMin), budgetMax: Number(form.budgetMax), requiredSkills: form.requiredSkills.split(',').map(x => x.trim()).filter(Boolean) }; const r = await fetch(`${GIG_API}/gigs`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); const d = await r.json(); if (!r.ok) throw new Error(d.message || 'Could not publish gig.'); setForm(initial); setNotice('Your gig has been published.'); loadMyGigs(); } catch (e) { setNotice(e.message); } finally { setBusy(false); }
  }
  async function review(applicationId, status) {
    try { const r = await fetch(`${GIG_API}/gigs/applications/${applicationId}`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); const d = await r.json(); if (!r.ok) throw new Error(d.message || 'Could not update application.'); setNotice(`Application ${status}.`); loadInbox(); } catch (e) { setNotice(e.message); }
  }
    return <main className="min-h-screen bg-slate-50 text-slate-900">
    <SiteHeader />
    <div className="mx-auto max-w-6xl px-5 py-9 sm:px-8"><p className="text-xs font-bold uppercase tracking-[.18em] text-teal-700">Client workspace</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Find the right people for your work.</h1><p className="mt-2 max-w-2xl text-slate-600">Publish a clear gig, review student applications and build your project team.</p>
      {notice && <p role="status" className="mt-5 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">{notice}</p>}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><h2 className="text-xl font-bold">Create a gig</h2><p className="mt-1 text-sm text-slate-500">Describe the work and the skills you need.</p><form onSubmit={createGig} className="mt-5 space-y-4">
          <label className="block text-sm font-semibold">Gig title<input required minLength="5" maxLength="100" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. Build a responsive portfolio website" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 font-normal"/></label>
          <label className="block text-sm font-semibold">Description<textarea required minLength="20" maxLength="5000" rows="4" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Explain the project, expected outcome and scope…" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 font-normal"/></label>
          <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold">Category<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 font-normal">{['Web Development','UI/UX Design','Content Writing','Data & AI','Marketing','Other'].map(x=><option key={x}>{x}</option>)}</select></label><label className="block text-sm font-semibold">Required skills<input required value={form.requiredSkills} onChange={e=>setForm({...form,requiredSkills:e.target.value})} placeholder="React, JavaScript, CSS" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 font-normal"/></label></div>
          <div className="grid gap-4 sm:grid-cols-3"><label className="block text-sm font-semibold">Min budget (₹)<input type="number" min="0" required value={form.budgetMin} onChange={e=>setForm({...form,budgetMin:e.target.value})} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal"/></label><label className="block text-sm font-semibold">Max budget (₹)<input type="number" min="0" required value={form.budgetMax} onChange={e=>setForm({...form,budgetMax:e.target.value})} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal"/></label><label className="block text-sm font-semibold">Deadline<input type="date" required min={new Date().toISOString().slice(0,10)} value={form.deadline} onChange={e=>setForm({...form,deadline:e.target.value})} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal"/></label></div>
          <button disabled={busy} className="rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white transition hover:bg-teal-800 disabled:opacity-60">{busy?'Publishing…':'Publish gig →'}</button>
        </form></section>
        <section id="gigs" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 lg:col-span-2"><div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-bold">Your published gigs</h2><p className="mt-1 text-sm text-slate-500">Pause or close listings when you no longer need applicants.</p></div><span className="rounded-full bg-teal-50 px-3 py-1 text-sm font-bold text-teal-700">{myGigs.length}</span></div><div className="mt-4 grid gap-3 md:grid-cols-2">{myGigs.map(g=><article key={g._id} className="rounded-xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-2"><h3 className="font-bold">{g.title}</h3><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold capitalize">{g.status}</span></div><p className="mt-2 text-sm text-slate-500">₹{g.budgetMin} – ₹{g.budgetMax} · Deadline {new Date(g.deadline).toLocaleDateString()}</p><div className="mt-3 flex flex-wrap gap-2">{g.status!=='closed'&&<button onClick={()=>changeGigStatus(g._id,g.status==='open'?'paused':'open')} className="rounded-lg border px-3 py-2 text-xs font-bold">{g.status==='open'?'Pause':'Reopen'}</button>}{g.status!=='closed'&&<button onClick={()=>changeGigStatus(g._id,'closed')} className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700">Close gig</button>}</div></article>)}{!myGigs.length&&<p className="text-sm text-slate-500">Your published gigs will appear here.</p>}</div></section>
        <section id="applications" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 lg:col-span-2"><div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-bold">Received Applications</h2><p className="mt-1 text-sm text-slate-500">Review applications for your gigs.</p></div><span className="rounded-full bg-teal-50 px-3 py-1 text-sm font-bold text-teal-700">{applications.length}</span></div>
          <div className="mt-5 space-y-3">{applications.length ? applications.map(a=><article key={a._id} className="rounded-xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold">{a.studentId?.fullName || 'Student applicant'}</h3><p className="text-sm text-slate-500">{a.gigId?.title || 'Your gig'}</p></div><span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold capitalize">{a.status}</span></div><p className="mt-3 text-sm text-slate-700">{a.proposal}</p><p className="mt-2 text-xs text-teal-700">Skill match: {a.matchScore || 0}%</p>{a.status==='pending' && <div className="mt-4 flex gap-2"><button onClick={()=>review(a._id,'accepted')} className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white">Accept</button><button onClick={()=>review(a._id,'rejected')} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600">Reject</button></div>}</article>) : <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center"><p className="font-semibold">No applications yet</p><p className="mt-1 text-sm text-slate-500">Once students apply to your gigs, they will appear here.</p></div>}</div>
          <p className="mt-6 text-sm text-slate-500"></p>
        </section>
      </div>
    </div>
  </main>;
}
