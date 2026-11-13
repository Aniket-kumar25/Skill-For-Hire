"use client";
import SiteHeader from '../components/SiteHeader';

import Link from 'next/link';

import Brand from '../components/Brand';

import { useEffect, useMemo, useState } from 'react';


const emptyProfile = {
  fullName: '', headline: '', bio: '', department: '', studyYear: '', location: '', contactEmail: '', avatarUrl: '',
  skills: [], portfolio: [], availability: 'Available', weeklyHours: 5
};
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const fieldClass = 'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:ring-4 focus:ring-teal-50';
const labelClass = 'text-sm font-semibold text-slate-700';

function TextField({ label, value, onChange, placeholder, type = 'text', required = false }) {
  return <label className="block"><span className={labelClass}>{label}</span><input className={fieldClass} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required} /></label>;
}

export default function StudentProfileForm() {
  const [profile, setProfile] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [skillName, setSkillName] = useState('');
  const [skillLevel, setSkillLevel] = useState('Intermediate');
  const [project, setProject] = useState({ title: '', description: '', technologiesText: '', projectUrl: '', imageUrl: '' });
  const [showProjectForm, setShowProjectForm] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch(`${API}/profiles/me`, { credentials: 'include' });
        if (response.status === 401) { window.location.href = '/auth'; return; }
        if (!response.ok) throw new Error('Could not load profile. Is the backend running?');
        const data = await response.json();
        const p = data.profile;
        setProfile({
          ...emptyProfile,
          ...p,
          skills: (p.skills || []).map((s) => ({ name: s.name, level: s.level || 'Beginner' })),
          portfolio: (p.portfolio || []).map((item) => ({ title: item.title, description: item.description || '', technologiesText: (item.technologies || []).join(', '), projectUrl: item.projectUrl || '', imageUrl: item.imageUrl || '' }))
        });
      } catch (error) {
        setNotice({ type: 'error', text: error instanceof Error ? error.message : 'Could not load profile.' });
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const completion = useMemo(() => {
    const checks = [profile.fullName, profile.headline, profile.bio, profile.department, profile.studyYear, profile.contactEmail, profile.skills.length, profile.portfolio.length];
    return Math.round(checks.filter(Boolean).length / checks.length * 100);
  }, [profile]);

  const update = (key, value) => setProfile(previous => ({ ...previous, [key]: value }));

  const addSkill = () => {
    const name = skillName.trim();
    if (!name) return;
    if (profile.skills.some(s => s.name.toLowerCase() === name.toLowerCase())) {
      setNotice({ type: 'error', text: 'That skill is already on your list.' }); return;
    }
    update('skills', [...profile.skills, { name, level: skillLevel }]);
    setSkillName(''); setNotice(null);
  };

  const addProject = () => {
    if (!project.title.trim()) return;
    update('portfolio', [...profile.portfolio, { ...project, title: project.title.trim() }]);
    setProject({ title: '', description: '', technologiesText: '', projectUrl: '', imageUrl: '' });
    setShowProjectForm(false); setNotice(null);
  };


  const saveProfile = async (event) => {
    event.preventDefault(); setSaving(true); setNotice(null);
    try {
      const payload = {
        ...profile,
        skills: profile.skills.map(s => ({ name: s.name, level: s.level })),
        portfolio: profile.portfolio.map(p => ({ title: p.title, description: p.description, technologies: p.technologiesText.split(',').map(t => t.trim()).filter(Boolean), projectUrl: p.projectUrl, imageUrl: p.imageUrl }))
      };
      const response = await fetch(`${API}/profiles/me`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to save your profile.');
      setNotice({ type: 'success', text: 'Your profile has been saved successfully.' });
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : 'Unable to save your profile.' });
    } finally { setSaving(false); }
  };

  return <main className="profile-page min-h-screen pb-16">
    <SiteHeader />
    <div className="mx-auto max-w-6xl px-5 pt-8 sm:px-8 sm:pt-12">
      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-sm font-bold uppercase tracking-widest text-teal-600">Student workspace</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Build your profile</h1><p className="mt-2 max-w-xl text-slate-600">Tell campus clients who you are, what you do, and what you have built.</p></div><div className="w-full rounded-2xl border border-slate-200 bg-white p-4 sm:w-56"><div className="flex items-center justify-between text-sm"><span className="font-semibold">Profile strength</span><span className="font-bold text-teal-600">{completion}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: `${completion}%` }} /></div><p className="mt-2 text-xs text-slate-500">Complete more sections to stand out.</p></div></div>

      {notice && <div role="status" className={`mb-6 rounded-xl border px-4 py-3 text-sm ${notice.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>{notice.text}</div>}
      {loading ? <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">Loading your profile…</div> : <form onSubmit={saveProfile} className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><div className="mb-6"><p className="text-xs font-bold uppercase tracking-widest text-teal-600">01 / About you</p><h2 className="mt-1 text-xl font-bold">Personal information</h2><p className="mt-1 text-sm text-slate-500">Help clients put a face and story to your skills.</p></div>
            <div className="grid gap-5 sm:grid-cols-2"><TextField label="Full name *" value={profile.fullName} onChange={v => update('fullName', v)} placeholder="e.g. Aniket Kumar" required /><TextField label="Professional headline" value={profile.headline} onChange={v => update('headline', v)} placeholder="e.g. Frontend developer & UI enthusiast" /><TextField label="Department / course" value={profile.department} onChange={v => update('department', v)} placeholder="e.g. B.Tech Computer Science" /><label className="block"><span className={labelClass}>Year of study</span><select className={fieldClass} value={profile.studyYear} onChange={e => update('studyYear', e.target.value)}><option value="">Select year</option><option>1st year</option><option>2nd year</option><option>3rd year</option><option>4th year</option><option>Postgraduate</option></select></label><label className="block"><span className={labelClass}>Account email</span><input className={fieldClass} type="email" value={profile.contactEmail || ""} readOnly disabled /><span className="mt-1 block text-xs font-normal text-slate-400">Your login email is managed by your account.</span></label><TextField label="Campus / city" value={profile.location} onChange={v => update('location', v)} placeholder="e.g. Phagwara, Punjab" /><div className="sm:col-span-2"><label className="block"><span className={labelClass}>Short bio</span><textarea className={`${fieldClass} min-h-28 resize-y`} value={profile.bio} onChange={e => update('bio', e.target.value)} maxLength={1000} placeholder="What do you enjoy doing? What kind of work would you like to take on?"/><span className="mt-1 block text-right text-xs text-slate-400">{profile.bio.length}/1000</span></label></div></div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><div className="mb-6"><p className="text-xs font-bold uppercase tracking-widest text-teal-600">02 / What you do</p><h2 className="mt-1 text-xl font-bold">Skills & proficiency</h2><p className="mt-1 text-sm text-slate-500">Add the skills you can offer to campus clients.</p></div>
            <div className="flex flex-col gap-3 sm:flex-row"><input className={`${fieldClass} mt-0 flex-1`} value={skillName} onChange={e => setSkillName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }} placeholder="e.g. React.js, Graphic design" aria-label="Skill name"/><select className={`${fieldClass} mt-0 sm:w-44`} value={skillLevel} onChange={e => setSkillLevel(e.target.value)} aria-label="Skill proficiency"><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select><button type="button" onClick={addSkill} className="rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-700">+ Add skill</button></div>
            {profile.skills.length ? <div className="mt-5 flex flex-wrap gap-2">{profile.skills.map((skill, index) => <span key={`${skill.name}-${index}`} className="inline-flex items-center gap-2 rounded-xl border border-teal-100 bg-teal-50 px-3 py-2 text-sm text-teal-800"><span className="font-semibold">{skill.name}</span><span className="rounded-md bg-white/80 px-1.5 py-0.5 text-xs text-teal-600">{skill.level}</span><button type="button" onClick={() => update('skills', profile.skills.filter((_, i) => i !== index))} className="ml-1 text-teal-500 hover:text-rose-600" aria-label={`Remove ${skill.name}`}>×</button></span>)}</div> : <div className="mt-5 rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">Your skills will appear here when you add them.</div>}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><p className="text-xs font-bold uppercase tracking-widest text-teal-600">03 / Show your work</p><h2 className="mt-1 text-xl font-bold">Portfolio projects</h2><p className="mt-1 text-sm text-slate-500">Add projects that demonstrate what you can build or deliver.</p></div><button type="button" onClick={() => setShowProjectForm(v => !v)} className="self-start rounded-xl border border-teal-200 px-4 py-2.5 text-sm font-semibold text-teal-700 hover:bg-teal-50">{showProjectForm ? 'Cancel' : '+ Add project'}</button></div>
            {showProjectForm && <div className="mt-5 rounded-xl border border-teal-100 bg-teal-50/50 p-4 sm:p-5"><div className="space-y-4"><TextField label="Project title *" value={project.title} onChange={v => setProject(p => ({ ...p, title: v }))} placeholder="e.g. Student expense tracker" required/><label className="block"><span className={labelClass}>Description</span><textarea className={`${fieldClass} min-h-20 resize-y`} value={project.description} onChange={e => setProject(p => ({ ...p, description: e.target.value }))} placeholder="What does the project do?"/></label><TextField label="Technologies (comma-separated)" value={project.technologiesText} onChange={v => setProject(p => ({ ...p, technologiesText: v }))} placeholder="React, Node.js, MongoDB"/><TextField label="Project URL" value={project.projectUrl} onChange={v => setProject(p => ({ ...p, projectUrl: v }))} placeholder="https://github.com/you/project"/><TextField label="Preview image URL (optional)" value={project.imageUrl} onChange={v => setProject(p => ({ ...p, imageUrl: v }))} placeholder="https://…"/><button className="rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-700" type="button" onClick={addProject}>Add to portfolio</button></div></div>}
            {profile.portfolio.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2">{profile.portfolio.map((item, index) => <article key={`${item.title}-${index}`} className="rounded-xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-xl">▧</div><button type="button" onClick={() => update('portfolio', profile.portfolio.filter((_, i) => i !== index))} className="text-sm text-slate-400 hover:text-rose-600" aria-label={`Remove ${item.title}`}>Remove ×</button></div><h3 className="mt-4 font-bold">{item.title}</h3><p className="mt-1 line-clamp-3 text-sm leading-6 text-slate-600">{item.description || 'No description added yet.'}</p>{item.technologiesText && <p className="mt-3 text-xs font-medium text-teal-700">{item.technologiesText}</p>}{item.projectUrl && <a href={item.projectUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-semibold text-teal-600 hover:underline">View project ↗</a>}</article>)}</div> : !showProjectForm && <div className="mt-5 rounded-xl border border-dashed border-slate-200 p-7 text-center text-sm text-slate-500">No projects yet. Add your best work to strengthen your profile.</div>}
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-6"><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-widest text-teal-600">04 / Your work status</p><h2 className="mt-1 text-lg font-bold">Availability</h2><p className="mt-1 text-sm leading-6 text-slate-500">Let clients know whether you can take on new work.</p><div className="mt-4 space-y-2">{([{ value: 'Available', title: 'Available for work', description: 'Open to new gigs' }, { value: 'Busy', title: 'Busy right now', description: 'May accept later work' }, { value: 'Unavailable', title: 'Unavailable', description: 'Not taking new gigs' }]).map(option => <label key={option.value} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${profile.availability === option.value ? 'border-teal-300 bg-teal-50/60' : 'border-slate-200 hover:border-slate-300'}`}><input type="radio" name="availability" className="mt-1 accent-teal-600" checked={profile.availability === option.value} onChange={() => update('availability', option.value)}/><span><span className="block text-sm font-semibold">{option.title}</span><span className="mt-0.5 block text-xs text-slate-500">{option.description}</span></span></label>)}</div><label className="mt-5 block"><span className={labelClass}>Hours available per week</span><div className="mt-2 flex items-center gap-3"><input type="range" min="0" max="40" step="1" value={profile.weeklyHours} onChange={e => update('weeklyHours', Number(e.target.value))} className="w-full accent-teal-600"/><span className="w-12 rounded-lg bg-slate-100 px-2 py-1.5 text-center text-sm font-bold">{profile.weeklyHours}h</span></div></label></section>
          <section className="rounded-2xl border border-teal-100 bg-teal-50/70 p-5"><div className="flex gap-3"><span className="text-xl">✦</span><div><h3 className="font-bold text-slate-900">Profile tip</h3><p className="mt-1 text-sm leading-6 text-slate-600">Add 3–5 relevant skills and at least one project link. Clients can judge your work more confidently when they can see examples.</p></div></div></section>
          <button type="submit" disabled={saving} className="w-full rounded-xl bg-teal-600 px-5 py-4 font-bold text-white shadow-lg shadow-teal-100 transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60">{saving ? 'Saving profile…' : 'Save profile changes →'}</button><p className="text-center text-xs leading-5 text-slate-400">Your changes are saved to your Skill For Hire profile.</p>
        </aside>
      </form>}
    </div>
  </main>;
}
