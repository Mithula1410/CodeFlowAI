import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { Key, User as UserIcon, Palette, CreditCard } from 'lucide-react';

const ProfileSettings: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useNotification();

  // Local state for API keys (simulated saving or local storage persistence)
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem('cf_gemini_key') || '');
  const [openaiKey, setOpenaiKey] = useState(localStorage.getItem('cf_openai_key') || '');
  const [claudeKey, setClaudeKey] = useState(localStorage.getItem('cf_claude_key') || '');

  // Theme settings
  const [editorTheme, setEditorTheme] = useState('vs-dark');
  const [fontSize, setFontSize] = useState('13');

  const handleSaveKeys = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('cf_gemini_key', geminiKey);
    localStorage.setItem('cf_openai_key', openaiKey);
    localStorage.setItem('cf_claude_key', claudeKey);
    addToast("Keys Updated", "Model routing secrets saved locally.", "success");
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    addToast("Preferences Saved", "Editor workspace attributes updated successfully.", "success");
  };

  return (
    <div className="p-6 md:p-8 flex flex-col gap-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          Preferences & Settings
        </h2>
        <p className="text-xs text-gray-400 mt-1">Configure your personal AI credentials, workspace preferences, and profile details.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 items-start">
        {/* Profile Card */}
        <div className="p-6 border border-border glass-panel rounded-2xl flex flex-col items-center text-center gap-4">
          <div className="h-20 w-20 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center font-bold text-purple-300 text-2xl shadow-lg shadow-purple-500/10">
            {user?.full_name?.charAt(0).toUpperCase() || user?.email.charAt(0).toUpperCase()}
          </div>
          <div>
            <h4 className="font-bold text-gray-100">{user?.full_name || 'Developer'}</h4>
            <span className="px-2 py-0.5 rounded bg-purple-600/10 border border-purple-500/20 text-purple-400 text-[10px] font-bold uppercase tracking-wider mt-1 inline-block">
              {user?.role}
            </span>
            <p className="text-xs text-gray-400 mt-2">{user?.email}</p>
          </div>
        </div>

        {/* API keys setting */}
        <div className="md:col-span-2 flex flex-col gap-6">
          {/* Custom API Keys Form */}
          <div className="p-6 border border-border glass-panel rounded-2xl">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3 mb-4">
              <Key className="h-4 w-4 text-purple-400" />
              <h3 className="text-xs font-bold text-gray-200 uppercase tracking-widest">Model Credentials</h3>
            </div>
            
            <form onSubmit={handleSaveKeys} className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Google Gemini API Key</label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="w-full bg-white/5 border border-border rounded-xl px-4 py-2 text-xs text-gray-200 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">OpenAI API Key</label>
                <input
                  type="password"
                  placeholder="sk-proj-..."
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  className="w-full bg-white/5 border border-border rounded-xl px-4 py-2 text-xs text-gray-200 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Claude Anthropic API Key</label>
                <input
                  type="password"
                  placeholder="sk-ant-..."
                  value={claudeKey}
                  onChange={(e) => setClaudeKey(e.target.value)}
                  className="w-full bg-white/5 border border-border rounded-xl px-4 py-2 text-xs text-gray-200 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white cursor-pointer"
                >
                  Save API Keys
                </button>
              </div>
            </form>
          </div>

          {/* Preferences */}
          <div className="p-6 border border-border glass-panel rounded-2xl">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3 mb-4">
              <Palette className="h-4 w-4 text-purple-400" />
              <h3 className="text-xs font-bold text-gray-200 uppercase tracking-widest">Workspace Settings</h3>
            </div>
            
            <form onSubmit={handleSavePreferences} className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Editor Theme</label>
                <select
                  value={editorTheme}
                  onChange={(e) => setEditorTheme(e.target.value)}
                  className="w-full bg-white/5 border border-border rounded-lg text-xs text-gray-200 px-3 py-2 cursor-pointer"
                >
                  <option value="vs-dark" className="bg-[#12101c]">vs-dark (Dark)</option>
                  <option value="light" className="bg-[#12101c]">vs-light (Light)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Editor Font Size</label>
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value)}
                  className="w-full bg-white/5 border border-border rounded-lg text-xs text-gray-200 px-3 py-2 cursor-pointer"
                >
                  <option value="12" className="bg-[#12101c]">12 px</option>
                  <option value="13" className="bg-[#12101c]">13 px</option>
                  <option value="14" className="bg-[#12101c]">14 px</option>
                  <option value="16" className="bg-[#12101c]">16 px</option>
                </select>
              </div>

              <div className="sm:col-span-2 flex justify-end mt-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white cursor-pointer"
                >
                  Save Preferences
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
