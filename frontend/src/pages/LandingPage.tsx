import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, 
  Code, 
  ShieldAlert, 
  BookOpen, 
  Activity, 
  Github, 
  ArrowRight,
  Sparkles,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: "AI Code Generation",
      desc: "Instant portfolio-grade software blocks inside a Monaco Editor using Gemini, Claude, or GPT models.",
      icon: Code,
      color: "text-purple-400 border-purple-500/20 bg-purple-500/5"
    },
    {
      title: "Automated Code Review",
      desc: "Deep analysis reports scoring security, readability, and performance metrics dynamically.",
      icon: Activity,
      color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5"
    },
    {
      title: "Proactive Bug Scanner",
      desc: "Identifies null pointer exceptions, unoptimized queries, and vulnerabilities with Quick Fix patches.",
      icon: ShieldAlert,
      color: "text-rose-400 border-rose-500/20 bg-rose-500/5"
    },
    {
      title: "Documentation Assistant",
      desc: "Generates production-ready READMEs, inline docstrings, and API specs with live markdown side-previews.",
      icon: BookOpen,
      color: "text-blue-400 border-blue-500/20 bg-blue-500/5"
    }
  ];

  const pricing = [
    {
      name: "Starter Bundle",
      price: "$0",
      desc: "Explore AI assistance locally with mock fallbacks and active workspaces.",
      features: [
        "Create up to 3 Workspaces",
        "Mock AI Provider models access",
        "Global search history log",
        "Local file imports and editors"
      ],
      cta: "Start Coding Free",
      popular: false
    },
    {
      name: "Developer Pro",
      price: "$29",
      desc: "Access direct API provider routing for Google, OpenAI, and Anthropic.",
      features: [
        "Unlimited Workspaces & Projects",
        "Dynamic Provider switching API access",
        "Full Repository reviews via GitHub",
        "Interactive analytics charts",
        "Fast Celery background worker scans"
      ],
      cta: "Go Pro Now",
      popular: true
    }
  ];

  const faqs = [
    {
      q: "Can I connect my private repositories safely?",
      a: "Yes. CodeFlow AI coordinates scans using temporary scopes or direct file imports without ever storing your raw repositories permanently."
    },
    {
      q: "How does provider switching work?",
      a: "You can supply your personal API keys for Gemini, OpenAI, or Claude in your profile settings. The system routes completions dynamically according to your choice."
    },
    {
      q: "Is there a local fallback if I don't have API keys?",
      a: "Absolutely! The system has a built-in Mock provider which returns structural mock metrics, reviews, and bugs so you can experience all UI layers immediately."
    }
  ];

  return (
    <div className="relative min-h-screen bg-[#08070d] text-gray-100 overflow-x-hidden">
      {/* Mesh Background */}
      <div className="absolute inset-0 grid-mesh pointer-events-none z-0" />
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-950/20 glow-orb" />
      <div className="absolute bottom-[20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-950/15 glow-orb" />

      {/* Navigation Header */}
      <nav className="relative z-10 border-b border-border glass-panel h-16 flex items-center justify-between px-6 md:px-12">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-bold text-white">
            C
          </div>
          <span className="font-bold text-lg">CodeFlow AI</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#features" className="text-sm text-gray-400 hover:text-gray-200 transition-all">Features</a>
          <a href="#pricing" className="text-sm text-gray-400 hover:text-gray-200 transition-all">Pricing</a>
          <button
            onClick={() => navigate('/auth')}
            className="px-4 py-2 rounded-xl text-sm font-semibold border border-border hover:bg-white/5 transition-all cursor-pointer"
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative z-10 max-w-5xl mx-auto text-center pt-24 pb-16 px-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/25 bg-purple-500/5 text-purple-300 text-xs font-semibold mb-6 animate-pulse">
          <Sparkles className="h-3.5 w-3.5" />
          Next Generation AI Coding Assistant
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white via-gray-200 to-gray-400">
          The Intelligent Hub for<br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400">
            Smarter Codebases
          </span>
        </h1>
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mt-6 leading-relaxed">
          Generate code, scan bugs in real-time, execute review metrics, and build documentation in one glassmorphic workspace.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
          <button
            onClick={() => navigate('/auth')}
            className="flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-500 text-white hover:brightness-110 shadow-lg shadow-purple-500/25 transition-all cursor-pointer"
          >
            Launch Free Workspace
            <ArrowRight className="h-5 w-5" />
          </button>
          <button
            onClick={() => {
              const element = document.getElementById('features');
              element?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-8 py-3.5 rounded-xl text-base font-semibold border border-border hover:bg-white/5 transition-all cursor-pointer"
          >
            Explore Capabilities
          </button>
        </div>
      </header>

      {/* Features grid */}
      <section id="features" className="relative z-10 max-w-5xl mx-auto py-20 px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
            Full Suite AI Engine
          </h2>
          <p className="text-sm text-gray-400 mt-2">Everything required to review, scan, document and generate software blocks.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="p-6 border border-border glass-panel rounded-2xl glass-panel-hover flex gap-4">
                <div className={`h-12 w-12 rounded-xl border flex items-center justify-center shrink-0 ${f.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-100">{f.title}</h4>
                  <p className="text-sm text-gray-400 mt-2 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pricing Grid */}
      <section id="pricing" className="relative z-10 max-w-4xl mx-auto py-20 px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
            Simple, Transparent Plans
          </h2>
          <p className="text-sm text-gray-400 mt-2">Get started for free or unlock API integrations on the go.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          {pricing.map((p, i) => (
            <div 
              key={i} 
              className={`p-8 border glass-panel rounded-2xl relative flex flex-col justify-between ${
                p.popular ? 'border-purple-500/50 shadow-xl shadow-purple-500/5' : 'border-border'
              }`}
            >
              {p.popular && (
                <div className="absolute top-0 right-6 -translate-y-1/2 px-3 py-1 rounded-full bg-purple-600 text-white text-[10px] font-bold uppercase tracking-wider">
                  Popular Option
                </div>
              )}
              <div>
                <h4 className="text-xl font-bold text-gray-100">{p.name}</h4>
                <p className="text-xs text-gray-400 mt-1">{p.desc}</p>
                <div className="my-6">
                  <span className="text-4xl font-extrabold text-white">{p.price}</span>
                  <span className="text-gray-400 text-sm"> / month</span>
                </div>
                <ul className="flex flex-col gap-3 border-t border-border/60 pt-6">
                  {p.features.map((f, fi) => (
                    <li key={fi} className="flex items-center gap-2.5 text-sm text-gray-300">
                      <CheckCircle2 className="h-4.5 w-4.5 text-purple-400" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => navigate('/auth')}
                className={`w-full py-3 rounded-xl font-bold text-sm mt-8 transition-all cursor-pointer ${
                  p.popular
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-500 text-white hover:brightness-110 shadow-lg shadow-purple-500/25'
                    : 'border border-border hover:bg-white/5 text-gray-300'
                }`}
              >
                {p.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 max-w-3xl mx-auto py-20 px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
            Frequently Asked Questions
          </h2>
        </div>
        <div className="flex flex-col gap-4">
          {faqs.map((faq, i) => (
            <div key={i} className="p-6 border border-border glass-panel rounded-2xl">
              <div className="flex items-start gap-3">
                <HelpCircle className="h-5 w-5 text-purple-400 mt-0.5" />
                <div>
                  <h4 className="font-bold text-gray-200">{faq.q}</h4>
                  <p className="text-sm text-gray-400 mt-2 leading-relaxed">{faq.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/60 bg-black/45 py-12 px-6 text-center">
        <p className="text-xs text-gray-500">© 2026 CodeFlow AI. Built with React 19, FastAPI & WebSockets. Portfolio-ready SaaS application.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
