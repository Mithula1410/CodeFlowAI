import React, { useState, useEffect, useRef, useMemo } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkspace, FileItem } from '../contexts/WorkspaceContext';
import { useNotification } from '../contexts/NotificationContext';
import { 
  Folder, FileCode, Plus, Trash2, Sparkles, Play, ShieldAlert, 
  BookOpen, Copy, ChevronRight, ChevronDown, UploadCloud, FileText,
  AlertTriangle, Check, RefreshCw, Layers, Search, PanelLeftClose, PanelLeft,
  Maximize2, Minimize2, Save, Compass
} from 'lucide-react';
import axios from 'axios';

type ToolTab = 'explorer' | 'generate' | 'review' | 'bugs' | 'docs';

interface FileNode {
  name: string;
  path: string;
  isFolder: boolean;
  children: FileNode[];
  fileItem?: FileItem;
}

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
    selectProject
  } = useWorkspace();

  const { addToast } = useNotification();

  // Layout states
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [explorerWidth, setExplorerWidth] = useState(260);
  const [aiPanelWidth, setAiPanelWidth] = useState(360);
  const [aiPanelOpen, setAiPanelOpen] = useState(true);
  const [activeTool, setActiveTool] = useState<ToolTab>('review');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Splitter drag states
  const isDraggingLeft = useRef(false);
  const isDraggingRight = useRef(false);

  // File explorer states
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({ 'root': true });
  const [newFileName, setNewFileName] = useState('');
  const [showAddFile, setShowAddFile] = useState(false);

  // Monaco editor reference
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const [cursorPos, setCursorPos] = useState({ line: 1, column: 1 });

  // AI Review states
  const [reviewScore, setReviewScore] = useState<any>(null);
  const [reviewing, setReviewing] = useState(false);
  const [reviewStep, setReviewStep] = useState<string>('');
  const [reviewProvider, setReviewProvider] = useState('gemini');
  const [reviewLang, setReviewLang] = useState('python');

  // AI Gen States
  const [genPrompt, setGenPrompt] = useState('');
  const [genLang, setGenLang] = useState('python');
  const [genFramework, setGenFramework] = useState('vanilla');
  const [genTemp, setGenTemp] = useState(0.7);
  const [generating, setGenerating] = useState(false);
  const [streamingOutput, setStreamingOutput] = useState('');

  // Bug states
  const [bugs, setBugs] = useState<any[]>([]);
  const [scanning, setScanning] = useState(false);

  // Docs states
  const [docsType, setDocsType] = useState('README');
  const [docsContent, setDocsContent] = useState('');
  const [generatingDocs, setGeneratingDocs] = useState(false);

  // Editor content buffering
  const [editorVal, setEditorVal] = useState('');
  const saveTimeoutRef = useRef<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Local preferences
  const localTheme = localStorage.getItem('cf_editor_theme') || 'vs-dark';
  const localFontSize = parseInt(localStorage.getItem('cf_font_size') || '13', 10);
  const localTabSize = parseInt(localStorage.getItem('cf_tab_size') || '4', 10);
  const localMinimap = localStorage.getItem('cf_minimap') !== 'false';
  const localWordWrap = localStorage.getItem('cf_wordwrap') === 'true';

  // Load splitter preferences
  useEffect(() => {
    const savedLeft = localStorage.getItem('cf_split_left');
    const savedRight = localStorage.getItem('cf_split_right');
    if (savedLeft) setExplorerWidth(parseInt(savedLeft, 10));
    if (savedRight) setAiPanelWidth(parseInt(savedRight, 10));
  }, []);

  useEffect(() => {
    if (currentFile) {
      setEditorVal(currentFile.content);
    } else {
      setEditorVal('');
    }
  }, [activeTabId, currentFile]);

  // Handle auto-save
  const handleEditorChange = (val: string | undefined) => {
    const value = val || '';
    setEditorVal(value);
    if (!currentFile) return;

    setIsSaving(true);
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      await updateFileContent(currentFile.id, value);
      setIsSaving(false);
    }, 2000);
  };

  // Draggable splitter events
  const startDragLeft = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingLeft.current = true;
    document.addEventListener('mousemove', handleDragLeft);
    document.addEventListener('mouseup', endDragLeft);
  };

  const handleDragLeft = (e: MouseEvent) => {
    if (!isDraggingLeft.current) return;
    const newWidth = Math.max(160, Math.min(450, e.clientX - 56));
    setExplorerWidth(newWidth);
  };

  const endDragLeft = () => {
    isDraggingLeft.current = false;
    localStorage.setItem('cf_split_left', explorerWidth.toString());
    document.removeEventListener('mousemove', handleDragLeft);
    document.removeEventListener('mouseup', endDragLeft);
  };

  const startDragRight = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRight.current = true;
    document.addEventListener('mousemove', handleDragRight);
    document.addEventListener('mouseup', endDragRight);
  };

  const handleDragRight = (e: MouseEvent) => {
    if (!isDraggingRight.current) return;
    const newWidth = Math.max(260, Math.min(600, window.innerWidth - e.clientX));
    setAiPanelWidth(newWidth);
  };

  const endDragRight = () => {
    isDraggingRight.current = false;
    localStorage.setItem('cf_split_right', aiPanelWidth.toString());
    document.removeEventListener('mousemove', handleDragRight);
    document.removeEventListener('mouseup', endDragRight);
  };

  // Build hierarchical folder tree from flat files list
  const fileTree = useMemo(() => {
    const root: FileNode = { name: 'root', path: '', isFolder: true, children: [] };
    if (!currentProject || !currentProject.files) return root;

    currentProject.files.forEach(file => {
      if (searchQuery && !file.path.toLowerCase().includes(searchQuery.toLowerCase())) {
        return;
      }
      const parts = file.path.split('/');
      let current = root;

      parts.forEach((part, index) => {
        const isLast = index === parts.length - 1;
        let found = current.children.find(child => child.name === part && child.isFolder === !isLast);

        if (!found) {
          const path = parts.slice(0, index + 1).join('/');
          found = {
            name: part,
            path,
            isFolder: !isLast,
            children: [],
            fileItem: isLast ? file : undefined
          };
          current.children.push(found);
        }
        current = found;
      });
    });

    // Sort folders first, then files alphabetically
    const sortTree = (node: FileNode) => {
      node.children.sort((a, b) => {
        if (a.isFolder && !b.isFolder) return -1;
        if (!a.isFolder && b.isFolder) return 1;
        return a.name.localeCompare(b.name);
      });
      node.children.forEach(sortTree);
    };
    sortTree(root);
    return root;
  }, [currentProject, searchQuery]);

  // Create file handler
  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newFileName.trim();
    if (!trimmed) return;

    const nameRegex = /^[a-zA-Z0-9_\-\./]+\.[a-zA-Z0-9]+$/;
    if (!nameRegex.test(trimmed)) {
      addToast("Invalid Filename", "File name must have an extension (e.g. main.py)", "error");
      return;
    }

    if (!currentProject) return;
    await createFile(trimmed);
    setNewFileName('');
    setShowAddFile(false);
    selectProject(currentProject.id);
  };

  // Monaco editor load callback
  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Set cursor position listener
    editor.onDidChangeCursorPosition((e: any) => {
      setCursorPos({
        line: e.position.lineNumber,
        column: e.position.column
      });
    });
  };

  // Add review line highlights / decorations in Monaco Editor
  const decorateEditorLines = (issues: any[]) => {
    if (!editorRef.current || !monacoRef.current) return;
    const editor = editorRef.current;
    const monaco = monacoRef.current;

    const collections = editor.getModel().getAllDecorations();
    const oldDecorations = collections.map((d: any) => d.id);

    const newDecorations = issues.map((issue: any) => {
      let className = 'bg-blue-500/10 border-l-4 border-blue-500';
      let glyphClassName = 'text-blue-400 cursor-pointer';

      if (issue.severity === 'critical') {
        className = 'bg-rose-500/10 border-l-4 border-rose-500';
        glyphClassName = 'text-rose-400 cursor-pointer';
      } else if (issue.severity === 'warning') {
        className = 'bg-amber-500/10 border-l-4 border-amber-500';
        glyphClassName = 'text-amber-400 cursor-pointer';
      }

      return {
        range: new monaco.Range(issue.line_number, 1, issue.line_number, 1),
        options: {
          isWholeLine: true,
          className: className,
          glyphMarginClassName: glyphClassName,
          hoverMessage: { value: `**[${issue.severity.toUpperCase()}]** ${issue.description}` }
        }
      };
    });

    editor.deltaDecorations(oldDecorations, newDecorations);
  };

  // Execute AI review with scanning stages
  const handleReviewCode = async () => {
    const codeToReview = editorVal.trim();
    if (!codeToReview) {
      addToast("No code to review", "Paste or type code in the editor first.", "warning");
      return;
    }

    setReviewing(true);
    setReviewScore(null);

    const steps = [
      "Reading Source Code...",
      "Parsing Syntax...",
      "Finding Bugs...",
      "Analyzing Security...",
      "Checking Performance...",
      "Generating Suggestions..."
    ];

    for (let i = 0; i < steps.length; i++) {
      setReviewStep(steps[i]);
      await new Promise(resolve => setTimeout(resolve, 600));
    }

    try {
      const res = await axios.post('/api/v1/ai/review', {
        code: codeToReview,
        language: currentFile?.language || reviewLang,
        provider: reviewProvider
      });
      setReviewScore(res.data);
      if (res.data.issues) {
        decorateEditorLines(res.data.issues);
      }
      addToast("Review Complete", `Overall score: ${res.data.score_overall}%`, "success");
    } catch (err: any) {
      const detail = err?.response?.data?.detail || "AI service was unable to complete the review.";
      addToast("Review Error", detail, "error");
    } finally {
      setReviewing(false);
      setReviewStep('');
    }
  };

  // Execute AI generation
  const handleGenerateCode = async () => {
    if (!genPrompt.trim()) return;
    setGenerating(true);
    setStreamingOutput('');
    try {
      const res = await axios.post('/api/v1/ai/generate', {
        prompt: genPrompt,
        language: genLang,
        framework: genFramework,
        temperature: genTemp
      });
      const genCode = res.data.code;
      
      // Simulate typing/streaming effect
      let idx = 0;
      const interval = setInterval(() => {
        setStreamingOutput(prev => prev + genCode.charAt(idx));
        idx++;
        if (idx >= genCode.length) {
          clearInterval(interval);
        }
      }, 10);

      if (currentFile) {
        const updatedContent = editorVal + "\n\n" + genCode;
        handleEditorChange(updatedContent);
        await updateFileContent(currentFile.id, updatedContent);
      } else {
        await createFile(`gen_${Date.now().toString().slice(-4)}.${genLang === 'python' ? 'py' : 'js'}`, genCode);
      }
      addToast("Code Generated", "AI code output inserted.", "success");
    } catch (err: any) {
      const detail = err?.response?.data?.detail || err?.message || "AI service was unable to fulfill prompt.";
      addToast("Generation Error", detail, "error");
    } finally {
      setGenerating(false);
    }
  };

  // AI Bug scan
  const handleScanBugs = async () => {
    const codeToScan = editorVal.trim();
    if (!codeToScan) {
      addToast("No code to scan", "Paste or type code in the editor first.", "warning");
      return;
    }
    setScanning(true);
    try {
      const res = await axios.post('/api/v1/ai/generate', {
        prompt: `Scan this code for syntax bugs, null refs, logic loops, vulnerabilities. Return JSON list matching Schema: {"bugs": [{"file_path": "filename", "line_number": 5, "severity": "critical|warning", "description": "desc", "suggested_fix": "fixed code"}]}. Code:\n${codeToScan}`,
        language: currentFile?.language || reviewLang,
        provider: reviewProvider
      });
      const rawText = res.data.explanation || res.data.code || '';
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonRes = JSON.parse(jsonMatch[0]);
        setBugs(jsonRes.bugs || []);
        addToast("Scan Finished", `${jsonRes.bugs?.length || 0} issues identified.`, "success");
      } else {
        setBugs([]);
        addToast("Scan Complete", "No issues detected in the code.", "success");
      }
    } catch (err: any) {
      const detail = err?.response?.data?.detail || err?.message || "Bug scan failed.";
      addToast("Scan Error", detail, "error");
    } finally {
      setScanning(false);
    }
  };

  // AI Docs generation
  const handleGenerateDocs = async () => {
    if (!editorVal.trim()) return;
    setGeneratingDocs(true);
    try {
      const res = await axios.post('/api/v1/ai/documentation', {
        code: editorVal,
        doc_type: docsType
      });
      setDocsContent(res.data.documentation);
    } catch (err: any) {
      const detail = err?.response?.data?.detail || err?.message || "Unable to document selection.";
      addToast("Docs Error", detail, "error");
    } finally {
      setGeneratingDocs(false);
    }
  };

  // Toggle folders
  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => ({ ...prev, [path]: !prev[path] }));
  };

  // Render tree node recursively
  const renderNode = (node: FileNode, depth = 0) => {
    if (node.name === 'root' && node.children.length === 0) {
      return (
        <div className="p-4 text-center text-[10px] text-gray-500">
          No files matching.
        </div>
      );
    }

    return (
      <div key={node.path || 'root'} className="flex flex-col">
        {node.name !== 'root' && (
          <div
            className={`group flex items-center justify-between px-2 py-1 text-xs rounded-lg cursor-pointer hover:bg-white/5 transition-all select-none ${
              node.fileItem?.id === activeTabId ? 'bg-purple-600/10 text-purple-300 font-medium' : 'text-gray-400'
            }`}
            style={{ paddingLeft: `${depth * 8 + 8}px` }}
            onClick={() => {
              if (node.isFolder) {
                toggleFolder(node.path);
              } else if (node.fileItem) {
                openTab(node.fileItem);
              }
            }}
          >
            <div className="flex items-center gap-1.5 min-w-0 truncate">
              {node.isFolder ? (
                expandedFolders[node.path] ? (
                  <ChevronDown className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                )
              ) : (
                <FileCode className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              )}
              <span className="truncate">{node.name}</span>
            </div>
            {!node.isFolder && node.fileItem && (
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteFile(node.fileItem!.id);
                  }}
                  className="p-1 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        )}

        {(node.name === 'root' || expandedFolders[node.path]) && (
          <div className="flex flex-col">
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`h-screen flex flex-col bg-background overflow-hidden relative text-gray-300 font-sans`}>
      {/* Aurora glowing background orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-purple-600/10 blur-[100px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none animate-pulse-slow" style={{ animationDelay: '2s' }} />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        
        {/* Left Side Navigation Sidebar */}
        <div className="w-14 h-full border-r border-white/5 bg-[#08070d]/60 flex flex-col items-center py-6 gap-5 z-20 shrink-0">
          {[
            { name: 'explorer', icon: Folder, label: 'Explorer' },
            { name: 'review', icon: Play, label: 'Reviewer' },
            { name: 'generate', icon: Sparkles, label: 'Generator' },
            { name: 'bugs', icon: ShieldAlert, label: 'Bug Scan' },
            { name: 'docs', icon: BookOpen, label: 'Docs' }
          ].map(tool => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.name}
                onClick={() => {
                  setActiveTool(tool.name as ToolTab);
                  if (tool.name === 'explorer') {
                    setSidebarOpen(!sidebarOpen);
                  } else {
                    setAiPanelOpen(true);
                  }
                }}
                className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all relative group cursor-pointer ${
                  (tool.name === 'explorer' && sidebarOpen) || (tool.name !== 'explorer' && aiPanelOpen && activeTool === tool.name)
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-lg shadow-purple-500/10' 
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
                }`}
                title={tool.label}
              >
                <Icon className="h-4.5 w-4.5" />
                <span className="absolute left-full ml-2 px-2 py-1 bg-[#12101c] border border-white/[0.08] text-[9px] font-bold text-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none whitespace-nowrap">
                  {tool.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Project Explorer Panel */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.div 
              style={{ width: explorerWidth }}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: explorerWidth, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="h-full border-r border-white/5 bg-[#090810]/40 backdrop-blur-md z-10 flex flex-col shrink-0 relative select-none overflow-hidden"
            >
              <div className="p-4 flex items-center justify-between border-b border-white/5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Project Explorer</span>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setShowAddFile(!showAddFile)} 
                    className="p-1 hover:bg-white/5 rounded text-gray-400 hover:text-white transition-colors"
                    title="New File..."
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Add file mini-panel */}
              <AnimatePresence>
                {showAddFile && (
                  <motion.form 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    onSubmit={handleCreateFile} 
                    className="p-3 border-b border-white/5 flex gap-2 overflow-hidden"
                  >
                    <input
                      type="text"
                      required
                      placeholder="e.g. main.py"
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      className="flex-1 input-premium rounded-lg px-2.5 py-1.5 text-xs text-gray-200"
                    />
                    <button type="submit" className="px-3 py-1.5 btn-premium-gradient text-white rounded-lg text-xs font-bold cursor-pointer">Create</button>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Search files input */}
              <div className="p-3 border-b border-white/5">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-purple-500/50"
                  />
                </div>
              </div>

              {/* Folder Tree Scrollview */}
              <div className="flex-1 overflow-y-auto p-2">
                {renderNode(fileTree)}
              </div>

              {/* Draggable Splitter Handle (Left) */}
              <div 
                onMouseDown={startDragLeft}
                className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-purple-500/30 transition-colors z-30" 
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Center Monaco Editor Panel */}
        <div className="flex-1 h-full flex flex-col min-w-0 bg-black/10 relative z-10">
          
          {/* Breadcrumbs & File Tabs Header */}
          <div className="h-11 border-b border-white/5 bg-[#090810]/40 flex items-center px-4 justify-between overflow-x-auto shrink-0 select-none">
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {openTabs.map(tab => (
                <div
                  key={tab.id}
                  className={`h-7 px-3 rounded-lg flex items-center gap-1.5 text-xs border transition-all shrink-0 cursor-pointer ${
                    activeTabId === tab.id 
                      ? 'bg-purple-600/10 border-purple-500/30 text-purple-300' 
                      : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300'
                  }`}
                  onClick={() => openTab(tab)}
                >
                  <FileCode className="h-3.5 w-3.5 text-indigo-400" />
                  <span className="truncate">{tab.path}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                    className="h-4 w-4 rounded hover:bg-white/10 flex items-center justify-center text-gray-500 hover:text-gray-300 font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}
              {openTabs.length === 0 && (
                <span className="text-[10px] text-gray-500 flex items-center gap-1">
                  <Compass className="h-3 w-3" /> Starter workspace active
                </span>
              )}
            </div>

            {/* Quick Actions (Fullscreen, Auto-save indicator) */}
            <div className="flex items-center gap-3 shrink-0 pl-4">
              {isSaving ? (
                <div className="flex items-center gap-1 text-[10px] text-purple-400">
                  <Save className="h-3 w-3 animate-pulse" />
                  <span>Saving...</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-[10px] text-gray-500">
                  <Check className="h-3 w-3" />
                  <span>Autosaved</span>
                </div>
              )}

              <button 
                onClick={() => setIsFullscreen(!isFullscreen)} 
                className="p-1 hover:bg-white/5 rounded text-gray-400 hover:text-white transition-colors"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize2 className="h-4.5 w-4.5" /> : <Maximize2 className="h-4.5 w-4.5" />}
              </button>
            </div>
          </div>

          {/* Monaco Editor Container */}
          <div className="flex-1 relative min-h-0">
            <div className="absolute inset-0">
              <Editor
                height="100%"
                theme={localTheme}
                language={currentFile ? currentFile.language : reviewLang}
                value={editorVal}
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                options={{
                  minimap: { enabled: localMinimap },
                  fontSize: localFontSize,
                  fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
                  tabSize: localTabSize,
                  automaticLayout: true,
                  padding: { top: 12 },
                  cursorBlinking: 'smooth',
                  cursorSmoothCaretAnimation: 'on',
                  wordWrap: localWordWrap ? 'on' : 'off',
                  lineNumbers: 'on',
                  renderLineHighlight: 'all',
                  readOnly: false,
                  scrollbar: {
                    verticalScrollbarSize: 6,
                    horizontalScrollbarSize: 6,
                  }
                }}
              />
            </div>
          </div>

          {/* Editor Status Bar */}
          <div className="h-6 border-t border-white/5 bg-[#090810]/60 flex items-center justify-between px-4 text-[10px] text-gray-500 select-none z-10 shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-purple-400 font-semibold uppercase tracking-wider">Monaco</span>
              <span>Line {cursorPos.line}, Col {cursorPos.column}</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Tab Size: {localTabSize}</span>
              <span className="uppercase font-bold text-gray-400">{currentFile ? currentFile.language : reviewLang}</span>
            </div>
          </div>
        </div>

        {/* Right AI Assistant Panel */}
        <AnimatePresence>
          {aiPanelOpen && (
            <motion.div 
              style={{ width: aiPanelWidth }}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: aiPanelWidth, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="h-full border-l border-white/5 bg-[#090810]/40 backdrop-blur-md z-10 flex flex-col shrink-0 relative overflow-hidden"
            >
              
              {/* Reviewer Drawer */}
              {activeTool === 'review' && (
                <div className="p-5 flex flex-col gap-4 h-full overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-white/[0.055] pb-3">
                    <h3 className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">AI Code Reviewer</h3>
                    <button 
                      onClick={() => setAiPanelOpen(false)}
                      className="p-1 hover:bg-white/5 rounded text-gray-500 hover:text-white"
                    >
                      <PanelLeftClose className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Provider Selector */}
                  <div>
                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">AI Provider</label>
                    <select
                      value={reviewProvider}
                      onChange={(e) => setReviewProvider(e.target.value)}
                      className="w-full input-premium rounded-xl text-xs text-gray-200 px-3 py-2.5 cursor-pointer"
                    >
                      <option value="gemini" className="bg-[#12101c]">Google Gemini</option>
                      <option value="openai" className="bg-[#12101c]">GPT 4o-mini</option>
                      <option value="claude" className="bg-[#12101c]">Claude 3.5 Sonnet</option>
                      <option value="mock" className="bg-[#12101c]">Mock Service</option>
                    </select>
                  </div>

                  {/* Language Override (when no file is open) */}
                  {!currentFile && (
                    <div>
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Language</label>
                      <select
                        value={reviewLang}
                        onChange={(e) => setReviewLang(e.target.value)}
                        className="w-full input-premium rounded-xl text-xs text-gray-200 px-3 py-2.5 cursor-pointer"
                      >
                        <option value="python" className="bg-[#12101c]">Python</option>
                        <option value="javascript" className="bg-[#12101c]">JavaScript</option>
                        <option value="typescript" className="bg-[#12101c]">TypeScript</option>
                        <option value="rust" className="bg-[#12101c]">Rust</option>
                        <option value="go" className="bg-[#12101c]">Go</option>
                        <option value="java" className="bg-[#12101c]">Java</option>
                      </select>
                    </div>
                  )}
                  
                  <button
                    onClick={handleReviewCode}
                    disabled={reviewing}
                    className="w-full py-3 rounded-xl text-xs font-bold btn-premium-gradient text-white disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {reviewing && (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    )}
                    {reviewing ? "Analyzing code..." : "Execute File Review"}
                  </button>

                  {/* Scanning Animation Progress */}
                  {reviewing && (
                    <div className="flex flex-col items-center justify-center p-6 bg-white/[0.02] border border-white/5 rounded-2xl gap-3">
                      <RefreshCw className="h-6 w-6 text-purple-400 animate-spin" />
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider animate-pulse">{reviewStep}</span>
                    </div>
                  )}

                  {reviewScore && (
                    <div className="flex flex-col gap-4 mt-2 animate-slide-down">
                      {/* Overall Score Ring */}
                      <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-purple-950/10 border border-purple-500/25 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent" />
                        <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest relative z-10">Overall Quality</span>
                        <span className={`text-4xl font-extrabold mt-1.5 relative z-10 ${
                          reviewScore.score_overall >= 80 ? 'text-emerald-400' :
                          reviewScore.score_overall >= 60 ? 'text-amber-400' : 'text-rose-400'
                        }`}>{reviewScore.score_overall}%</span>
                      </div>
                      
                      {/* Score Bars */}
                      <div className="flex flex-col gap-3">
                        {[
                          { label: "Security", val: reviewScore.score_security, bar: "bg-rose-500", text: "text-rose-400" },
                          { label: "Performance", val: reviewScore.score_performance, bar: "bg-amber-500", text: "text-amber-400" },
                          { label: "Readability", val: reviewScore.score_readability, bar: "bg-blue-500", text: "text-blue-400" },
                          { label: "Maintainability", val: reviewScore.score_maintainability, bar: "bg-emerald-500", text: "text-emerald-400" }
                        ].map((s, idx) => (
                          <div key={idx} className="flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">{s.label}</span>
                              <span className={`text-[10px] font-extrabold ${s.text}`}>{s.val}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${s.bar} rounded-full transition-all duration-1000 ease-out`}
                                style={{ width: `${s.val}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Issues List */}
                      {reviewScore.issues && reviewScore.issues.length > 0 && (
                        <div className="flex flex-col gap-2">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            Identified Concerns ({reviewScore.issues.length})
                          </span>
                          {reviewScore.issues.map((issue: any, index: number) => (
                            <div key={index} className="p-3.5 rounded-2xl border border-white/[0.055] bg-white/[0.01] text-[10px] flex flex-col gap-1.5 animate-slide-down" style={{ animationDelay: `${index * 50}ms` }}>
                              <div className="flex items-center justify-between font-bold">
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className={`h-3 w-3 ${
                                    issue.severity === 'critical' ? 'text-rose-400' : 'text-amber-400'
                                  }`} />
                                  <span className="text-gray-300">Line {issue.line_number}</span>
                                </div>
                                <span className={`uppercase text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                                  issue.severity === 'critical' ? 'text-rose-400 bg-rose-500/10' : 'text-amber-400 bg-amber-500/10'
                                }`}>{issue.severity}</span>
                              </div>
                              <p className="text-gray-400 leading-relaxed">{issue.description}</p>
                              {issue.category && (
                                <span className="text-[9px] text-purple-400 font-semibold">[{issue.category}]</span>
                              )}
                              {issue.suggested_fix && (
                                <div className="mt-1 p-2 bg-emerald-950/10 border border-emerald-500/15 rounded-lg">
                                  <span className="text-[9px] text-emerald-400 font-bold uppercase block mb-1">Suggested Fix</span>
                                  <code className="text-[9px] text-emerald-300/80 font-mono whitespace-pre-wrap block">{issue.suggested_fix}</code>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {reviewScore.issues && reviewScore.issues.length === 0 && (
                        <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-950/10 text-center">
                          <Check className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
                          <span className="text-[10px] text-emerald-400 font-bold">No issues detected — clean code!</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Generator Drawer */}
              {activeTool === 'generate' && (
                <div className="p-5 flex flex-col gap-4 h-full overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-white/[0.055] pb-3">
                    <h3 className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">AI Code Generator</h3>
                    <button 
                      onClick={() => setAiPanelOpen(false)}
                      className="p-1 hover:bg-white/5 rounded text-gray-500 hover:text-white"
                    >
                      <PanelLeftClose className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="flex flex-col gap-3.5">
                    <div>
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Language</label>
                      <select
                        value={genLang}
                        onChange={(e) => setGenLang(e.target.value)}
                        className="w-full input-premium rounded-xl text-xs text-gray-200 px-3 py-2.5 cursor-pointer"
                      >
                        <option value="python" className="bg-[#12101c]">Python</option>
                        <option value="javascript" className="bg-[#12101c]">JavaScript</option>
                        <option value="typescript" className="bg-[#12101c]">TypeScript</option>
                        <option value="rust" className="bg-[#12101c]">Rust</option>
                        <option value="go" className="bg-[#12101c]">Go</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Framework Template</label>
                      <select
                        value={genFramework}
                        onChange={(e) => setGenFramework(e.target.value)}
                        className="w-full input-premium rounded-xl text-xs text-gray-200 px-3 py-2.5 cursor-pointer"
                      >
                        <option value="vanilla" className="bg-[#12101c]">Vanilla</option>
                        <option value="react" className="bg-[#12101c]">React SPA</option>
                        <option value="fastapi" className="bg-[#12101c]">FastAPI Backend</option>
                        <option value="express" className="bg-[#12101c]">Express Node</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                        <span>Temperature</span>
                        <span>{genTemp}</span>
                      </div>
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
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">AI Prompt Instruction</label>
                      <textarea
                        placeholder="e.g. Write a JWT middleware handler verifying header tokens..."
                        value={genPrompt}
                        onChange={(e) => setGenPrompt(e.target.value)}
                        rows={5}
                        className="w-full input-premium rounded-xl px-3.5 py-2.5 text-xs text-gray-200 resize-none"
                      />
                    </div>

                    <button
                      onClick={handleGenerateCode}
                      disabled={generating}
                      className="w-full py-3 rounded-xl text-xs font-bold btn-premium-gradient text-white disabled:opacity-50 cursor-pointer"
                    >
                      {generating ? "Generating solution..." : "Generate Code Block"}
                    </button>

                    {streamingOutput && (
                      <div className="mt-2 p-3 bg-black/40 border border-white/[0.055] rounded-xl font-mono text-[9px] text-purple-300 max-h-40 overflow-y-auto whitespace-pre-wrap">
                        {streamingOutput}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Bug Scan Drawer */}
              {activeTool === 'bugs' && (
                <div className="p-5 flex flex-col gap-4 h-full overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-white/[0.055] pb-3">
                    <h3 className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Bug Scanning</h3>
                    <button 
                      onClick={() => setAiPanelOpen(false)}
                      className="p-1 hover:bg-white/5 rounded text-gray-500 hover:text-white"
                    >
                      <PanelLeftClose className="h-4 w-4" />
                    </button>
                  </div>

                  <button
                    onClick={handleScanBugs}
                    disabled={scanning}
                    className="w-full py-3 rounded-xl text-xs font-bold bg-rose-950/20 hover:bg-rose-950/40 text-rose-300 border border-rose-500/25 cursor-pointer disabled:opacity-50 transition-all"
                  >
                    {scanning ? "Scanning for compile errors..." : "Scan active tab"}
                  </button>

                  <div className="flex flex-col gap-3.5 mt-2">
                    {bugs.map((bug, i) => (
                      <div key={i} className="p-4 border border-white/[0.055] rounded-2xl bg-white/[0.01] flex flex-col gap-2.5 text-xs animate-slide-down">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-400 text-[9px] font-bold uppercase">
                            {bug.severity}
                          </span>
                          <span className="text-gray-500 font-bold">Line {bug.line_number}</span>
                        </div>
                        <p className="text-gray-400 text-[11px] leading-relaxed">{bug.description}</p>
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
                <div className="p-5 flex flex-col gap-4 h-full overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-white/[0.055] pb-3">
                    <h3 className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Doc Generator</h3>
                    <button 
                      onClick={() => setAiPanelOpen(false)}
                      className="p-1 hover:bg-white/5 rounded text-gray-500 hover:text-white"
                    >
                      <PanelLeftClose className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="flex flex-col gap-3.5">
                    <div>
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Doc Target Structure</label>
                      <select
                        value={docsType}
                        onChange={(e) => setDocsType(e.target.value)}
                        className="w-full input-premium rounded-xl text-xs text-gray-200 px-3 py-2.5 cursor-pointer"
                      >
                        <option value="README" className="bg-[#12101c]">Project README.md</option>
                        <option value="API_DOCS" className="bg-[#12101c]">API Specification</option>
                        <option value="INLINE" className="bg-[#12101c]">JSDoc / Inline Docstrings</option>
                      </select>
                    </div>

                    <button
                      onClick={handleGenerateDocs}
                      disabled={generatingDocs}
                      className="w-full py-3 rounded-xl text-xs font-bold btn-premium-gradient text-white cursor-pointer disabled:opacity-50 transition-all"
                    >
                      {generatingDocs ? "Formatting docs..." : "Generate Documentation"}
                    </button>

                    {docsContent && (
                      <div className="flex flex-col gap-2.5 mt-2 animate-slide-down">
                        <textarea
                          readOnly
                          value={docsContent}
                          rows={10}
                          className="w-full bg-black/40 border border-white/[0.055] rounded-xl px-3 py-2.5 text-[10px] text-gray-400 font-mono resize-none focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Draggable Splitter Handle (Right) */}
              <div 
                onMouseDown={startDragRight}
                className="absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-purple-500/30 transition-colors z-30" 
              />
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default CodeWorkspace;
