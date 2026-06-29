import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import axios from 'axios';
import { Mail, Lock, User, Github, Chrome, ArrowLeft, Eye, EyeOff, Sparkles, Zap, Shield, Code } from 'lucide-react';

const FEATURES = [
  { icon: Code,    text: 'AI Code Generation with Monaco Editor' },
  { icon: Shield,  text: 'Automated Bug Scanner & Code Review'   },
  { icon: Zap,     text: 'Real-time WebSocket live sync'          },
];

const AuthPage: React.FC = () => {
  const { login }    = useAuth();
  const { addToast } = useNotification();
  const navigate     = useNavigate();

  const [isLoginTab, setIsLoginTab] = useState(true);
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    try {
      if (isLoginTab) {
        const params = new URLSearchParams();
        params.append('username', email);
        params.append('password', password);
        const res = await axios.post('/api/v1/auth/login', params, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        await login(res.data.access_token, res.data.refresh_token);
        addToast('Welcome back!', 'Session authenticated successfully.', 'success');
        navigate('/dashboard');
      } else {
        await axios.post('/api/v1/auth/register', {
          email,
          password,
          full_name: fullName || null
        });
        addToast('Account Created', 'Registration successful. Please sign in.', 'success');
        setIsLoginTab(true);
        setPassword('');
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Authentication request failed.';
      addToast('Authentication Error', msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = (provider: string) => {
    addToast(`${provider} OAuth`, 'OAuth flow is simulated for this portfolio build.', 'info');
  };

  return (
    <div className="relative min-h-screen w-screen flex items-stretch bg-[#08070d] text-gray-100 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 grid-mesh pointer-events-none z-0" />
      <div className="aurora-bg z-0" />
      <div className="absolute top-[-10%] right-[-5%]  w-[40%] h-[40%] rounded-full bg-purple-900/10 glow-orb" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-indigo-950/10 glow-orb-2" />

      {/* ── Left Panel (hidden on mobile) ─────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 border-r border-white/[0.05]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-black text-white shadow-lg shadow-purple-500/30">
              CF
            </div>
            <span className="font-extrabold text-lg bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
              CodeFlow AI
            </span>
          </div>
        </div>

        <div className="max-w-sm space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/8 text-purple-300 text-[10px] font-bold uppercase tracking-widest mb-5">
              <Sparkles className="h-3 w-3" /> Platform Features
            </div>
            <h2 className="text-3xl font-black leading-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-300">
                Your AI coding workspace
              </span>
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">
                starts here.
              </span>
            </h2>
            <p className="text-sm text-gray-500 mt-3 leading-relaxed">
              Generate, review, and document code — all inside one intelligent dashboard.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-sm text-gray-300">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-[11px] text-gray-600">© 2026 CodeFlow AI. Built with React 19 & FastAPI.</div>
      </div>

      {/* ── Right Panel: Auth Form ────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Back */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-200 mb-8 cursor-pointer transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to home
          </button>

          {/* Card */}
          <div className="border border-white/[0.07] glass-panel rounded-2xl p-8 shadow-2xl shadow-black/50 animate-scale-in">
            {/* Mobile Logo */}
            <div className="flex lg:hidden items-center justify-center gap-2 mb-6">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-black text-white text-sm">CF</div>
              <span className="font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">CodeFlow AI</span>
            </div>

            <h1 className="text-lg font-black text-gray-100 mb-1">
              {isLoginTab ? 'Sign in to your account' : 'Create your account'}
            </h1>
            <p className="text-xs text-gray-500 mb-6">
              {isLoginTab ? "Don't have an account?" : 'Already registered?'}
              {' '}
              <button
                type="button"
                onClick={() => { setIsLoginTab(t => !t); setPassword(''); }}
                className="text-purple-400 hover:text-purple-300 font-semibold cursor-pointer transition-colors"
              >
                {isLoginTab ? 'Register for free' : 'Sign in instead'}
              </button>
            </p>

            {/* Tab Pills */}
            <div className="flex gap-1 p-1 bg-white/[0.04] border border-white/[0.06] rounded-xl mb-6">
              {['Sign In', 'Register'].map((label, i) => (
                <button
                  key={label}
                  onClick={() => { setIsLoginTab(i === 0); setPassword(''); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    (i === 0) === isLoginTab
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {!isLoginTab && (
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-500" />
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full input-premium rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-200"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-500" />
                  <input
                    type="email"
                    required
                    placeholder="dev@codeflow.ai"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full input-premium rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-500" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full input-premium rounded-xl pl-10 pr-10 py-2.5 text-sm text-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(s => !s)}
                    className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-200 cursor-pointer transition-colors"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-sm btn-premium-gradient text-white cursor-pointer disabled:opacity-50 mt-1 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />{isLoginTab ? 'Signing in…' : 'Creating account…'}</>
                ) : (
                  isLoginTab ? 'Sign In' : 'Create Account'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="divider-label my-5">or continue with</div>

            {/* OAuth Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleOAuth('GitHub')}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/[0.07] hover:bg-white/[0.05] hover:border-white/[0.12] text-gray-300 text-xs font-semibold transition-all cursor-pointer"
              >
                <Github className="h-4 w-4" /> GitHub
              </button>
              <button
                onClick={() => handleOAuth('Google')}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/[0.07] hover:bg-white/[0.05] hover:border-white/[0.12] text-gray-300 text-xs font-semibold transition-all cursor-pointer"
              >
                <Chrome className="h-4 w-4" /> Google
              </button>
            </div>

            <p className="text-center text-[10px] text-gray-600 mt-5">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
