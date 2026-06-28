import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, ArrowRight } from 'lucide-react';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen w-screen flex flex-col items-center justify-center bg-[#08070d] text-gray-100 px-6">
      {/* Background Mesh */}
      <div className="absolute inset-0 grid-mesh pointer-events-none z-0" />
      
      {/* Glow orb */}
      <div className="absolute h-80 w-80 rounded-full bg-purple-900/10 glow-orb" />

      {/* Card */}
      <div className="w-full max-w-sm p-8 border border-border glass-panel rounded-2xl text-center flex flex-col items-center gap-4 relative z-10 animate-scale-in">
        <div className="h-16 w-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-2">
          <Compass className="h-8 w-8 animate-spin" style={{ animationDuration: '8s' }} />
        </div>
        <h2 className="text-4xl font-extrabold text-white">404</h2>
        <h4 className="font-bold text-gray-300 text-sm">Workspace Lost in Transit</h4>
        <p className="text-xs text-gray-500 leading-relaxed">
          The project directory or page you are requesting could not be located inside your active CodeFlow AI workspace.
        </p>

        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-500/15 cursor-pointer transition-all mt-2"
        >
          Return to Dashboard
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default NotFound;
