import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  GraduationCap,
  Volume2,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuthContext } from '../contexts/AuthContext';
import styles from './HomePage.module.css';

const STEPS = [
  {
    title: 'Upload your pages',
    text: 'Import a PDF or add images. Each page becomes an interactive canvas.',
  },
  {
    title: 'Map words to audio',
    text: 'Draw boxes around words and attach recordings. Build lessons page by page.',
  },
  {
    title: 'Students tap to learn',
    text: 'Learners open the book, tap any mapped word, and hear it spoken aloud.',
  },
] as const;

function HeroPreview() {
  return (
    <div className={styles.heroVisual} aria-hidden>
      <div className={styles.preview}>
        <div className={styles.previewBar}>
          <span className={styles.previewTitle}>My First Book</span>
          <span>Page 3 of 12</span>
        </div>
        <div className={styles.previewPage}>
          <span className={styles.wordBox}>The</span>
          <span className={styles.wordBox}>quick</span>
          <span className={`${styles.wordBox} ${styles.wordBoxActive}`}>brown</span>
          <span className={styles.wordBox}>fox</span>
          <span className={styles.wordBox}>jumps</span>
          <span className={styles.wordBox}>over</span>
          <span className={styles.wordBox}>the</span>
          <span className={styles.wordBox}>lazy</span>
          <span className={styles.wordBox}>dog.</span>
        </div>
        <div className={styles.previewFooter}>
          <Volume2 size={16} strokeWidth={2} />
          Tap a word to listen
        </div>
      </div>
    </div>
  );
}

export function HomePage() {
  const { user, loading } = useAuthContext();
  const navigate = useNavigate();
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (loading) {
    return (
      <div className="loadingScreen">
        <span className="loadingWordmark">Lugha</span>
        <p className="loadingMessage">Loading…</p>
        <div className="loadingSpinner" aria-hidden />
      </div>
    );
  }

  if (user) return <Navigate to="/library" replace />;

  return (
    <div className={styles.page}>
      <header className={`${styles.nav} ${navScrolled ? styles.navScrolled : ''}`}>
        <Link to="/" className={styles.wordmark} aria-label="Lugha home">
          Lugha
        </Link>
        <div className={styles.navActions}>
          <Button variant="link" className={styles.navSignIn} onClick={() => navigate('/login')}>
            Sign in
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/signup')}>
            Get started
          </Button>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.hero} aria-labelledby="hero-heading">
          <div className={styles.heroCopy}>
            <p className={styles.overline}>Language learning, made interactive</p>
            <h1 id="hero-heading" className={styles.headline}>
              Learn to read with{' '}
              <span className={styles.accent}>every tap</span>
            </h1>
            <p className={styles.lead}>
              Lugha turns any book into an audio-guided lesson. Teachers build
              libraries, students listen and learn — all in one calm, focused space.
            </p>
            <div className={styles.heroActions}>
              <Button variant="primary" onClick={() => navigate('/signup')}>
                Create free account
              </Button>
              <Button variant="secondary" onClick={() => navigate('/login')}>
                Sign in
              </Button>
            </div>
            <p className={styles.heroNote}>Free for teachers and students</p>
          </div>
          <HeroPreview />
        </section>

        <section className={styles.stats} aria-label="Highlights">
          <div className={styles.statsInner}>
            <div className={styles.stat}>
              <span className={styles.statValue}>Any book</span>
              <span className={styles.statLabel}>PDF import or image upload</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>Your library</span>
              <span className={styles.statLabel}>Organized by class or category</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>Cloud sync</span>
              <span className={styles.statLabel}>Progress saved across devices</span>
            </div>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="how-heading">
          <div className={styles.sectionHeader}>
            <p className={styles.sectionOverline}>How it works</p>
            <h2 id="how-heading" className={styles.sectionTitle}>
              From page to pronunciation in three steps
            </h2>
          </div>
          <ol className={styles.steps}>
            {STEPS.map((step, i) => (
              <li key={step.title} className={styles.step}>
                <span className={styles.stepNum}>{i + 1}</span>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepText}>{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.section} aria-labelledby="roles-heading">
          <div className={styles.sectionHeader}>
            <p className={styles.sectionOverline}>Who it&apos;s for</p>
            <h2 id="roles-heading" className={styles.sectionTitle}>
              Built for classrooms and independent learners
            </h2>
          </div>
          <div className={styles.roles}>
            <article className={styles.roleCard}>
              <span className={styles.roleIcon} aria-hidden>
                <GraduationCap size={24} strokeWidth={1.75} />
              </span>
              <h3 className={styles.roleTitle}>Teachers</h3>
              <p className={styles.roleText}>
                Create an organization, upload books, and invite students with a simple code.
              </p>
              <ul className={styles.roleList}>
                <li>Import PDFs and map word audio</li>
                <li>Organize books into categories</li>
                <li>Share invite codes with your class</li>
              </ul>
              <Button variant="primary" onClick={() => navigate('/signup?role=teacher')}>
                Start as a teacher
              </Button>
            </article>
            <article className={styles.roleCard}>
              <span className={styles.roleIcon} aria-hidden>
                <BookOpen size={24} strokeWidth={1.75} />
              </span>
              <h3 className={styles.roleTitle}>Students</h3>
              <p className={styles.roleText}>
                Join with an invite code from your teacher and access your personal library.
              </p>
              <ul className={styles.roleList}>
                <li>Tap words to hear pronunciation</li>
                <li>Track points and reading progress</li>
                <li>Pick up where you left off</li>
              </ul>
              <Button variant="secondary" onClick={() => navigate('/signup?role=student')}>
                Join as a student
              </Button>
            </article>
          </div>
        </section>

        <section className={styles.ctaBand} aria-labelledby="cta-heading">
          <div className={styles.ctaInner}>
            <div className={styles.ctaCopy}>
              <h2 id="cta-heading" className={styles.ctaTitle}>
                Ready to bring your books to life?
              </h2>
              <p className={styles.ctaText}>
                Set up takes minutes. No credit card required.
              </p>
            </div>
            <div className={styles.ctaActions}>
              <Button
                className={styles.ctaPrimary}
                variant="primary"
                onClick={() => navigate('/signup')}
              >
                Get started free
              </Button>
              <Button
                className={styles.ctaSecondary}
                variant="secondary"
                onClick={() => navigate('/login')}
              >
                Sign in
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <span className={styles.footerBrand}>Lugha</span>
        Interactive audio word learning for every reader
      </footer>
    </div>
  );
}
