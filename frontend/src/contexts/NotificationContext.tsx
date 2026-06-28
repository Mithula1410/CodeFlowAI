import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  created_at: Date;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  chatHistory: ChatMessage[];
  isTyping: boolean;
  wsConnected: boolean;
  addToast: (title: string, message: string, type: 'success' | 'warning' | 'error' | 'info') => void;
  sendWsChatMessage: (messages: ChatMessage[], provider?: string) => void;
  clearChatHistory: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  const addToast = (title: string, message: string, type: 'success' | 'warning' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotif: NotificationItem = { id, title, message, type, created_at: new Date() };
    setNotifications(prev => [...prev, newNotif]);

    // Auto remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const connectWebSocket = () => {
    if (!isAuthenticated || !token) return;

    if (wsRef.current) {
      wsRef.current.close();
    }

    // Determine WS protocol
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Vite proxy takes /api/v1/ws, or fallback to direct backend host
    const wsUrl = `${protocol}//${window.location.host}/api/v1/ws?token=${token}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
      console.log("WebSocket connected successfully.");
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const { type } = payload;

        if (type === "NOTIFICATION") {
          addToast(payload.title, payload.message, payload.style);
        } else if (type === "TYPING") {
          setIsTyping(payload.status);
        } else if (type === "CHAT_CHUNK") {
          setChatHistory(prev => {
            if (prev.length === 0 || prev[prev.length - 1].role !== 'assistant') {
              return [...prev, { role: 'assistant', content: payload.chunk }];
            } else {
              const last = prev[prev.length - 1];
              const updated = { ...last, content: last.content + payload.chunk };
              return [...prev.slice(0, -1), updated];
            }
          });
        } else if (type === "CODE_GEN_CHUNK") {
          // Can be intercepted by CodeGenerate listeners
          const eventGen = new CustomEvent("CODEFLOW_GEN_CHUNK", { detail: payload.chunk });
          window.dispatchEvent(eventGen);
        } else if (type === "REVIEW_COMPLETE") {
          addToast("Review Finished", `Your code review overall score is ${payload.score}%`, "success");
          window.dispatchEvent(new CustomEvent("CODEFLOW_REVIEW_COMPLETE", { detail: payload }));
        } else if (type === "SCAN_COMPLETE") {
          addToast("Github Scan Complete", `Repository scan completed successfully. Score: ${payload.score}%`, "success");
          window.dispatchEvent(new CustomEvent("CODEFLOW_SCAN_COMPLETE", { detail: payload }));
        }
      } catch (err) {
        console.error("Error parsing websocket frame", err);
      }
    };

    ws.onclose = () => {
      setWsConnected(false);
      console.log("WebSocket closed. Attempting reconnect in 3s...");
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
    };

    ws.onerror = (err) => {
      console.error("WebSocket encountered error: ", err);
      ws.close();
    };
  };

  useEffect(() => {
    if (isAuthenticated && token) {
      connectWebSocket();
    } else {
      if (wsRef.current) {
        wsRef.current.close();
      }
      setWsConnected(false);
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isAuthenticated, token]);

  const sendWsChatMessage = (messages: ChatMessage[], provider: string = "mock") => {
    if (wsRef.current && wsConnected) {
      // Append user's message to local list immediately
      const lastUserMsg = messages[messages.length - 1];
      setChatHistory(prev => [...prev, lastUserMsg]);
      
      wsRef.current.send(JSON.stringify({
        type: "CHAT",
        messages,
        provider
      }));
    } else {
      addToast("Connection Error", "WebSocket disconnected. Reconnecting...", "error");
    }
  };

  const clearChatHistory = () => {
    setChatHistory([]);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        chatHistory,
        isTyping,
        wsConnected,
        addToast,
        sendWsChatMessage,
        clearChatHistory
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used inside a NotificationProvider');
  }
  return context;
};
