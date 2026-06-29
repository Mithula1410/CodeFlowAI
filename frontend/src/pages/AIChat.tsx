import React, { useState, useEffect, useRef } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Trash2, Sparkles, Copy, Check, Bot, User as UserIcon, HelpCircle
} from 'lucide-react';

const AIChat: React.FC = () => {
  const { chatHistory, sendWsChatMessage, isTyping, clearChatHistory, addToast } = useNotification();
  const { user } = useAuth();
  
  const [input, setInput] = useState('');
  const [provider, setProvider] = useState('gemini');
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
    // Extract code block content if present
    const codeRegex = /```[\s\S]*?```/g;
    const matches = text.match(codeRegex);
    let copyText = text;
    if (matches && matches.length > 0) {
      copyText = matches.map(m => m.replace(/```[a-zA-Z]*\n?|```/g, '')).join('\n\n');
    }
    navigator.clipboard.writeText(copyText);
    setCopiedId(idx);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const prompts = [
    "Explain how to configure an Alembic script with UUID columns.",
    "Write a TypeScript hook managing debounce autosave limits.",
    "Explain the security vulnerabilities inside SQL string concatenation."
  ];

  // Simple formatter to parse code blocks and text
  const renderMessageContent = (content: string) => {
    const parts = content.split(/(```[a-zA-Z]*\n[\s\S]*?\n```)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        const lines = part.split('\n');
        const language = lines[0].replace('```', '') || 'code';
        const code = lines.slice(1, -1).join('\n');
        
        return (
          <div key={index} className="my-3 border border-white/10 rounded-xl overflow-hidden bg-[#0a0912] shadow-2xl">
            <div className="flex items-center justify-between px-4 py-2 bg-white/[0.03] border-b border-white/5 text-[10px] text-gray-400 font-mono select-none">
              <span>{language}</span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(code);
                  addToast("Copied", "Snippet copied to clipboard", "success");
                }}
                className="hover:text-white transition-colors flex items-center gap-1"
              >
                <Copy className="h-3 w-3" /> Copy
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-[11px] font-mono text-purple-200/90 leading-relaxed">
              <code>{code}</code>
            </pre>
          </div>
        );
      }
      
      return (
        <p key={index} className="whitespace-pre-wrap leading-relaxed">
          {part}
        </p>
      );
    });
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-[#07060f] via-[#090812] to-[#040307] relative overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-purple-600/5 blur-[120px] pointer-events-none" />

      {/* Header bar */}
      <div className="h-16 border-b border-white/5 bg-[#090810]/40 px-6 flex items-center justify-between z-10 select-none">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-purple-600/10 border border-purple-500/25 flex items-center justify-center text-purple-400 shadow-md shadow-purple-500/5">
            <Bot className="h-4.5 w-4.5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-200 uppercase tracking-widest">CodeFlow Assistant</h3>
            <p className="text-[9px] text-gray-500 font-semibold mt-0.5">Streaming AI Console</p>
          </div>
        </div>

        {/* Model/Provider Selector */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Router:</span>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl text-xs text-gray-300 px-3.5 py-2.5 focus:outline-none focus:border-purple-500 cursor-pointer transition-all"
          >
            <option value="gemini" className="bg-[#12101c]">Google Gemini</option>
            <option value="openai" className="bg-[#12101c]">GPT 4o-mini</option>
            <option value="claude" className="bg-[#12101c]">Claude 3.5 Sonnet</option>
            <option value="mock" className="bg-[#12101c]">Mock Service</option>
          </select>
          <button
            onClick={clearChatHistory}
            className="h-9 w-9 rounded-xl border border-white/5 hover:bg-rose-950/10 hover:border-rose-900/30 flex items-center justify-center text-gray-400 hover:text-rose-400 transition-all cursor-pointer"
            title="Clear Chat History"
          >
            <Trash2 className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 scrollbar-thin">
        <AnimatePresence initial={false}>
          {chatHistory.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-xl mx-auto text-center py-20 flex flex-col items-center gap-4"
            >
              <div className="h-16 w-16 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-2 shadow-lg shadow-purple-500/5">
                <Sparkles className="h-6 w-6 animate-pulse" />
              </div>
              <h4 className="font-bold text-gray-200 text-base">How can I support your codebase today?</h4>
              <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
                Ask about structural design configurations, dependency mapping, SQL injections, or Monaco editor shortcuts.
              </p>
              
              <div className="grid gap-2.5 w-full mt-6">
                {prompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInput(p)}
                    className="p-4 text-left border border-white/5 bg-white/[0.01] hover:bg-purple-950/5 rounded-2xl text-xs text-gray-300 hover:text-white hover:border-purple-500/20 transition-all cursor-pointer shadow-sm hover:scale-[1.01]"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            chatHistory.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', damping: 20 }}
                  className={`flex gap-4 max-w-3xl w-full mx-auto ${isUser ? 'flex-row-reverse' : ''}`}
                >
                  {/* Avatar */}
                  <div className={`h-9 w-9 rounded-xl border flex items-center justify-center shrink-0 text-xs font-semibold ${
                    isUser 
                      ? 'bg-purple-500/15 border-purple-500/30 text-purple-300 shadow-lg shadow-purple-500/5' 
                      : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'
                  }`}>
                    {isUser ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>

                  {/* Speech bubble */}
                  <div className={`flex-1 p-5 rounded-2xl border ${
                    isUser 
                      ? 'bg-purple-900/15 border-purple-500/20 text-gray-200 shadow-md shadow-purple-500/5' 
                      : 'bg-[#090810]/40 backdrop-blur-md border-white/5 text-gray-300'
                  }`}>
                    <div className="text-xs leading-relaxed font-normal font-sans">
                      {renderMessageContent(msg.content)}
                    </div>
                    {!isUser && (
                      <button
                        onClick={() => handleCopyCode(msg.content, idx)}
                        className="flex items-center gap-1.5 text-[10px] text-gray-400 hover:text-white mt-4 border border-white/5 bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg transition-all cursor-pointer font-semibold"
                      >
                        {copiedId === idx ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        {copiedId === idx ? "Copied" : "Copy response"}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>

        {/* Typing indicator bubble */}
        {isTyping && (
          <div className="flex gap-4 max-w-3xl w-full mx-auto animate-pulse">
            <div className="h-9 w-9 rounded-xl border bg-indigo-500/10 border-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4" />
            </div>
            <div className="p-4 rounded-2xl border border-white/5 bg-[#090810]/40 backdrop-blur-md flex items-center gap-1 text-gray-400">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Message Form */}
      <div className="p-5 border-t border-white/5 bg-[#090810]/40 backdrop-blur-md z-10 select-none">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto flex gap-3 relative">
          <input
            type="text"
            required
            placeholder="Ask AI assistant about APIs, database migrations, or code smells..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl pl-5 pr-14 py-3.5 text-xs text-gray-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 transition-all placeholder:text-gray-500"
          />
          <button
            type="submit"
            className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white hover:brightness-110 flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-lg shadow-purple-500/20"
          >
            <Send className="h-4.5 w-4.5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIChat;
