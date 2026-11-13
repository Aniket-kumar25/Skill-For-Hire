import Link from 'next/link';

import Brand from './components/Brand';

const features = [
  { number: '01', title: 'A profile that feels like you', text: 'Bring your background, interests and strengths together in one clear student profile.' },
  { number: '02', title: 'Proof of what you can do', text: 'Showcase real projects, the tools you used and the work you are proud to share.' },
  { number: '03', title: 'Work on your terms', text: 'Keep your availability current so campus clients know when you are open to opportunities.' }
];

export default function HomePage() {
  return (
    <main className="site-shell">
      <header className="site-header">
        <Brand />
        <nav className="header-actions">
          <a href="#how-it-works" className="nav-link">How it works</a>
          
          <Link href="/auth" className="nav-link">Log in</Link>
          <Link href="/auth" className="button button-primary button-small">Get started <span>↗</span></Link>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> THE CAMPUS TALENT NETWORK</div>
          <h1>Your talent deserves<br />a <em>place to be seen.</em></h1>
          <p className="hero-description">A considered space for students to shape their profile, share the work they have made, and get ready for what comes next.</p>
          <div className="hero-actions">
            <Link href="/auth" className="button button-primary">Build your profile <span>↗</span></Link>
            <a href="#how-it-works" className="text-link">Explore the platform <span>↓</span></a>
          </div>
          <div className="hero-footnote"><span className="footnote-line" /> Made for student creators, builders and doers.</div>
        </div>

        <div className="profile-stage" aria-label="Illustrative student profile preview">
          <div className="stage-note">A BETTER WAY TO INTRODUCE YOUR WORK</div>
          <article className="preview-card">
            <div className="preview-top"><span className="preview-label">STUDENT / PROFILE</span><span className="availability"><i /> AVAILABLE</span></div>
            <div className="preview-person">
              <div className="avatar">AK</div>
              <div><h2>Alex Kumar</h2><p>Frontend developer</p><small>Computer Science · Year 3</small></div>
            </div>
            <p className="preview-bio">I turn thoughtful ideas into useful digital experiences, with a focus on clean interfaces and accessible design.</p>
            <div className="preview-divider" />
            <div className="preview-section-heading"><span>SELECTED SKILLS</span><span>04</span></div>
            <div className="skill-pills"><span>React</span><span>Next.js</span><span>JavaScript</span><span>UI Design</span></div>
            <div className="preview-divider" />
            <div className="preview-section-heading"><span>RECENT WORK</span><span>02 PROJECTS</span></div>
            <div className="work-row"><div className="work-thumb work-thumb-one">01</div><div><b>Campus Connect</b><small>Product · Web application</small></div><span className="work-arrow">↗</span></div>
            <div className="work-row"><div className="work-thumb work-thumb-two">02</div><div><b>Expense Buddy</b><small>Personal · Finance tracker</small></div><span className="work-arrow">↗</span></div>
          </article>
          <div className="floating-index"><span>PROFILE COMPLETENESS</span><b>85%</b><div><i /></div></div>
          <div className="stage-caption">A profile is more than a list of skills. <span>Make it yours.</span></div>
        </div>
      </section>

      <section className="manifesto" id="how-it-works">
        <div className="manifesto-heading"><span className="eyebrow">BUILT AROUND YOUR POTENTIAL</span><h2>Everything you need.<br /><em>Nothing you don't.</em></h2></div>
        <div className="feature-list">
          {features.map((feature) => <article className="feature-item" key={feature.number}><span className="feature-number">{feature.number}</span><div><h3>{feature.title}</h3><p>{feature.text}</p></div><span className="feature-arrow">↗</span></article>)}
        </div>
      </section>

      <section className="closing-band">
        <div><span className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</span><h2>Put your skills<br /><em>into motion.</em></h2></div>
        <Link href="/auth" className="button button-light">Create your account <span>↗</span></Link>
      </section>
      <footer className="site-footer"><Brand /><span>Student Skill &amp; Portfolio Service</span><span>© 2026 Skill For Hire</span></footer>
    </main>
  );
}
