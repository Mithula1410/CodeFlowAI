import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

export interface FileItem {
  id: string;
  project_id: string;
  path: string;
  content: string;
  language: string;
  updated_at: string;
}

export interface ProjectItem {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  created_at: string;
  files: FileItem[];
}

export interface WorkspaceItem {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  created_at: string;
  projects: ProjectItem[];
}

interface WorkspaceContextType {
  workspaces: WorkspaceItem[];
  currentWorkspace: WorkspaceItem | null;
  currentProject: ProjectItem | null;
  currentFile: FileItem | null;
  openTabs: FileItem[];
  activeTabId: string | null;
  loading: boolean;
  fetchWorkspaces: () => Promise<void>;
  createWorkspace: (name: string, description?: string) => Promise<void>;
  selectWorkspace: (workspaceId: string) => Promise<void>;
  createProject: (name: string, description?: string) => Promise<void>;
  selectProject: (projectId: string) => void;
  createFile: (path: string, content?: string) => Promise<void>;
  updateFileContent: (fileId: string, content: string) => Promise<void>;
  openTab: (file: FileItem) => void;
  closeTab: (fileId: string) => void;
  setActiveTabId: (fileId: string) => void;
  deleteFile: (fileId: string) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceItem | null>(null);
  const [currentProject, setCurrentProject] = useState<ProjectItem | null>(null);
  const [currentFile, setCurrentFile] = useState<FileItem | null>(null);
  
