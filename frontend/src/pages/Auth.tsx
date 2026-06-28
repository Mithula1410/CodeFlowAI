import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import axios from 'axios';
import { Mail, Lock, User, Github, Chrome, ArrowLeft } from 'lucide-react';

const AuthPage: React.FC = () => {
  const { login } = useAuth();
  const { addToast } = useNotification();
  const navigate = useNavigate();

  const [isLoginTab, setIsLoginTab] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    
    setLoading(true);
    try {
      if (isLoginTab) {
        // Authenticate
        const params = new URLSearchParams();
        params.append('username', email);
        params.append('password', password);
        
        const response = await axios.post('/api/v1/auth/login', params, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        
        await login(response.data.access_token, response.data.refresh_token);
        addToast("Welcome back!", "Successfully authenticated user session.", "success");
        navigate('/dashboard');
      } else {
        // Register
        await axios.post('/api/v1/auth/register', {
          email,
          password,
          full_name: fullName || null
        });
        addToast("Registration Complete", "Account created successfully. Please login.", "success");
        setIsLoginTab(true);
        setPassword('');
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || "Authentication request failed.";
      addToast("Failed to authenticate", errMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthPlaceholder = (provider: string) => {
    addToast(
      `${provider} Connect`,
      `OAuth redirection triggers are simulated for portfolio display.`,
      "info"
    );
  };

  return (
    <div className="relative min-h-screen w-screen flex items-center justify-center bg-[#08070d] text-gray-100 overflow-hidden px-4">
      {/* Background Orbs */}
      <div className="absolute inset-0 grid-mesh pointer-events-none z-0" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-purple-900/10 glow-orb" />

      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 z-10 flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-xs text-gray-400 hover:text-gray-200 bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Home
      </button>

      {/* Auth Card */}
      <div className="w-full max-w-md p-8 border border-border glass-panel rounded-2xl shadow-2xl relative z-10 animate-scale-in">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-bold text-white text-sm">
            C
          </div>
          <span className="font-extrabold text-base tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            CodeFlow AI
          </span>
        </div>

        {/* Tab selector */}
        <div className="flex items-center gap-1 p-1 bg-white/5 border border-border rounded-xl mb-6">
          <button
            onClick={() => setIsLoginTab(true)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              isLoginTab ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setIsLoginTab(false)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              !isLoginTab ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Register
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLoginTab && (
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-white/5 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-gray-500" />
              <input
                type="email"
                required
                placeholder="dev@codeflow.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-gray-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 via-purple-600 to-indigo-500 text-white hover:brightness-110 shadow-lg shadow-purple-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? "Authenticating..." : isLoginTab ? "Sign In" : "Register Account"}
          </button>
        </form>

        {/* Separator */}
        <div className="flex items-center my-6 gap-3">
          <div className="flex-1 h-[1px] bg-border/60" />
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Or login with</span>
          <div className="flex-1 h-[1px] bg-border/60" />
        </div>

        {/* Third Party OAuth */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleOAuthPlaceholder('GitHub')}
            className="flex items-center justify-center gap-2.5 py-2.5 rounded-xl border border-border hover:bg-white/5 text-gray-300 text-xs font-semibold transition-all cursor-pointer"
          >
            <Github className="h-4 w-4" />
            GitHub
          </button>
          <button
            onClick={() => handleOAuthPlaceholder('Google')}
            className="flex items-center justify-center gap-2.5 py-2.5 rounded-xl border border-border hover:bg-white/5 text-gray-300 text-xs font-semibold transition-all cursor-pointer"
          >
            <Chrome className="h-4 w-4" />
            Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
