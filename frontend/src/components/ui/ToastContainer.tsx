import React from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { CheckCircle, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const ToastContainer: React.FC = () => {
  const { notifications } = useNotification();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-emerald-400" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-400" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-rose-400" />;
      default:
        return <Info className="h-5 w-5 text-blue-400" />;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/30 shadow-emerald-500/5';
      case 'warning':
        return 'border-amber-500/30 shadow-amber-500/5';
      case 'error':
        return 'border-rose-500/30 shadow-rose-500/5';
      default:
        return 'border-blue-500/30 shadow-blue-500/5';
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className={`flex items-start gap-3 p-4 rounded-xl border glass-panel shadow-lg animate-slide-in ${getBorderColor(notif.type)}`}
          style={{
            animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}
        >
          <div className="mt-0.5">{getIcon(notif.type)}</div>
          <div className="flex-1">
            <h4 className="font-semibold text-sm text-gray-100">{notif.title}</h4>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">{notif.message}</p>
          </div>
        </div>
      ))}

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateY(1rem) scale(0.95);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default ToastContainer;
