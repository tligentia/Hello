import React, { useState } from 'react';
import { BarChart3, Database, Sparkles, HelpCircle } from 'lucide-react';
import { COLORS } from './Parameters';
import { Pie } from './Pie';
import { Cookies } from './Cookies';
import { Ajustes } from './Ajustes';
import { MenuApps } from './MenuApps';

interface CabeceraProps {
  children: React.ReactNode;
  userIp: string | null;
  onManualClick: () => void;
}

export const Cabecera: React.FC<CabeceraProps> = ({ children, userIp, onManualClick }) => {
  const [showAjustes, setShowAjustes] = useState(false);
  const [showCookies, setShowCookies] = useState(false);

  return (
    <div className={`min-h-screen ${COLORS.bg} font-sans flex flex-col p-4 md:p-8`}>
      {/* HEADER ESTRUCTURAL */}
      <header className="sticky top-0 z-50 bg-white mb-8 border-b border-gray-200 pb-6 pt-4 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-gray-900 flex items-center gap-2">
            <BarChart3 className="text-red-700" size={32} />
            Hello<span className="text-red-700"> !!</span>
          </h1>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-gray-400 text-[10px] uppercase font-bold flex items-center gap-1">
              <Database size={10} /> Scaffolding • <Sparkles size={10} className="text-red-700"/> AI READY
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={onManualClick}
            className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-900 px-4 py-2 rounded-xl transition-all active:scale-95 group shadow-sm"
          >
            <HelpCircle size={18} className="text-red-700 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Manual</span>
          </button>

          <MenuApps />
        </div>
      </header>

      {/* CONTENIDO DINÁMICO */}
      <main className="flex-1 max-w-7xl mx-auto w-full">{children}</main>

      {/* PIE DE PÁGINA */}
      <Pie 
        userIp={userIp} 
        onShowCookies={() => setShowCookies(true)} 
        onShowAjustes={() => setShowAjustes(true)} 
      />

      <Ajustes 
        isOpen={showAjustes} 
        onClose={() => setShowAjustes(false)} 
        userIp={userIp}
      />

      <Cookies isOpen={showCookies} onClose={() => setShowCookies(false)} />
    </div>
  );
};