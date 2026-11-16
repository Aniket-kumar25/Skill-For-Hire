'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

import Brand from '../components/Brand';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState('register');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  // --- Show/Hide Password ---
  const [show, setShow] = useState(false);
  // --- End Show/Hide Password ---

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`${API}/auth/${mode}`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password, ...(mode === 'register' ? { role } : {}) })
      });
      const responseText = await response.text();
      let data = {};
      try { data = responseText ? JSON.parse(responseText) : {}; }
      catch { data = { message: responseText || 'The server returned an unreadable response.' }; }
      if (!response.ok) throw new Error(data.message || `Request failed (${response.status}).`);
      router.push((data.user?.role || data.user?.roles?.[0]) === 'client' ? '/client' : '/student');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally { setBusy(false); }
  }

  return (
    <main className="auth-layout">
      <section className="auth-aside">
        <Brand className="brand-on-dark" />
        <div className="auth-aside-copy"><span className="eyebrow">YOUR WORK, YOUR STORY</span><h1>Make room for<br /><em>what you can do.</em></h1><p>Build a profile that brings your skills, projects and ambitions into focus.</p></div>
        <div className="auth-aside-bottom"><span>SKILL FOR HIRE</span><span>STUDENT TALENT, IN FOCUS.</span></div>
      </section>
      <section className="auth-main">
        <div className="auth-top"><Link href="/" className="back-link">← Back to home</Link></div>
        <div className="auth-form-wrap">
          <span className="eyebrow">{mode === 'register' ? 'A GOOD PLACE TO START' : 'GOOD TO HAVE YOU BACK'}</span>
          <h2>{mode === 'register' ? 'Create your account' : 'Welcome back'}</h2>
          <p className="auth-subtitle"> {mode === 'register' ? 'Set up your space. Your next opportunity starts with a profile.' : 'Sign in to continue to your Skill For Hire workspace.'}</p>
          <div className="auth-tabs"><button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setError(''); }}>Create account</button><button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError(''); }}>Log in</button></div>
          <form onSubmit={submit} className="auth-fields">
            {mode === 'register' && <div className="role-choice" role="group" aria-label="Choose account type"><button type="button" className={role === 'student' ? 'selected' : ''} onClick={() => setRole('student')}><strong>I'm a student</strong><span>Showcase skills and apply for gigs</span></button><button type="button" className={role === 'client' ? 'selected' : ''} onClick={() => setRole('client')}><strong>I'm a client</strong><span>Post gigs and hire student talent</span></button></div>}
            {mode === 'register' && <label>Full name<input value={fullName} onChange={e => setFullName(e.target.value)} required minLength={2} maxLength={100} autoComplete="name" placeholder="Your name" /></label>}
            <label>Email address<input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" placeholder="you@university.edu" /></label>
            {/* --- Show/Hide Password Start --- */}
            <label>Password
              <div style={{ position: 'relative' }}>
                <input type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required minLength={mode === 'register' ? 10 : 1} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} placeholder="Enter your password" style={{ paddingRight: '42px' }} />
                <button type="button" onClick={() => setShow(s => !s)}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>
                  {show
                    ? <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60777A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60777A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </label>
            {/* --- Show/Hide Password End --- */}
            {mode === 'register' && <p className="field-hint">Use at least 10 characters, including uppercase, lowercase and a number.</p>}
            {error && <p role="alert" className="form-error">{error}</p>}
            <button disabled={busy} className="button button-primary auth-submit">{busy ? 'Please wait…' : mode === 'register' ? 'Create account' : 'Sign in'} <span>↗</span></button>
          </form>
          <p className="auth-legal">By continuing, you agree to use Skill For Hire respectfully and responsibly.</p>
        </div>
      </section>
    </main>
  );
}
