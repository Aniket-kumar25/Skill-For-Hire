"use client";
import SiteHeader from '../components/SiteHeader';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import Brand from '../components/Brand';

const AUTH = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const API = process.env.NEXT_PUBLIC_WORK_API_URL || 'http://localhost:5002/api';
const money = value => `₹${Number(value || 0).toLocaleString('en-IN')}`;
const date = value => value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Not set';
const statusStyle = status => ({ approved: 'bg-emerald-50 text-emerald-700', submitted: 'bg-blue-50 text-blue-700', revision: 'bg-amber-50 text-amber-800', pending: 'bg-slate-100 text-slate-700', active: 'bg-teal-50 text-teal-800', completed: 'bg-emerald-50 text-emerald-700', cancelled: 'bg-rose-50 text-rose-700' }[status] || 'bg-slate-100 text-slate-700');

export default function WorkPage() {
  const [role, setRole] = useState('student');
  const [works, setWorks] = useState([]);
  const [forms, setForms] = useState({});
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');

  async function request(url, options = {}) {
    const response = await fetch(`${API}${url}`, { credentials: 'include', ...options });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'Request failed.');
    return data;
  }
  async function load() {
    try {
      const session = await fetch(`${AUTH}/auth/me`, { credentials: 'include' });
      if (session.status === 401) { window.location.href = '/auth'; return; }
      const sessionData = await session.json();
      const accountRole = sessionData.user?.roles?.[0] || 'student';
      setRole(accountRole);
      const data = await request('/works');
      setWorks(data.works || []);
    } catch (error) { setNotice(error.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);
  const totals = useMemo(() => works.reduce((all, work) => {
    all.count += 1;
    all.milestones += work.milestones?.length || 0;
    all.approved += work.milestones?.filter(m => m.status === 'approved').length || 0;
    all.submitted += work.milestones?.filter(m => m.status === 'submitted').length || 0;
    return all;
  }, { count: 0, milestones: 0, approved: 0, submitted: 0 }), [works]);
  function updateForm(id, patch) { setForms(old => ({ ...old, [id]: { ...(old[id] || {}), ...patch } })); }
  async function run(key, url, body, method = 'PATCH') {
    setBusy(key); setNotice('');
    try { await request(url, { method, ...(body === null ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) }); setNotice('Changes saved successfully.'); await load(); }
    catch (error) { setNotice(error.message); }
    finally { setBusy(''); }
  }
  async function editMilestone(work, milestone) {
    const form = forms[milestone._id] || {};
    await run(`edit-${milestone._id}`, `/works/${work._id}/milestones/${milestone._id}`, form);
    updateForm(milestone._id, { editing: false });
  }
  async function addMilestone(work) {
    const form = forms[work._id] || {};
    setBusy(`add-${work._id}`); setNotice('');
    try {
      await request(`/works/${work._id}/milestones`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      updateForm(work._id, { title: '', dueDate: '', description: '', amount: '' });
      setNotice('Milestone added to this project.'); await load();
    } catch (error) { setNotice(error.message); }
    finally { setBusy(''); }
  }
  async function upload(work, milestone, file) {
    if (!file) return;
    const key = `upload-${milestone._id}`; setBusy(key); setNotice('');
    try {
      const form = new FormData(); form.append('deliverable', file);
      await request(`/works/${work._id}/milestones/${milestone._id}/upload`, { method: 'POST', body: form });
      setNotice('File uploaded. Add a submission note and select Submit milestone.'); await load();
    } catch (error) { setNotice(error.message); }
    finally { setBusy(''); }
  }
  async function submit(work, milestone) {
    const form = forms[milestone._id] || {};
    await run(`submit-${milestone._id}`, `/works/${work._id}/milestones/${milestone._id}/submit`, form);
  }
  async function review(work, milestone, status) {
    const form = forms[milestone._id] || {};
    await run(`review-${milestone._id}`, `/works/${work._id}/milestones/${milestone._id}/review`, { status, revisionNote: form.revisionNote });
  }

  return <main className="min-h-screen bg-slate-50">
    <SiteHeader />
    <div className="mx-auto max-w-5xl px-5 py-9">
      <p className="text-xs font-bold uppercase tracking-widest text-teal-700">Work management</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">{role === 'client' ? 'Manage project delivery' : 'Your active work'}</h1>
      <p className="mt-2 text-slate-600">{role === 'client' ? 'Set milestones, review student submissions and track project completion.' : 'Track your tasks, upload deliverables and respond to revision requests.'}</p>
      {notice && <p role="status" className="mt-5 rounded-xl border border-teal-100 bg-teal-50 p-3 text-sm text-teal-900">{notice}</p>}
      {!loading && works.length > 0 && <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[['Projects', totals.count], ['Milestones', totals.milestones], ['Approved', totals.approved], ['Awaiting review', totals.submitted]].map(([label, value]) => <div key={label} className="rounded-xl border bg-white p-4"><p className="text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div>)}
      </div>}
      <div className="mt-6 space-y-5">
        {loading && <div className="rounded-xl border bg-white p-8 text-center text-slate-500">Loading your projects…</div>}
        {!loading && works.map(work => {
          const milestones = work.milestones || [];
          const completed = milestones.filter(m => m.status === 'approved').length;
          const progress = milestones.length ? Math.round(completed / milestones.length * 100) : 0;
          const totalAmount = milestones.reduce((sum, m) => sum + Number(m.amount || 0), 0);
          const canComplete = role === 'client' && work.status === 'active' && milestones.length > 0 && milestones.every(m => m.status === 'approved');
          return <article key={work._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-bold text-slate-900">{work.title}</h2><p className="mt-1 text-sm text-slate-500">{role === 'client' ? `Student: ${work.studentId?.fullName || 'Student'}` : `Client: ${work.clientId?.fullName || 'Client'}`}</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${statusStyle(work.status)}`}>{work.status}</span></div>
            {work.description && <p className="mt-3 text-sm leading-6 text-slate-600">{work.description}</p>}
            <div className="mt-5 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-3"><div><p className="text-xs text-slate-500">Milestone progress</p><p className="mt-1 font-semibold">{completed} of {milestones.length} approved</p><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-teal-700" style={{ width: `${progress}%` }} /></div></div><div><p className="text-xs text-slate-500">Milestone budget</p><p className="mt-1 font-semibold">{money(totalAmount)}</p></div><div><p className="text-xs text-slate-500">Project status</p><p className="mt-1 font-semibold capitalize">{work.status}</p></div></div>
            <div className="mt-5 space-y-3">
              {milestones.map(m => <section key={m._id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-bold text-slate-900">{m.title}</h3>{m.description && <p className="mt-1 text-sm text-slate-600">{m.description}</p>}</div><span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyle(m.status)}`}>{m.status === 'submitted' && role === 'client' ? 'Ready for Review' : m.status.charAt(0).toUpperCase() + m.status.slice(1)}</span></div>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500"><span>Due: {date(m.dueDate)}</span><span>Amount: {money(m.amount)}</span>{m.submittedAt && <span>Submitted: {date(m.submittedAt)}</span>}</div>
                {m.submissionNote && <div className="mt-3 rounded-lg bg-slate-50 p-3"><p className="text-xs font-semibold text-slate-500">Student submission note</p><p className="mt-1 whitespace-pre-wrap text-sm">{m.submissionNote}</p></div>}
                {m.revisionNote && <div className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900"><strong>Revision requested:</strong> {m.revisionNote}</div>}
                {m.deliverableUrl && <a className="mt-3 inline-flex text-sm font-semibold text-teal-700 underline" href={m.deliverableUrl.startsWith('/api/') ? `${API.replace(/\/api$/, '')}${m.deliverableUrl}` : m.deliverableUrl} target="_blank" rel="noreferrer">View / download deliverable ↗</a>}
                {role === 'student' && work.status === 'active' && ['pending', 'revision'].includes(m.status) && <div className="mt-4 space-y-2 border-t pt-3"><label className="block text-sm font-semibold">Upload deliverable (max 10 MB)</label><input type="file" accept=".pdf,.doc,.docx,.zip,.png,.jpg,.jpeg,.txt" onChange={e => upload(work, m, e.target.files?.[0])} className="w-full rounded-lg border p-2 text-sm"/><textarea placeholder="Describe the completed work…" value={forms[m._id]?.submissionNote || ''} onChange={e => updateForm(m._id, { submissionNote: e.target.value })} className="w-full rounded-lg border p-3 text-sm" rows={3}/><input placeholder="External deliverable link (optional)" value={forms[m._id]?.deliverableUrl || ''} onChange={e => updateForm(m._id, { deliverableUrl: e.target.value })} className="w-full rounded-lg border p-3 text-sm"/><button disabled={busy === `submit-${m._id}`} onClick={() => submit(work, m)} className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{busy === `submit-${m._id}` ? 'Submitting…' : 'Submit milestone'}</button></div>}
                {role === 'client' && work.status === 'active' && ['pending','revision'].includes(m.status) && <div className="mt-3 flex flex-wrap gap-2"><button onClick={() => updateForm(m._id, { editing: !forms[m._id]?.editing, title: m.title, description: m.description || '', dueDate: m.dueDate ? new Date(m.dueDate).toISOString().slice(0,10) : '', amount: String(m.amount ?? 0) })} className="rounded-lg border px-3 py-2 text-xs font-semibold">{forms[m._id]?.editing ? 'Close editor' : 'Edit milestone'}</button>{m.status === 'pending' && <button onClick={() => window.confirm('Delete this milestone?') && run(`delete-${m._id}`, `/works/${work._id}/milestones/${m._id}`, null, 'DELETE')} className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700">Delete milestone</button>}</div>}
                {role === 'client' && forms[m._id]?.editing && <div className="mt-3 grid gap-2 rounded-lg bg-slate-50 p-3 sm:grid-cols-2"><input value={forms[m._id]?.title || ''} onChange={e => updateForm(m._id,{title:e.target.value})} className="rounded-lg border p-2 text-sm"/><input type="date" value={forms[m._id]?.dueDate || ''} onChange={e => updateForm(m._id,{dueDate:e.target.value})} className="rounded-lg border p-2 text-sm"/><input value={forms[m._id]?.description || ''} onChange={e => updateForm(m._id,{description:e.target.value})} placeholder="Description" className="rounded-lg border p-2 text-sm"/><input type="number" min="0" step="0.01" value={forms[m._id]?.amount ?? ''} onChange={e => updateForm(m._id,{amount:e.target.value})} className="rounded-lg border p-2 text-sm"/><button onClick={() => editMilestone(work,m)} className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-bold text-white">Save changes</button></div>}
                {role === 'client' && m.status === 'submitted' && <div className="mt-4 space-y-2 border-t pt-3"><label className="block text-sm font-semibold">Feedback (required when requesting revision)</label><textarea rows={2} placeholder="Explain what needs to be changed…" value={forms[m._id]?.revisionNote || ''} onChange={e => updateForm(m._id, { revisionNote: e.target.value })} className="w-full rounded-lg border p-3 text-sm"/><div className="flex flex-wrap gap-2"><button disabled={busy === `review-${m._id}`} onClick={() => review(work, m, 'approved')} className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Approve milestone</button><button disabled={busy === `review-${m._id}`} onClick={() => review(work, m, 'revision')} className="rounded-lg border border-amber-300 px-4 py-2 text-sm font-bold text-amber-800 disabled:opacity-50">Request revision</button></div></div>}
              </section>)}
            </div>
            {role === 'client' && work.status === 'active' && <div className="mt-5 rounded-xl bg-slate-50 p-4"><h3 className="font-bold">Add a milestone</h3><p className="mt-1 text-xs text-slate-500">Break the project into clear tasks with individual deadlines and amounts.</p><div className="mt-3 grid gap-2 sm:grid-cols-2"><input placeholder="Milestone title" value={forms[work._id]?.title || ''} onChange={e => updateForm(work._id, { title: e.target.value })} className="rounded-lg border p-3 text-sm"/><input type="date" value={forms[work._id]?.dueDate || ''} onChange={e => updateForm(work._id, { dueDate: e.target.value })} className="rounded-lg border p-3 text-sm"/><input placeholder="Description" value={forms[work._id]?.description || ''} onChange={e => updateForm(work._id, { description: e.target.value })} className="rounded-lg border p-3 text-sm"/><input type="number" min="0" step="0.01" placeholder="Amount ₹" value={forms[work._id]?.amount || ''} onChange={e => updateForm(work._id, { amount: e.target.value })} className="rounded-lg border p-3 text-sm"/></div><button disabled={busy === `add-${work._id}`} onClick={() => addMilestone(work)} className="mt-3 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busy === `add-${work._id}` ? 'Adding…' : 'Add milestone'}</button></div>}
            {canComplete && <button onClick={() => run(`complete-${work._id}`, `/works/${work._id}/complete`, {})} className="mt-4 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white">Mark project completed</button>}
            {role === 'client' && work.status === 'active' && <button onClick={() => window.confirm('Cancel this project? This is allowed only before any milestone is submitted or approved.') && run(`cancel-${work._id}`, `/works/${work._id}/cancel`, {})} className="mt-4 ml-2 rounded-lg border border-rose-200 px-4 py-2.5 text-sm font-bold text-rose-700">Cancel project</button>}
            {role === 'client' && work.status === 'completed' && <div className="mt-5 rounded-xl bg-slate-50 p-4"><h3 className="font-bold">Rate the student</h3><div className="mt-3 flex flex-wrap gap-2"><select id={`rating-${work._id}`} defaultValue={work.rating || 5} className="rounded-lg border bg-white p-2"><option value="5">5 stars</option><option value="4">4 stars</option><option value="3">3 stars</option><option value="2">2 stars</option><option value="1">1 star</option></select><input id={`review-${work._id}`} defaultValue={work.review || ''} placeholder="Write a short review (optional)" className="min-w-0 flex-1 rounded-lg border bg-white p-2 text-sm"/><button onClick={() => run(`rating-${work._id}`, `/works/${work._id}/rating`, { rating: Number(document.getElementById(`rating-${work._id}`).value), review: document.getElementById(`review-${work._id}`).value })} className="rounded-lg border px-3 py-2 text-sm font-bold">Save review</button></div>{work.rating && <p className="mt-2 text-sm text-slate-600">Saved rating: {work.rating}/5 {work.review && `— ${work.review}`}</p>}</div>}
            {role === 'student' && work.status === 'completed' && <div className="mt-5 rounded-xl border border-teal-100 bg-teal-50/60 p-4"><h3 className="font-bold text-slate-900">Client rating and review</h3>{work.rating ? <><p className="mt-2 text-lg font-semibold text-amber-600">{'★'.repeat(work.rating)}{'☆'.repeat(5 - work.rating)} <span className="text-sm text-slate-700">{work.rating}/5</span></p>{work.review ? <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{work.review}</p> : <p className="mt-2 text-sm text-slate-600">No written review was added.</p>}</> : <p className="mt-2 text-sm text-slate-600">Your client has not submitted a rating yet.</p>}</div>}
          </article>;
        })}
        {!loading && !works.length && <div className="rounded-2xl border border-dashed bg-white p-12 text-center"><h2 className="font-bold">No active work yet</h2><p className="mt-1 text-sm text-slate-500">When a client accepts a student's application, the project appears here.</p><Link href={role === 'student' ? '/gigs' : '/client'} className="mt-4 inline-block rounded-xl bg-teal-700 px-4 py-3 font-bold text-white">{role === 'student' ? 'Browse Gigs' : 'Manage client workspace'} →</Link></div>}
      </div>
    </div>
  </main>;
}
