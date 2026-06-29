import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap, Code, ShieldAlert, BookOpen, Activity,
  Github, ArrowRight, Sparkles, CheckCircle2,
  HelpCircle, ChevronDown, Terminal, Cpu, BarChart3,
  MessageSquare, Star, Users, Clock, Globe
} from 'lucide-react';

/* ─── Animated Number ───────────────────────────────────────────── */
const AnimatedStat = ({ end, suffix = '', label }: { end: number; suffix?: string; label: string }) => {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      const start = performance.now();
      const dur = 1500;
      const tick = (now: number) => {
        const p = Math.min((now - start) / dur, 1);
        setVal(Math.floor(p * end));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      obs.disconnect();
    }, { threshold: 0.4 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end]);
  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-br from-white to-gray-300">
        {val.toLocaleString()}{suffix}
      </div>
      <div className="text-xs text-gray-500 mt-1 font-medium">{label}</div>
    </div>
  );
};

/* ─── FAQ Item ───────────────────────────────────────────────────── */
const FaqItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <button
      className="w-full text-left p-5 border border-white/[0.06] glass-panel rounded-2xl cursor-pointer hover:border-purple-500/20 transition-all"
      onClick={() => setOpen(o => !o)}
    >
      <div className="flex items-start gap-3">
        <HelpCircle className="h-4 w-4 text-purple-400 mt-0.5 shrink-0" />
        <div className="flex-1">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-bold text-gray-200">{q}</h4>
            <ChevronDown className={`h-4 w-4 text-gray-500 shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
          </div>
          {open && (
            <p className="text-xs text-gray-400 mt-3 leading-relaxed animate-slide-down">{a}</p>
          )}
        </div>
      </div>
    </button>
  );
};

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: 'AI Code Generation',
      desc: 'Instant portfolio-grade software blocks inside a Monaco Editor using Gemini, Claude, or GPT-4o.',
      icon: Code,
      accent: 'from-purple-500/10 to-purple-500/5 border-purple-500/20 text-purple-400',
      glow: 'hover:shadow-[0_0_30px_rgba(139,92,246,0.15)]',
    },
    {
      title: 'Automated Code Review',
      desc: 'Deep analysis with security, readability, performance & maintainability scores on each submission.',
      icon: Activity,
      accent: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 text-emerald-400',
      glow: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.12)]',
    },
    {
      title: 'Proactive Bug Scanner',
      desc: 'Detects null pointers, memory leaks, and CVE vulnerabilities with one-click Quick Fix patches.',
      icon: ShieldAlert,
      accent: 'from-rose-500/10 to-rose-500/5 border-rose-500/20 text-rose-400',
      glow: 'hover:shadow-[0_0_30px_rgba(244,63,94,0.12)]',
    },
    {
      title: 'Docs Assistant',
      desc: 'Generates READMEs, inline docstrings, and OpenAPI specs with a live markdown preview panel.',
      icon: BookOpen,
      accent: 'from-blue-500/10 to-blue-500/5 border-blue-500/20 text-blue-400',
      glow: 'hover:shadow-[0_0_30px_rgba(59,130,246,0.12)]',
    },
    {
      title: 'AI Chat Console',
      desc: 'Chat with your codebase, ask architectural questions, and get model-routed answers in real time.',
      icon: MessageSquare,
      accent: 'from-indigo-500/10 to-indigo-500/5 border-indigo-500/20 text-indigo-400',
      glow: 'hover:shadow-[0_0_30px_rgba(99,102,241,0.12)]',
    },
    {
      title: 'GitHub Integration',
      desc: 'Sync repositories, scan branches, visualise commit trends, and run codebase health audits.',
      icon: Github,
      accent: 'from-gray-500/10 to-gray-500/5 border-gray-500/20 text-gray-300',
      glow: 'hover:shadow-[0_0_30px_rgba(107,114,128,0.12)]',
    },
  ];

  const pricing = [
    {
      name: 'Starter',
      price: '$0',
      period: 'forever',
      desc: 'Everything you need to explore AI coding locally.',
      features: ['3 Workspaces', 'Mock AI provider', 'Audit history', 'File import & editor', 'Basic analytics'],
      cta: 'Start Free',
      popular: false,
    },
    {
      name: 'Developer Pro',
      price: '$29',
      period: 'per month',
      desc: 'Unlock real provider APIs and unlimited projects.',
      features: ['Unlimited Workspaces', 'Gemini, OpenAI & Claude routing', 'GitHub repo reviews', 'Advanced analytics', 'Priority support', 'WebSocket live sync'],
      cta: 'Go Pro',
      popular: true,
    },
  ];

  const faqs = [
    { q: 'Can I connect private repositories?', a: 'Yes. CodeFlow AI uses temporary read-only scopes to scan your repositories — we never store raw code permanently.' },
    { q: 'How does AI provider switching work?', a: 'Add your API keys in Settings. The system routes requests to Gemini, OpenAI, or Claude based on your selection at runtime.' },
    { q: 'Is there a fallback without API keys?', a: 'Absolutely! The built-in Mock provider returns structured metric outputs so you can explore every UI feature instantly.' },
    { q: 'Is my data secure?', a: 'All sessions use JWT authentication with token refresh. API keys are stored only in your browser\'s local storage — never on our servers.' },
  ];

  return (
    <div className="relative min-h-screen bg-[#08070d] text-gray-100 overflow-x-hidden overflow-y-auto">
      {/* Background Effects */}
      <div className="fixed inset-0 grid-mesh pointer-events-none z-0" />
      <div className="aurora-bg fixed z-0" />
      <div className="fixed top-[-15%] right-[-12%] w-[55%] h-[55%] rounded-full bg-purple-950/15 glow-orb" />
      <div className="fixed bottom-[10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-indigo-950/12 glow-orb-2" />
      <div className="fixed top-[50%] left-[40%] w-[30%] h-[30%] rounded-full bg-blue-950/8 glow-orb-2" />

      {/* ── Navigation ──────────────────────────────────────────── */}
      <nav className="relative z-20 border-b border-white/[0.055] glass-panel h-16 flex items-center justify-between px-6 md:px-12 sticky top-0">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-black text-white text-sm shadow-lg shadow-purple-500/30">
            CF
          </div>
          <span className="font-extrabold text-base bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
            CodeFlow AI
          </span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#features" className="hidden md:block text-sm text-gray-400 hover:text-gray-100 transition-colors">Features</a>
          <a href="#pricing"  className="hidden md:block text-sm text-gray-400 hover:text-gray-100 transition-colors">Pricing</a>
          <a href="#faq"      className="hidden md:block text-sm text-gray-400 hover:text-gray-100 transition-colors">FAQ</a>
          <button
            onClick={() => navigate('/auth')}
            className="px-4 py-2 rounded-xl text-sm font-semibold border border-white/[0.08] hover:bg-white/[0.06] text-gray-300 hover:text-white transition-all cursor-pointer"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/auth')}
            className="px-4 py-2 rounded-xl text-sm font-bold btn-premium-gradient text-white cursor-pointer"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <header className="relative z-10 max-w-5xl mx-auto text-center pt-28 pb-20 px-6">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/8 text-purple-300 text-xs font-bold mb-8 backdrop-blur-sm">
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          Next-Generation AI Developer Platform
        </div>

        <h1 className="text-5xl md:text-7xl font-black leading-[1.08] tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-gray-100 to-gray-400">
            The Intelligent Hub for
          </span>
          <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 text-glow-purple">
            Smarter Codebases
          </span>
        </h1>

        <p className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto mt-6 leading-relaxed">
          Generate code, scan bugs in real time, run quality reviews, and publish documentation — all inside one premium glassmorphic workspace.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
          <button
            onClick={() => navigate('/auth')}
            className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl text-base font-bold btn-premium-gradient text-white cursor-pointer ripple-container"
          >
            <Zap className="h-4.5 w-4.5" />
            Launch Free Workspace
            <ArrowRight className="h-4.5 w-4.5" />
          </button>
          <button
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl text-base font-semibold border border-white/[0.08] hover:bg-white/[0.05] hover:border-white/[0.14] text-gray-300 transition-all cursor-pointer"
          >
            Explore Features
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-5 mt-12 text-xs text-gray-500">
          {['No credit card required', 'Open-source stack', 'JWT-secured', 'WebSocket live sync'].map(b => (
            <div key={b} className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              {b}
            </div>
          ))}
        </div>
      </header>

      {/* ── Stats Bar ────────────────────────────────────────────── */}
      <section className="relative z-10 border-y border-white/[0.05] bg-white/[0.015] backdrop-blur-sm py-10">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-white/[0.05]">
          <AnimatedStat end={15000}  suffix="+"  label="Lines Reviewed"   />
          <AnimatedStat end={4}      suffix="+"  label="AI Providers"      />
          <AnimatedStat end={99}     suffix="%"  label="Uptime"            />
          <AnimatedStat end={500}    suffix="ms" label="Avg Response Time" />
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section id="features" className="relative z-10 max-w-6xl mx-auto py-24 px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.07] bg-white/[0.03] text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-4">
            Full Suite
          </div>
          <h2 className="text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
            Every Tool You Need
          </h2>
          <p className="text-sm text-gray-500 mt-3 max-w-lg mx-auto">From code generation to production-ready documentation — all connected in one dashboard.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className={`p-6 border bg-gradient-to-br glass-panel rounded-2xl glass-panel-hover flex gap-4 transition-all ${f.accent} ${f.glow} cursor-default`}
              >
                <div className={`h-11 w-11 rounded-xl border flex items-center justify-center shrink-0 ${f.accent}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-100 text-sm">{f.title}</h4>
                  <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────── */}
      <section id="pricing" className="relative z-10 max-w-4xl mx-auto py-24 px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.07] bg-white/[0.03] text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-4">
            Pricing
          </div>
          <h2 className="text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
            Simple, Transparent Plans
          </h2>
          <p className="text-sm text-gray-500 mt-3">Start free. Upgrade when you're ready for real API routing.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {pricing.map((p, i) => (
            <div
              key={i}
              className={`relative flex flex-col p-8 border glass-panel rounded-2xl ${
                p.popular
                  ? 'border-purple-500/40 shadow-2xl shadow-purple-500/10'
                  : 'border-white/[0.07]'
              }`}
            >
              {p.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-purple-600 to-indigo-500 text-white text-[10px] font-black uppercase tracking-wider shadow-lg">
                  Most Popular
                </div>
              )}

              <div>
                <h4 className="text-lg font-black text-gray-100">{p.name}</h4>
                <p className="text-[11px] text-gray-500 mt-1">{p.desc}</p>
                <div className="my-5 flex items-end gap-1">
                  <span className="text-4xl font-black text-white">{p.price}</span>
                  <span className="text-gray-500 text-sm pb-1">/ {p.period}</span>
                </div>
              </div>

              <ul className="flex flex-col gap-2.5 border-t border-white/[0.05] pt-5 flex-1">
                {p.features.map((f, fi) => (
                  <li key={fi} className="flex items-center gap-2.5 text-xs text-gray-300">
                    <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${p.popular ? 'text-purple-400' : 'text-emerald-500'}`} />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => navigate('/auth')}
                className={`w-full py-3 rounded-xl font-bold text-sm mt-8 cursor-pointer transition-all ${
                  p.popular
                    ? 'btn-premium-gradient text-white'
                    : 'border border-white/[0.08] hover:bg-white/[0.06] text-gray-300 hover:text-white'
                }`}
              >
                {p.cta} <ArrowRight className="inline-block h-3.5 w-3.5 ml-1" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────── */}
      <section id="faq" className="relative z-10 max-w-3xl mx-auto py-20 px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
            Frequently Asked
          </h2>
        </div>
        <div className="flex flex-col gap-3">
          {faqs.map((faq, i) => <FaqItem key={i} {...faq} />)}
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────── */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-24">
        <div className="relative p-10 md:p-14 border border-purple-500/25 rounded-3xl bg-gradient-to-br from-purple-950/30 via-[#090812] to-indigo-950/20 text-center overflow-hidden">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/5 to-indigo-500/5" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-purple-500/60 to-transparent" />
          <div className="relative z-10">
            <Sparkles className="h-8 w-8 text-purple-400 mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-black text-white mb-3">
              Start building smarter today
            </h2>
            <p className="text-gray-400 text-sm mb-8 max-w-md mx-auto">
              Join developers using CodeFlow AI to review, generate, and document code at unprecedented speed.
            </p>
            <button
              onClick={() => navigate('/auth')}
              className="px-10 py-3.5 rounded-2xl font-black text-base btn-premium-gradient text-white cursor-pointer"
            >
              Launch Your Workspace →
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/[0.05] py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-black text-white text-[10px]">CF</div>
            <span className="text-sm font-bold text-gray-400">CodeFlow AI</span>
          </div>
          <p className="text-[11px] text-gray-600 text-center">
            © 2026 CodeFlow AI — Built with React 19, FastAPI & WebSockets. Premium SaaS Demo.
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <a href="#features" className="hover:text-gray-300 transition-colors">Features</a>
            <a href="#pricing"  className="hover:text-gray-300 transition-colors">Pricing</a>
            <a href="#faq"      className="hover:text-gray-300 transition-colors">FAQ</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
