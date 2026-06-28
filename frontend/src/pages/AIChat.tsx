import React, { useState, useEffect, useRef } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Send, 
  Trash2, 
  Sparkles, 
  Copy, 
  Cpu, 
  Check, 
  Mic, 
  Bot,
  User as UserIcon
} from 'lucide-react';

const AIChat: React.FC = () => {
  const { chatHistory, sendWsChatMessage, isTyping, clearChatHistory } = useNotification();
  const { user } = useAuth();
  
  const [input, setInput] = useState('');
  const [provider, setProvider] = useState('mock');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isTyping]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMsg = { role: 'user' as const, content: input };
    const historyPayload = [...chatHistory, newMsg];
    
    sendWsChatMessage(historyPayload, provider);
    setInput('');
  };

  const handleCopyCode = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(idx);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const prompts = [
    "Explain how to configure an Alembic script with UUID columns.",
    "Write a TypeScript hook managing debounce autosave limits.",
    "Explain the security vulnerabilities inside SQL string concatenation."
  ];

  return (
    <div className="h-full flex flex-col bg-[#0b0a14]">
      {/* Header bar */}
      <div className="h-14 border-b border-border bg-black/20 px-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-purple-400" />
          <h3 className="text-xs font-bold text-gray-200 uppercase tracking-widest">AI Architecture Assistant</h3>
        </div>

        {/* Model/Provider Selector */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400">Router:</span>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="bg-white/5 border border-border rounded-lg text-xs text-gray-300 px-3 py-1.5 focus:outline-none focus:border-purple-500 cursor-pointer"
          >
            <option value="mock" className="bg-[#12101c]">Mock Service</option>
            <option value="gemini" className="bg-[#12101c]">Google Gemini</option>
            <option value="openai" className="bg-[#12101c]">GPT 4o-mini</option>
            <option value="claude" className="bg-[#12101c]">Claude 3.5 Sonnet</option>
          </select>
          <button
            onClick={clearChatHistory}
            className="h-8 w-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-gray-400 hover:text-gray-200 transition-all cursor-pointer"
            title="Clear Chat History"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        {chatHistory.length === 0 && (
          <div className="max-w-xl mx-auto text-center py-16 flex flex-col items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-2">
              <Sparkles className="h-6 w-6" />
            </div>
            <h4 className="font-bold text-gray-200">How can I support your codebase today?</h4>
            <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
              Ask about structural design configurations, dependency mapping, SQL injections, or Monaco editor shortcuts.
            </p>
            
            <div className="grid gap-2.5 w-full mt-6">
              {prompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(p)}
                  className="p-3 text-left border border-border glass-panel rounded-xl text-xs text-gray-300 hover:text-white hover:border-purple-500/30 hover:bg-purple-950/10 transition-all cursor-pointer"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {chatHistory.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={idx}
              className={`flex gap-4 max-w-3xl w-full mx-auto ${isUser ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div className={`h-8 w-8 rounded-xl border flex items-center justify-center shrink-0 text-xs font-semibold ${
                isUser 
                  ? 'bg-purple-500/15 border-purple-500/30 text-purple-300' 
                  : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'
              }`}>
                {isUser ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              {/* Speech bubble */}
              <div className={`flex-1 p-4 rounded-2xl border ${
                isUser 
                  ? 'bg-purple-900/10 border-purple-500/15 text-gray-200' 
                  : 'glass-panel text-gray-300'
              }`}>
                <div className="text-xs leading-relaxed font-normal whitespace-pre-wrap font-sans">
                  {msg.content}
                </div>
                {!isUser && msg.content.includes("```") && (
                  <button
                    onClick={() => handleCopyCode(msg.content, idx)}
                    className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-white mt-3 cursor-pointer"
                  >
                    {copiedId === idx ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    {copiedId === idx ? "Copied" : "Copy Code block"}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing indicator bubble */}
        {isTyping && (
          <div className="flex gap-4 max-w-3xl w-full mx-auto">
            <div className="h-8 w-8 rounded-xl border bg-indigo-500/10 border-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4" />
            </div>
            <div className="p-4 rounded-2xl border glass-panel flex items-center gap-1 text-gray-400">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Message Form */}
      <div className="p-4 border-t border-border bg-black/20 z-10">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto flex gap-3 relative">
          <input
            type="text"
            required
            placeholder="Type your design prompt instructions here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-white/5 border border-border rounded-xl pl-4 pr-12 py-3 text-sm text-gray-200 focus:outline-none focus:border-purple-500"
          />
          <button
            type="button"
            className="absolute right-14 top-2.5 h-8 w-8 rounded-lg hover:bg-white/5 text-gray-400 flex items-center justify-center cursor-pointer"
            title="Speech recognition (Placeholder)"
          >
            <Mic className="h-4 w-4" />
          </button>
          <button
            type="submit"
            className="h-10 w-10 rounded-xl bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-md shadow-purple-500/15"
          >
            <Send className="h-4.5 w-4.5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIChat;
