import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { 
  Key, Palette, User as UserIcon, Shield, Eye, EyeOff,
  Check, Copy, RefreshCw, Monitor, Type, Sun, Moon, Save
} from 'lucide-react';

/* ─── Section Card ──────────────────────────────────────────────── */
const SectionCard = ({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) => (
  <div className="border border-white/[0.06] glass-panel rounded-2xl overflow-hidden">
    <div className="flex items-center gap-2.5 px-5 py-4 border-b border-white/[0.05] bg-white/[0.015]">
      <div className="h-7 w-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <h3 className="text-xs font-bold text-gray-200 uppercase tracking-widest">{title}</h3>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

/* ─── API Key Input ──────────────────────────────────────────────── */
const ApiKeyInput = ({ label, placeholder, value, onChange }: any) => {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div>
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">{label}</label>
      <div className="relative flex items-center">
        <input
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full input-premium rounded-xl pl-4 pr-20 py-2.5 text-xs text-gray-200 font-mono"
        />
        <div className="absolute right-2 flex items-center gap-1">
          <button
            type="button"
            onClick={copy}
            title="Copy"
            className="h-7 w-7 rounded-lg hover:bg-white/[0.07] text-gray-500 hover:text-gray-200 flex items-center justify-center transition-all cursor-pointer"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
          </button>
          <button
            type="button"
            onClick={() => setVisible(v => !v)}
            title={visible ? 'Hide' : 'Show'}
            className="h-7 w-7 rounded-lg hover:bg-white/[0.07] text-gray-500 hover:text-gray-200 flex items-center justify-center transition-all cursor-pointer"
          >
            {visible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </button>
        </div>
      </div>
    </div>
  );
};

const ProfileSettings: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useNotification();

  /* API Keys */
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem('cf_gemini_key') || '');
  const [openaiKey, setOpenaiKey] = useState(localStorage.getItem('cf_openai_key') || '');
  const [claudeKey, setClaudeKey] = useState(localStorage.getItem('cf_claude_key') || '');

  /* Preferences */
  const [editorTheme, setEditorTheme] = useState(localStorage.getItem('cf_editor_theme') || 'vs-dark');
  const [fontSize, setFontSize] = useState(localStorage.getItem('cf_font_size') || '13');
  const [tabSize, setTabSize] = useState(localStorage.getItem('cf_tab_size') || '2');
  const [minimap, setMinimap] = useState(localStorage.getItem('cf_minimap') !== 'false');
  const [wordWrap, setWordWrap] = useState(localStorage.getItem('cf_wordwrap') === 'true');
  const [savingKeys, setSavingKeys] = useState(false);
  const [savingPref, setSavingPref] = useState(false);

  const handleSaveKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingKeys(true);
    await new Promise(r => setTimeout(r, 600));
    localStorage.setItem('cf_gemini_key', geminiKey);
    localStorage.setItem('cf_openai_key', openaiKey);
    localStorage.setItem('cf_claude_key', claudeKey);
    addToast('Keys Saved', 'Model credentials stored locally.', 'success');
    setSavingKeys(false);
  };

  const handleSavePref = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPref(true);
    await new Promise(r => setTimeout(r, 500));
    localStorage.setItem('cf_editor_theme', editorTheme);
    localStorage.setItem('cf_font_size', fontSize);
    localStorage.setItem('cf_tab_size', tabSize);
    localStorage.setItem('cf_minimap', String(minimap));
    localStorage.setItem('cf_wordwrap', String(wordWrap));
    addToast('Preferences Saved', 'Workspace settings updated.', 'success');
    setSavingPref(false);
  };

  const initials = user?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || user?.email?.[0]?.toUpperCase() || 'U';

  const planLabel = user?.role === 'admin' ? 'Admin' : 'Developer';

  return (
    <div className="p-6 md:p-8 flex flex-col gap-6 max-w-5xl mx-auto animate-fade-in">
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="pb-5 border-b border-white/[0.05]">
        <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400">
          Preferences & Settings
        </h1>
        <p className="text-xs text-gray-500 mt-1">Manage AI credentials, editor preferences, and account details.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 items-start">
        {/* ── Profile Card ──────────────────────────────────────── */}
        <div className="border border-white/[0.06] glass-panel rounded-2xl p-6 flex flex-col items-center text-center gap-5">
          {/* Avatar */}
          <div className="relative">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-purple-500/30 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center font-black text-purple-200 text-2xl shadow-xl shadow-purple-500/15">
              {initials}
            </div>
            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-[#08070d] flex items-center justify-center">
              <Check className="h-2.5 w-2.5 text-white" />
            </div>
          </div>

          <div className="space-y-1">
            <h4 className="font-bold text-gray-100 text-base">{user?.full_name || 'Developer'}</h4>
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-purple-600/12 border border-purple-500/22 text-purple-400 text-[10px] font-bold uppercase tracking-wider">
              {planLabel}
            </span>
            <p className="text-[11px] text-gray-500 pt-1">{user?.email}</p>
          </div>

          {/* Stats */}
          <div className="w-full grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.05]">
            {[
              { label: 'API Keys',    value: [geminiKey, openaiKey, claudeKey].filter(Boolean).length },
              { label: 'Role',        value: planLabel },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl bg-white/[0.03] border border-white/[0.04] px-3 py-2.5 text-center">
                <span className="text-base font-black text-white block">{value}</span>
                <span className="text-[9px] text-gray-500 uppercase tracking-wider">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right Column ──────────────────────────────────────── */}
        <div className="md:col-span-2 flex flex-col gap-5">
          {/* API Keys */}
          <SectionCard icon={Key} title="Model Credentials">
            <form onSubmit={handleSaveKeys} className="flex flex-col gap-4">
              <ApiKeyInput
                label="Google Gemini API Key"
                placeholder="AIzaSy..."
                value={geminiKey}
                onChange={setGeminiKey}
              />
              <ApiKeyInput
                label="OpenAI API Key"
                placeholder="sk-proj-..."
                value={openaiKey}
                onChange={setOpenaiKey}
              />
              <ApiKeyInput
                label="Anthropic Claude API Key"
                placeholder="sk-ant-..."
                value={claudeKey}
                onChange={setClaudeKey}
              />

              <div className="pt-1 flex items-center gap-3">
                <div className="flex-1 flex items-center gap-2 text-[10px] text-gray-600">
                  <Shield className="h-3 w-3" />
                  Keys are stored in your browser's local storage only.
                </div>
                <button
                  type="submit"
                  disabled={savingKeys}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold btn-premium-gradient text-white cursor-pointer disabled:opacity-60"
                >
                  {savingKeys ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  {savingKeys ? 'Saving…' : 'Save Keys'}
                </button>
              </div>
            </form>
          </SectionCard>

          {/* Editor Preferences */}
          <SectionCard icon={Palette} title="Workspace Preferences">
            <form onSubmit={handleSavePref} className="flex flex-col gap-5">
              <div className="grid sm:grid-cols-3 gap-4">
                {/* Theme */}
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Editor Theme</label>
                  <div className="flex gap-2">
                    {[
                      { val: 'vs-dark',  label: 'Dark',  icon: Moon },
                      { val: 'light',    label: 'Light', icon: Sun },
                    ].map(({ val, label, icon: Icon }) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setEditorTheme(val)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                          editorTheme === val
                            ? 'bg-purple-600/15 border-purple-500/35 text-purple-300'
                            : 'bg-white/[0.03] border-white/[0.06] text-gray-400 hover:text-gray-200 hover:bg-white/[0.06]'
                        }`}
                      >
                        <Icon className="h-3 w-3" /> {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Size */}
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Font Size</label>
                  <div className="relative">
                    <Type className="absolute left-2.5 top-2.5 h-3 w-3 text-gray-500" />
                    <select
                      value={fontSize}
                      onChange={(e) => setFontSize(e.target.value)}
                      className="w-full input-premium rounded-xl pl-8 pr-3 py-2.5 text-xs text-gray-200 appearance-none cursor-pointer"
                    >
                      {['11','12','13','14','15','16'].map(s => (
                        <option key={s} value={s} className="bg-[#12101c]">{s}px</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Tab Size */}
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Tab Width</label>
                  <div className="relative">
                    <Monitor className="absolute left-2.5 top-2.5 h-3 w-3 text-gray-500" />
                    <select
                      value={tabSize}
                      onChange={(e) => setTabSize(e.target.value)}
                      className="w-full input-premium rounded-xl pl-8 pr-3 py-2.5 text-xs text-gray-200 appearance-none cursor-pointer"
                    >
                      {['2','4'].map(s => (
                        <option key={s} value={s} className="bg-[#12101c]">{s} spaces</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-col gap-3 pt-1 border-t border-white/[0.05]">
                {[
                  { label: 'Show Minimap',      desc: 'Display the code minimap sidebar in the editor',    val: minimap,  set: setMinimap  },
                  { label: 'Word Wrap',          desc: 'Wrap long lines in the editor instead of scrolling', val: wordWrap, set: setWordWrap },
                ].map(({ label, desc, val, set }) => (
                  <div key={label} className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-200">{label}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => set((v: boolean) => !v)}
                      className={`relative h-5 w-9 rounded-full transition-all cursor-pointer shrink-0 ${val ? 'bg-purple-600' : 'bg-white/[0.1]'}`}
                    >
                      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${val ? 'left-[18px]' : 'left-0.5'}`} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={savingPref}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold btn-premium-gradient text-white cursor-pointer disabled:opacity-60"
                >
                  {savingPref ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  {savingPref ? 'Saving…' : 'Save Preferences'}
                </button>
              </div>
            </form>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
