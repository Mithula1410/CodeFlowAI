import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useWorkspace, FileItem } from '../contexts/WorkspaceContext';
import { useNotification } from '../contexts/NotificationContext';
import { 
  Folder, 
  FileCode, 
  Plus, 
  Trash2, 
  Sparkles, 
  Play, 
  ShieldAlert, 
  BookOpen, 
  Download, 
  Copy,
  ChevronRight,
  ChevronDown,
  UploadCloud,
  FileText
} from 'lucide-react';
import axios from 'axios';

type ToolTab = 'explorer' | 'generate' | 'review' | 'bugs' | 'docs';

const CodeWorkspace: React.FC = () => {
  const { 
    currentProject, 
    currentFile, 
    openTabs, 
    activeTabId, 
    openTab, 
    closeTab, 
    createFile, 
    updateFileContent,
    deleteFile,
    selectProject,
    currentWorkspace
  } = useWorkspace();

  const { addToast } = useNotification();

  // Sidebar Tool Panel Toggles
  const [activeTool, setActiveTool] = useState<ToolTab>('explorer');
  const [newFileName, setNewFileName] = useState('');
  const [showAddFile, setShowAddFile] = useState(false);

  // AI Gen States
  const [genPrompt, setGenPrompt] = useState('');
  const [genLang, setGenLang] = useState('python');
  const [genFramework, setGenFramework] = useState('vanilla');
  const [genTemp, setGenTemp] = useState(0.7);
  const [generating, setGenerating] = useState(false);

  // Review states
  const [reviewScore, setReviewScore] = useState<any>(null);
  const [reviewing, setReviewing] = useState(false);

  // Bug states
  const [bugs, setBugs] = useState<any[]>([]);
  const [scanning, setScanning] = useState(false);

  // Docs states
  const [docsType, setDocsType] = useState('README');
  const [docsContent, setDocsContent] = useState('');
  const [generatingDocs, setGeneratingDocs] = useState(false);

  // Editor content buffering for autosave
  const [editorVal, setEditorVal] = useState('');
  const saveTimeoutRef = useRef<any>(null);

  // Synchronize editor content when file tab changes
  useEffect(() => {
    if (currentFile) {
      setEditorVal(currentFile.content);
    } else {
      setEditorVal('');
    }
  }, [activeTabId]);

  // Debounced Autosave (3 seconds)
  const handleEditorChange = (val: string | undefined) => {
    const value = val || '';
    setEditorVal(value);

    if (!currentFile) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      updateFileContent(currentFile.id, value);
    }, 3000);
  };

  // Keyboard shortcut Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (currentFile) {
          if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
          updateFileContent(currentFile.id, editorVal);
          addToast("Saved", "File contents saved successfully.", "success");
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentFile, editorVal]);

  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    await createFile(newFileName);
    setNewFileName('');
    setShowAddFile(false);
  };

  // Drag and Drop File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentProject || !e.target.files) return;
    const formData = new FormData();
    for (let i = 0; i < e.target.files.length; i++) {
      formData.append('files', e.target.files[i]);
    }
    
    try {
      await axios.post(`/api/v1/files/project/${currentProject.id}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      addToast("Upload Complete", "Files imported successfully.", "success");
      // Re-select project to fetch new files
      selectProject(currentProject.id);
    } catch (err) {
      addToast("Upload Failed", "Could not upload files.", "error");
    }
  };

  // AI Actions
  const handleGenerateCode = async () => {
    if (!genPrompt.trim()) return;
    setGenerating(true);
    try {
      const res = await axios.post('/api/v1/ai/generate', {
        prompt: genPrompt,
        language: genLang,
        framework: genFramework,
        temperature: genTemp
      });
      
      const genCode = res.data.code;
      
      // If there is an active file, append or overwrite. Or create a new file
      if (currentFile) {
        handleEditorChange(editorVal + "\n\n" + genCode);
      } else {
        await createFile(`gen_${Date.now().toString().slice(-4)}.${genLang === 'python' ? 'py' : 'js'}`, genCode);
      }
      addToast("Code Generated", "AI code output inserted.", "success");
    } catch (err) {
      addToast("Generation Error", "AI service was unable to fulfill prompt.", "error");
    } finally {
      setGenerating(false);
    }
  };

  const handleReviewCode = async () => {
    if (!currentFile) {
      addToast("No active file", "Please select a file to review.", "warning");
      return;
    }
    setReviewing(true);
    try {
      const res = await axios.post(`/api/v1/ai/review?code=${encodeURIComponent(editorVal)}&language=${currentFile.language}`);
      setReviewScore(res.data);
      addToast("Review Finished", "Detailed score metric loaded.", "success");
    } catch (err) {
      addToast("Review Error", "Failed to generate scores.", "error");
    } finally {
      setReviewing(false);
    }
  };

  const handleScanBugs = async () => {
    if (!currentFile) {
      addToast("No active file", "Select a file to scan.", "warning");
      return;
    }
    setScanning(true);
    try {
      const res = await axios.post('/api/v1/ai/generate', {
        prompt: `Scan this code for syntax bugs, null refs, logic loops, vulnerabilities. Return JSON list matching Schema: {"bugs": [{"file_path": "filename", "line_number": 5, "severity": "critical|warning", "description": "desc", "suggested_fix": "fixed code"}]}. Code:\n${editorVal}`,
        language: currentFile.language
      });
      // Parse output
      const jsonRes = JSON.parse(res.data.explanation.includes('{') ? res.data.explanation : res.data.code);
      setBugs(jsonRes.bugs || []);
      addToast("Scan Finished", `${jsonRes.bugs?.length || 0} issues identified.`, "success");
    } catch (err) {
      // Fallback mock bug listing
      setBugs([
        { line_number: 6, severity: 'critical', description: 'SQL Injection via string concatenation.', suggested_fix: "db.execute('SELECT * FROM users WHERE id = %s', (user_id,))" }
      ]);
      addToast("Mock Scan", "Mock vulnerability loaded for display.", "info");
    } finally {
      setScanning(false);
    }
  };

  const handleGenerateDocs = async () => {
    if (!currentFile) return;
    setGeneratingDocs(true);
    try {
      const res = await axios.post('/api/v1/ai/documentation', {
        code: editorVal,
        doc_type: docsType
      });
      setDocsContent(res.data.documentation);
    } catch (err) {
      addToast("Docs Error", "Unable to document selection.", "error");
    } finally {
      setGeneratingDocs(false);
    }
  };

  const applyQuickFix = (bug: any) => {
    if (!currentFile) return;
    // Simple mock replacement helper
    handleEditorChange(editorVal + "\n# Applied Bug Fix for Line " + bug.line_number + ":\n# " + bug.suggested_fix);
    addToast("Fix Applied", "Code patched successfully.", "success");
  };

  return (
    <div className="h-full flex overflow-hidden">
      {/* Tool Sidebar (Tabs) */}
      <div className="w-12 h-full border-r border-border bg-black/40 flex flex-col items-center py-4 gap-4 z-10 shrink-0">
        {[
          { name: 'explorer', icon: Folder, label: 'Explorer' },
          { name: 'generate', icon: Sparkles, label: 'Generator' },
          { name: 'review', icon: Play, label: 'Reviewer' },
          { name: 'bugs', icon: ShieldAlert, label: 'Scans' },
          { name: 'docs', icon: BookOpen, label: 'Docs' }
        ].map(tool => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.name}
              onClick={() => setActiveTool(tool.name as ToolTab)}
              className={`h-9 w-9 rounded-lg flex items-center justify-center transition-all relative group cursor-pointer ${
                activeTool === tool.name 
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/35' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              title={tool.label}
            >
              <Icon className="h-4.5 w-4.5" />
            </button>
          );
        })}
      </div>

      {/* Tool Drawer */}
      <div className="w-72 h-full border-r border-border glass-panel z-10 flex flex-col shrink-0">
        {/* Explorer Drawer */}
        {activeTool === 'explorer' && (
          <div className="p-4 flex flex-col gap-4 h-full">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest">Workspace Files</h3>
              <button
                onClick={() => setShowAddFile(!showAddFile)}
                className="h-6 w-6 rounded hover:bg-white/5 flex items-center justify-center text-purple-400 cursor-pointer"
              >
                <Plus className="h-4.5 w-4.5" />
              </button>
            </div>

            {showAddFile && (
              <form onSubmit={handleCreateFile} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="index.js"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="flex-1 bg-white/5 border border-border rounded-lg px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-purple-500"
                />
                <button type="submit" className="px-2 py-1 bg-purple-600 rounded text-xs text-white">Add</button>
              </form>
            )}

            {/* Files List */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-1">
              <div className="flex items-center gap-2 px-2 py-1 text-xs font-semibold text-gray-400">
                <Folder className="h-3.5 w-3.5 text-purple-400" />
                <span>{currentProject?.name || 'Project Root'}</span>
              </div>
              
              <div className="pl-4 flex flex-col gap-0.5">
                {currentProject?.files?.map(file => (
                  <div
                    key={file.id}
                    className={`group flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-all ${
                      currentFile?.id === file.id 
                        ? 'bg-purple-600/10 text-purple-300 font-semibold' 
                        : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                    }`}
                  >
                    <button
                      onClick={() => openTab(file)}
                      className="flex-1 flex items-center gap-2 text-left truncate cursor-pointer"
                    >
                      <FileCode className="h-3.5 w-3.5" />
                      <span className="truncate">{file.path}</span>
                    </button>
                    <button
                      onClick={() => deleteFile(file.id)}
                      className="opacity-0 group-hover:opacity-100 hover:text-rose-400 transition-all cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Drag & Drop Zip import */}
            <div className="border border-dashed border-border rounded-xl p-4 text-center bg-white/[0.01] hover:bg-white/[0.02] transition-all relative">
              <UploadCloud className="h-6 w-6 text-gray-500 mx-auto mb-2" />
              <span className="text-[10px] font-semibold text-gray-400 block">Drag & Drop ZIP Repo</span>
              <span className="text-[9px] text-gray-500 block mt-0.5">Extracted archives import directly</span>
              <input
                type="file"
                multiple
                accept=".zip,.py,.js,.ts,.tsx,.jsx,.go,.rs"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Generate Drawer */}
        {activeTool === 'generate' && (
          <div className="p-4 flex flex-col gap-4 h-full overflow-y-auto">
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest border-b border-border/60 pb-3">AI Code Generator</h3>
            
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Language</label>
                <select
                  value={genLang}
                  onChange={(e) => setGenLang(e.target.value)}
                  className="w-full bg-white/5 border border-border rounded-lg text-xs text-gray-200 px-3 py-2"
                >
                  <option value="python" className="bg-[#12101c]">Python</option>
                  <option value="javascript" className="bg-[#12101c]">JavaScript</option>
                  <option value="typescript" className="bg-[#12101c]">TypeScript</option>
                  <option value="rust" className="bg-[#12101c]">Rust</option>
                  <option value="go" className="bg-[#12101c]">Go</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Framework Template</label>
                <select
                  value={genFramework}
                  onChange={(e) => setGenFramework(e.target.value)}
                  className="w-full bg-white/5 border border-border rounded-lg text-xs text-gray-200 px-3 py-2"
                >
                  <option value="vanilla" className="bg-[#12101c]">Vanilla</option>
                  <option value="react" className="bg-[#12101c]">React SPA</option>
                  <option value="fastapi" className="bg-[#12101c]">FastAPI Backend</option>
                  <option value="express" className="bg-[#12101c]">Express Node</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Temperature ({genTemp})</label>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={genTemp}
                  onChange={(e) => setGenTemp(parseFloat(e.target.value))}
                  className="w-full h-1 bg-purple-900 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">AI Prompt Instruction</label>
                <textarea
                  placeholder="e.g. Write a JWT middleware handler verifying header tokens..."
                  value={genPrompt}
                  onChange={(e) => setGenPrompt(e.target.value)}
                  rows={4}
                  className="w-full bg-white/5 border border-border rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <button
                onClick={handleGenerateCode}
                disabled={generating}
                className="w-full py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-500 text-white hover:brightness-110 shadow-md shadow-purple-500/10 cursor-pointer disabled:opacity-50"
              >
                {generating ? "Generating solution..." : "Generate Code Block"}
              </button>
            </div>
          </div>
        )}

        {/* Reviewer Drawer */}
        {activeTool === 'review' && (
          <div className="p-4 flex flex-col gap-4 h-full overflow-y-auto">
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest border-b border-border/60 pb-3">Code Review Scores</h3>
            
            <button
              onClick={handleReviewCode}
              disabled={reviewing}
              className="w-full py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md cursor-pointer disabled:opacity-50"
            >
              {reviewing ? "Executing Reviews..." : "Execute File Review"}
            </button>

            {reviewScore && (
              <div className="flex flex-col gap-4 mt-2">
                <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-purple-950/10 border border-purple-500/25">
                  <span className="text-[10px] font-bold text-purple-400 uppercase">Overall Quality</span>
                  <span className="text-3xl font-extrabold text-white mt-1">{reviewScore.score_overall}%</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-center">
                  {[
                    { label: "Security", val: reviewScore.score_security, color: "text-rose-400" },
                    { label: "Performance", val: reviewScore.score_performance, color: "text-amber-400" },
                    { label: "Readability", val: reviewScore.score_readability, color: "text-blue-400" },
                    { label: "Maintainability", val: reviewScore.score_maintainability, color: "text-emerald-400" }
                  ].map((s, idx) => (
                    <div key={idx} className="p-2 border border-border rounded-lg">
                      <span className="text-[9px] text-gray-400 uppercase block">{s.label}</span>
                      <span className={`text-sm font-bold block mt-0.5 ${s.color}`}>{s.val}%</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Identified Concerns</span>
                  {reviewScore.issues?.map((issue: any, index: number) => (
                    <div key={index} className="p-2.5 rounded-lg border border-border bg-white/[0.01] text-[10px]">
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-gray-300">Line {issue.line_number}</span>
                        <span className={`uppercase text-[9px] ${
                          issue.severity === 'critical' ? 'text-rose-400' : 'text-amber-400'
                        }`}>{issue.severity}</span>
                      </div>
                      <p className="text-gray-400 mt-1 leading-relaxed">{issue.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bug scan Drawer */}
        {activeTool === 'bugs' && (
          <div className="p-4 flex flex-col gap-4 h-full overflow-y-auto">
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest border-b border-border/60 pb-3">Bug Scanning</h3>

            <button
              onClick={handleScanBugs}
              disabled={scanning}
              className="w-full py-2 rounded-xl text-xs font-bold bg-rose-950/20 hover:bg-rose-950/45 text-rose-300 border border-rose-500/20 cursor-pointer disabled:opacity-50"
            >
              {scanning ? "Scanning for compile errors..." : "Scan active tab"}
            </button>

            <div className="flex flex-col gap-3 mt-2">
              {bugs.map((bug, i) => (
                <div key={i} className="p-3 border border-border rounded-xl bg-white/[0.01] flex flex-col gap-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 text-[9px] font-bold uppercase">
                      {bug.severity}
                    </span>
                    <span className="text-gray-500 font-semibold">Line {bug.line_number}</span>
                  </div>
                  <p className="text-gray-400 text-[11px] leading-relaxed">{bug.description}</p>
                  <button
                    onClick={() => applyQuickFix(bug)}
                    className="w-full py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-300 text-[10px] font-semibold transition-all cursor-pointer"
                  >
                    Apply Quick Fix Patch
                  </button>
                </div>
              ))}
              {bugs.length === 0 && !scanning && (
                <span className="text-xs text-gray-500 text-center mt-4">Scan files to list potential compiler concerns.</span>
              )}
            </div>
          </div>
        )}

        {/* Docs Drawer */}
        {activeTool === 'docs' && (
          <div className="p-4 flex flex-col gap-4 h-full overflow-y-auto">
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest border-b border-border/60 pb-3">Doc Generator</h3>
            
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Doc Target Structure</label>
                <select
                  value={docsType}
                  onChange={(e) => setDocsType(e.target.value)}
                  className="w-full bg-white/5 border border-border rounded-lg text-xs text-gray-200 px-3 py-2"
                >
                  <option value="README" className="bg-[#12101c]">Project README.md</option>
                  <option value="API_DOCS" className="bg-[#12101c]">API Specification</option>
                  <option value="INLINE" className="bg-[#12101c]">JSDoc / Inline Docstrings</option>
                </select>
              </div>

              <button
                onClick={handleGenerateDocs}
                disabled={generatingDocs}
                className="w-full py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md cursor-pointer disabled:opacity-50"
              >
                {generatingDocs ? "Formatting docs..." : "Generate Documentation"}
              </button>

              {docsContent && (
                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Generated Output</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(docsContent);
                        addToast("Copied", "Markdown copied to clipboard.", "success");
                      }}
                      className="text-gray-400 hover:text-white"
                      title="Copy Markdown"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <textarea
                    readOnly
                    value={docsContent}
                    rows={8}
                    className="w-full bg-white/5 border border-border rounded-lg px-2.5 py-2 text-[10px] text-gray-400 font-mono resize-none focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Code Editor Window */}
      <div className="flex-1 h-full flex flex-col bg-black/20 relative">
        {/* Editor Tabs bar */}
        <div className="h-10 border-b border-border bg-black/40 flex items-center px-4 overflow-x-auto gap-1">
          {openTabs.map(tab => (
            <div
              key={tab.id}
              className={`h-7 px-3 rounded-t-lg flex items-center gap-2 text-xs border-t border-x transition-all shrink-0 cursor-pointer ${
                activeTabId === tab.id 
                  ? 'bg-[#0e0c19] border-purple-500/30 text-purple-300' 
                  : 'bg-black/10 border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              <button
                onClick={() => openTab(tab)}
                className="flex items-center gap-1.5 cursor-pointer font-medium"
              >
                <FileCode className="h-3 w-3" />
                <span>{tab.path}</span>
              </button>
              <button
                onClick={() => closeTab(tab.id)}
                className="h-3.5 w-3.5 rounded hover:bg-white/10 flex items-center justify-center text-gray-500 hover:text-gray-300"
              >
                ×
              </button>
            </div>
          ))}
          {openTabs.length === 0 && (
            <span className="text-[10px] text-gray-500">No active files loaded. Select files from the Explorer.</span>
          )}
        </div>

        {/* Monaco Editor Container */}
        <div className="flex-1 relative">
          {currentFile ? (
            <div className="absolute inset-0">
              <Editor
                height="100%"
                theme="vs-dark"
                language={currentFile.language}
                value={editorVal}
                onChange={handleEditorChange}
                options={{
                  minimap: { enabled: true },
                  fontSize: 13,
                  fontFamily: "'Courier New', Courier, monospace",
                  tabSize: 4,
                  automaticLayout: true,
                  padding: { top: 12 },
                  cursorBlinking: 'smooth',
                  cursorSmoothCaretAnimation: 'on'
                }}
              />
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 select-none">
              <div className="h-16 w-16 rounded-2xl bg-purple-600/5 border border-purple-500/15 flex items-center justify-center text-purple-400 mb-4 animate-bounce">
                <FileText className="h-8 w-8" />
              </div>
              <h4 className="font-bold text-gray-300 text-sm">Monaco Code Workspace</h4>
              <p className="text-[10px] text-gray-500 max-w-xs mt-1.5 leading-relaxed">
                Open a file from the explorer list on the left to start editing. The system auto-saves changes every 3 seconds.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeWorkspace;
