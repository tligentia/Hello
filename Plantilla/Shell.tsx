import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, Sparkles, HelpCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { COLORS, validateKey, listAvailableModels } from './Parameters';
import { Footer } from './Footer';
import { Cookies } from './Cookies';
import { Ajustes } from './Ajustes';
import { Manual } from './Manual';
import { AppMenu } from './AppMenu';

interface ShellProps {
  children: React.ReactNode;
  apiKey: string;
  onApiKeySave: (key: string) => void;
}

export const Shell: React.FC<ShellProps> = ({ children, apiKey, onApiKeySave }) => {
  const [showAjustes, setShowAjustes] = useState(false);
  const [showCookies, setShowCookies] = useState(false);
  const [showManual, setShowManual] = useState(false);
  
  // [PROCESO DE INICIALIZACIÓN CENTRALIZADO]
  const [isKeyValid, setIsKeyValid] = useState<boolean | null>(null);
  const [userIp, setUserIp] = useState<string | null>(null);

  const initializeSystem = useCallback(async () => {
    // 1. Detección de IP
    try {
      const res = await fetch('https://api.ipify.org?format=json');
      const data = await res.json();
      setUserIp(data.ip);
    } catch {
      setUserIp('Offline');
    }

    // 2. Validación de Motor IA
    if (!apiKey) {
      setIsKeyValid(false);
      updateLandingUI(false);
      return;
    }

    const isValid = await validateKey(apiKey);
    setIsKeyValid(isValid);
    updateLandingUI(isValid);

    // 3. Pre-selección de mejor modelo si es válido
    if (isValid) {
      const currentModel = localStorage.getItem('app_selected_model');
      if (!currentModel) {
        const models = await listAvailableModels();
        const optimal = models.find(m => m === 'gemini-3-flash-preview') || 
                        models.find(m => m.includes('flash-preview')) || 
                        models.find(m => m.includes('flash')) || 
                        models[0];
        if (optimal) localStorage.setItem('app_selected_model', optimal);
      }
    }
  }, [apiKey]);

  // Función para actualizar elementos de la landing que dependen del estado de la IA
  const updateLandingUI = (valid: boolean) => {
    const badge = document.getElementById('status-ready-badge');
    const bar = document.getElementById('status-progress-bar');
    const text = document.getElementById('status-text');
    
    if (badge) badge.style.display = valid ? 'block' : 'none';
    if (bar) {
      bar.style.width = valid ? '100%' : '25%';
      if (!valid) bar.classList.add('animate-pulse');
      else bar.classList.remove('animate-pulse');
    }
    if (text) {
      text.innerText = valid ? 'System Active & Persistent' : 'System Standby • Awaiting Config';
    }
  };

  useEffect(() => {
    initializeSystem();
  }, [initializeSystem]);

  return (
    <div className={`min-h-screen ${COLORS.bg} font-sans flex flex-col p-4 md:p-8 animate-in fade-in duration-500`}>
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white mb-8 border-b border-gray-200 pb-6 pt-4 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-gray-900 flex items-center gap-2">
            <BarChart3 className="text-red-700" size={32} />
            Hello<span className="text-red-700"> !!</span>
          </h1>
          <div className="flex items-center gap-4 mt-1">
            <div className="flex items-center gap-1.5">
              {isKeyValid === true ? (
                <span className="flex items-center gap-1 text-[9px] font-black text-green-600 uppercase tracking-widest bg-green-50 px-2 py-0.5 rounded-md border border-green-100 animate-in fade-in zoom-in">
                  <CheckCircle2 size={10} /> AI ONLINE
                </span>
              ) : isKeyValid === false ? (
                <span className="flex items-center gap-1 text-[9px] font-black text-red-700 uppercase tracking-widest bg-red-50 px-2 py-0.5 rounded-md border border-red-100 animate-pulse cursor-help" title="Configuración requerida">
                  <AlertCircle size={10} /> AI OFFLINE
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded-md">
                  <Sparkles size={10} className="animate-spin" /> SYNCING
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowManual(true)}
            className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-900 px-4 py-2 rounded-xl transition-all active:scale-95 group shadow-sm"
          >
            <HelpCircle size={18} className="text-red-700 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Manual</span>
          </button>
          <AppMenu />
        </div>
      </header>

      {/* CONTENT */}
      <main className="flex-1 max-w-7xl mx-auto w-full">
        {isKeyValid === false && (
          <div className="mb-12 w-full max-w-lg mx-auto bg-white border-2 border-red-700 p-8 rounded-[2rem] shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-red-700 rounded-2xl text-white">
                <AlertCircle size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Acceso IA Restringido</h3>
                <p className="text-[10px] text-red-700 font-bold uppercase tracking-widest">Configuración requerida</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed mb-6 font-medium">
              No se ha detectado una <span className="text-gray-900 font-bold">Gemini API Key</span> válida. 
              Active su clave en el panel de ajustes para habilitar el motor.
            </p>
            <button 
              onClick={() => setShowAjustes(true)}
              className="w-full bg-gray-900 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all"
            >
              Ir a Ajustes Maestro
            </button>
          </div>
        )}
        {children}
      </main>

      {/* FOOTER */}
      <Footer 
        userIp={userIp} 
        onShowCookies={() => setShowCookies(true)} 
        onShowAjustes={() => setShowAjustes(true)} 
      />

      <Ajustes 
        isOpen={showAjustes} 
        onClose={() => setShowAjustes(false)} 
        apiKey={apiKey}
        onApiKeySave={onApiKeySave}
        userIp={userIp}
      />

      <Cookies isOpen={showCookies} onClose={() => setShowCookies(false)} />
      <Manual isOpen={showManual} onClose={() => setShowManual(false)} />
    </div>
  );
};