  const [openTabs, setOpenTabs] = useState<FileItem[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchWorkspaces = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const response = await axios.get('/api/v1/workspaces/');
      let currentWorkspaces = response.data;
      
      // 1. If no workspace exists, automatically create a default workspace
      if (currentWorkspaces.length === 0) {
        const createRes = await axios.post('/api/v1/workspaces/', {
          name: "My Workspace",
          description: "Default workspace"
        });
        currentWorkspaces = [createRes.data];
      }
      
      setWorkspaces(currentWorkspaces);
      
      // Select the first workspace
      if (currentWorkspaces.length > 0) {
        await selectWorkspace(currentWorkspaces[0].id);
      }
    } catch (e) {
      console.error("Failed to load workspaces", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, [isAuthenticated]);

  const selectWorkspace = async (workspaceId: string) => {
    try {
      const res = await axios.get(`/api/v1/workspaces/${workspaceId}`);
      let workspaceDetails = res.data;
      
      // 2. If no project exists, automatically create a default project
      if (!workspaceDetails.projects || workspaceDetails.projects.length === 0) {
        const projRes = await axios.post(`/api/v1/projects/workspace/${workspaceId}`, {
          name: "My First Project",
          description: "Default project"
        });
        
        // Fetch workspace again to get updated projects list
        const refreshRes = await axios.get(`/api/v1/workspaces/${workspaceId}`);
        workspaceDetails = refreshRes.data;
      }
      
      setCurrentWorkspace(workspaceDetails);
      
      let project = workspaceDetails.projects && workspaceDetails.projects.length > 0 
        ? workspaceDetails.projects[0] 
        : null;
        
      if (project) {
        // 3. If no files exist, automatically create a starter file
        if (!project.files || project.files.length === 0) {
          const defaultFiles = [
            { path: "main.py", content: "def main():\n    print(\"Hello, CodeFlow!\")\n\nif __name__ == '__main__':\n    main()\n" },
            { path: "index.js", content: "console.log(\"Hello, CodeFlow!\");\n" },
            { path: "App.tsx", content: "import React from 'react';\n\nexport default function App() {\n  return <h1>Hello, CodeFlow!</h1>;\n}\n" },
            { path: "Main.java", content: "public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello, CodeFlow!\");\n    }\n}\n" }
          ];
          
          // Create the starter files
          const createdFiles = [];
          for (const defaultFile of defaultFiles) {
            try {
              const fileRes = await axios.post(`/api/v1/files/project/${project.id}`, defaultFile);
              createdFiles.push(fileRes.data);
            } catch (fileErr) {
              console.error("Failed to create starter file", defaultFile.path, fileErr);
            }
          }
          project = { ...project, files: createdFiles };
        }
        
        setCurrentProject(project);
        
        // 4. Automatically open the first file in the Monaco Editor
        if (project.files && project.files.length > 0) {
          const firstFile = project.files[0];
          setOpenTabs([firstFile]);
          setActiveTabId(firstFile.id);
          setCurrentFile(firstFile);
        } else {
          setOpenTabs([]);
          setActiveTabId(null);
          setCurrentFile(null);
        }
      } else {
        setCurrentProject(null);
        setOpenTabs([]);
        setActiveTabId(null);
        setCurrentFile(null);
      }
    } catch (e) {
      console.error("Error fetching workspace details", e);
    }
  };

  const createWorkspace = async (name: string, description?: string) => {
    try {
      const response = await axios.post('/api/v1/workspaces/', { name, description });
      setWorkspaces(prev => [...prev, response.data]);
      await selectWorkspace(response.data.id);
    } catch (e) {
      console.error("Failed to create workspace", e);
    }
  };

  const createProject = async (name: string, description?: string) => {
    if (!currentWorkspace) return;
    try {
      const response = await axios.post(`/api/v1/projects/workspace/${currentWorkspace.id}`, { name, description });
      // Refresh current workspace
      await selectWorkspace(currentWorkspace.id);
    } catch (e) {
      console.error("Failed to create project", e);
    }
  };

  const selectProject = (projectId: string) => {
    if (!currentWorkspace) return;
    const project = currentWorkspace.projects.find(p => p.id === projectId);
    if (project) {
      setCurrentProject(project);
      setOpenTabs([]);
      setActiveTabId(null);
      setCurrentFile(null);
    }
  };

  const createFile = async (path: string, content: string = "") => {
    if (!currentProject || !currentWorkspace) return;
    try {
      const res = await axios.post(`/api/v1/files/project/${currentProject.id}`, { path, content });
      const newFile = res.data;
      
      // Update local cache
      const updatedFiles = [...currentProject.files, newFile];
      const updatedProj = { ...currentProject, files: updatedFiles };
      setCurrentProject(updatedProj);
      
      // Select newly created file
      openTab(newFile);
    } catch (e) {
      console.error("Failed to create file", e);
    }
  };

  const deleteFile = async (fileId: string) => {
    if (!currentProject) return;
    try {
      await axios.delete(`/api/v1/files/${fileId}`);
      closeTab(fileId);
      const updatedFiles = currentProject.files.filter(f => f.id !== fileId);
      setCurrentProject({ ...currentProject, files: updatedFiles });
    } catch (e) {
      console.error("Failed to delete file", e);
    }
  };

  const updateFileContent = async (fileId: string, content: string) => {
    try {
      const res = await axios.put(`/api/v1/files/${fileId}`, { content });
      const updatedFile = res.data;
      
      // Update open tabs
      setOpenTabs(prev => prev.map(tab => tab.id === fileId ? updatedFile : tab));
      if (currentFile?.id === fileId) {
        setCurrentFile(updatedFile);
      }
      
      // Update project files cache
      if (currentProject) {
        const updatedFiles = currentProject.files.map(f => f.id === fileId ? updatedFile : f);
        setCurrentProject({ ...currentProject, files: updatedFiles });
      }
    } catch (e) {
      console.error("Failed to save file content", e);
    }
  };

  const openTab = (file: FileItem) => {
    if (!openTabs.find(tab => tab.id === file.id)) {
      setOpenTabs(prev => [...prev, file]);
    }
    setActiveTabId(file.id);
    setCurrentFile(file);
  };

  const closeTab = (fileId: string) => {
    const tabIndex = openTabs.findIndex(tab => tab.id === fileId);
    const newTabs = openTabs.filter(tab => tab.id !== fileId);
    setOpenTabs(newTabs);

    if (activeTabId === fileId) {
      if (newTabs.length > 0) {
        const nextActiveIndex = Math.max(0, tabIndex - 1);
        const nextActiveFile = newTabs[nextActiveIndex];
        setActiveTabId(nextActiveFile.id);
        setCurrentFile(nextActiveFile);
      } else {
        setActiveTabId(null);
        setCurrentFile(null);
      }
    }
  };

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        currentProject,
        currentFile,
        openTabs,
        activeTabId,
        loading,
        fetchWorkspaces,
        createWorkspace,
        selectWorkspace,
        createProject,
        selectProject,
        createFile,
        updateFileContent,
        openTab,
        closeTab,
        setActiveTabId,
        deleteFile
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used inside a WorkspaceProvider');
  }
  return context;
};
