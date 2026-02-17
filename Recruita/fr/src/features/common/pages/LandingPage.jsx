import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="min-h-screen text-white">
      <nav className="sticky top-0 z-10 border-b border-white/10 bg-black/30 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between gap-4">
          <div className="font-semibold tracking-tight">
            <span className="text-white">Recruita</span>
          </div>

          <div className="hidden sm:flex items-center gap-6 text-sm text-white/70">
            <a className="hover:text-white" href="#features">Features</a>
            <a className="hover:text-white" href="#how-it-works">How it works</a>
          </div>
        </div>
      </nav>

      <header className="relative">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-18">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight">
              Smart recruiting with AI-powered matching
            </h1>
            <p className="mt-5 text-base sm:text-lg text-white/70">
              Connect job seekers with the right opportunities using resume parsing and ranked candidate scoring.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl p-6 shadow-2xl">
              <h2 className="text-lg font-semibold">For Job Seekers</h2>
              <p className="mt-1 text-sm text-white/70">Upload your resume, apply faster, and track your progress.</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  to="/jobseeker/login"
                  className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400"
                >
                  Login
                </Link>
                <Link
                  to="/jobseeker/signup"
                  className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/85 hover:bg-white/10 hover:text-white"
                >
                  Sign Up
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl p-6 shadow-2xl">
              <h2 className="text-lg font-semibold">For Recruiters</h2>
              <p className="mt-1 text-sm text-white/70">Post jobs, receive applications, and review ranked applicants.</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  to="/recruiter/login"
                  className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400"
                >
                  Login
                </Link>
                <Link
                  to="/recruiter/signup"
                  className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/85 hover:bg-white/10 hover:text-white"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section id="features" className="mx-auto max-w-6xl px-4 py-12">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold">Why Recruita?</h2>
          <p className="mt-2 text-sm sm:text-base text-white/70">Built for speed, clarity, and better hiring decisions.</p>
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: '📄', title: 'Resume Parsing', desc: 'Extract skills and experience from resumes.' },
            { icon: '🎯', title: 'Smart Matching', desc: 'Score candidates based on job requirements.' },
            { icon: '⚡', title: 'Quick Applications', desc: 'Apply to roles with minimal friction.' },
            { icon: '📊', title: 'Candidate Scoring', desc: 'Experience, skills, projects, semantic match.' },
            { icon: '🔍', title: 'Easy Shortlisting', desc: 'Review ranked candidates and decide faster.' },
            { icon: '💼', title: 'Job Management', desc: 'Create postings and track applicants in one place.' },
          ].map((f) => (
            <div key={f.title} className="rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl p-6 shadow-2xl">
              <div className="text-3xl">{f.icon}</div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-white/70">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-6xl px-4 pb-14">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold">How it works</h2>
          <p className="mt-2 text-sm sm:text-base text-white/70">Simple flow for both sides.</p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl p-6 shadow-2xl">
            <h3 className="text-lg font-semibold">For Job Seekers</h3>
            <ol className="mt-4 space-y-2 text-sm text-white/70 list-decimal list-inside">
              <li>Create your account</li>
              <li>Upload and parse your resume</li>
              <li>Browse available jobs</li>
              <li>Apply with one click</li>
              <li>Track your applications</li>
            </ol>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl p-6 shadow-2xl">
            <h3 className="text-lg font-semibold">For Recruiters</h3>
            <ol className="mt-4 space-y-2 text-sm text-white/70 list-decimal list-inside">
              <li>Create your account</li>
              <li>Post a job with requirements</li>
              <li>Receive applications</li>
              <li>Review AI-scored candidates</li>
              <li>Shortlist the best matches</li>
            </ol>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-black/30 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 py-8 text-center text-sm text-white/60">
          <div>© 2026 Recruita. All rights reserved.</div>
          <div className="mt-1">AI-powered recruitment platform.</div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
