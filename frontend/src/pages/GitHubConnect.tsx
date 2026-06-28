import React, { useEffect, useState } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useNotification } from '../contexts/NotificationContext';
import axios from 'axios';
import { Github, Plus, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

const GitHubConnect: React.FC = () => {
  const { currentWorkspace } = useWorkspace();
  const { addToast } = useNotification();
  
  const [repos, setRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanningId, setScanningId] = useState<string | null>(null);

  // Connection fields
  const [showForm, setShowForm] = useState(false);
  const [owner, setOwner] = useState('');
  const [repoName, setRepoName] = useState('');

  const fetchConnectedRepos = async () => {
    try {
      const res = await axios.get('/api/v1/github/repos');
      setRepos(res.data);
    } catch (e) {
      console.error("Failed to load connected repositories", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnectedRepos();

    // Subscribe to scan complete updates to reload tables
    const handleScanDone = () => {
      fetchConnectedRepos();
      setScanningId(null);
    };
    window.addEventListener('CODEFLOW_SCAN_COMPLETE', handleScanDone);
    return () => window.removeEventListener('CODEFLOW_SCAN_COMPLETE', handleScanDone);
  }, []);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace || !owner.trim() || !repoName.trim()) return;

    try {
      await axios.post(`/api/v1/github/connect?workspace_id=${currentWorkspace.id}&repo_name=${repoName}&owner=${owner}`);
      addToast("Repository linked", `Successfully connected ${owner}/${repoName}.`, "success");
      setOwner('');
      setRepoName('');
      setShowForm(false);
      fetchConnectedRepos();
    } catch (err) {
      addToast("Connection failed", "Could not link Github repository.", "error");
    }
  };

  const handleTriggerScan = async (repoId: string) => {
    setScanningId(repoId);
    try {
      await axios.post(`/api/v1/github/review/${repoId}`);
      addToast("Scan Dispatched", "Worker has queued repository reviews.", "info");
    } catch (e) {
      addToast("Scan Dispatch failed", "Could not queue worker tasks.", "error");
      setScanningId(null);
    }
  };

  return (
    <div className="p-6 md:p-8 flex flex-col gap-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            GitHub Integration
          </h2>
          <p className="text-xs text-gray-400 mt-1">Connect repository trees to workspaces and evaluate branch-wide reviews.</p>
        </div>
        
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-md transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Link Repository
        </button>
      </div>

      {showForm && (
        <div className="p-6 border border-border glass-panel rounded-2xl animate-scale-in">
          <h3 className="text-sm font-bold text-gray-200">Connect Github Repository</h3>
          <form onSubmit={handleConnect} className="mt-4 grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Repo Owner / Organization</label>
              <input
                type="text"
                required
                placeholder="e.g. google"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="w-full bg-white/5 border border-border rounded-xl px-4 py-2 text-xs text-gray-200 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Repository Name</label>
              <input
                type="text"
                required
                placeholder="e.g. gemini-api-docs"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                className="w-full bg-white/5 border border-border rounded-xl px-4 py-2 text-xs text-gray-200 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="sm:col-span-2 flex items-center justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-xl text-xs border border-border text-gray-400 hover:text-gray-200 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 text-white hover:bg-purple-500 cursor-pointer"
              >
                Connect Repo
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Connected Repositories Grid */}
      <div className="flex flex-col gap-4">
        <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest">Connected Repositories</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {repos.map((repo) => (
            <div key={repo.id} className="p-5 border border-border glass-panel rounded-2xl flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Github className="h-5 w-5 text-purple-400" />
                  <h4 className="font-bold text-gray-200 truncate">{repo.owner}/{repo.repo_name}</h4>
                </div>
                <p className="text-[10px] text-gray-400 mt-2 truncate">URL: <a href={repo.html_url} target="_blank" rel="noreferrer" className="text-purple-400 hover:underline">{repo.html_url}</a></p>
                <div className="flex items-center gap-2 mt-4 text-[10px]">
                  <span className="text-gray-500">Last Scanned:</span>
                  <span className="text-gray-300">
                    {repo.last_scanned_at ? new Date(repo.last_scanned_at).toLocaleString() : "Never"}
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleTriggerScan(repo.id)}
                disabled={scanningId === repo.id}
                className="w-full py-2 rounded-xl text-xs font-semibold border border-purple-500/20 hover:border-purple-500/40 text-purple-300 bg-purple-500/5 hover:bg-purple-500/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${scanningId === repo.id ? 'animate-spin' : ''}`} />
                {scanningId === repo.id ? "Analyzing codebase..." : "Scan & Review Repo"}
              </button>
            </div>
          ))}

          {repos.length === 0 && !loading && (
            <div className="sm:col-span-2 p-12 border border-border glass-panel rounded-2xl text-center">
              <Github className="h-8 w-8 text-gray-500 mx-auto mb-2 animate-pulse" />
              <h5 className="font-semibold text-gray-300 text-xs">No repositories connected.</h5>
              <p className="text-[10px] text-gray-500 mt-1">Connect repositories to link them to your projects and review commits.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GitHubConnect;
