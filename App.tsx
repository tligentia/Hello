import React, { useState, useEffect } from 'react';
import { Security } from './Plantilla/Seguridad';
import { Shell } from './Plantilla/Shell';
import { crypto, validateKey, getShortcutKey } from './Plantilla/Parameters';
import { Key, AlertCircle, ArrowRight } from 'lucide-react';

export default function App() {
  const [isAuth, setIsAuth] = useState(() => {
    if (typeof window === 'undefined') return false;
    const isDevMode = !window.location.hostname || window.location.hostname === 'localhost';
    return isDevMode || localStorage.getItem('app_is_auth_v2') === 'true';
  });
  
  const [apiKey, setApiKey] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('app_apikey_v2') || '';
  });

  const [isKeyValid, setIsKeyValid] = useState<boolean | null>(null);
  const [userIp, setUserIp] = useState<string | null>(null);

  // Validación de la API Key con auto-carga de Dev Key
  useEffect(() => {
    const checkKey = async () => {
      const isDevMode = !window.location.hostname || window.location.hostname === 'localhost';
      
      // Auto-load dev key if empty in dev mode
      if (!apiKey && isDevMode) {
        const devKey = getShortcutKey('ok');
        if (devKey) {
          saveApiKey(devKey);
          return; // State update will re-trigger this effect
        }
      }

      if (!apiKey) {
        setIsKeyValid(false);
        return;
      }

      const isValid = await validateKey(apiKey);
      
      // If current key is invalid but we are in dev mode, try 'ok' shortcut as fallback
      if (!isValid && isDevMode) {
        const devKey = getShortcutKey('ok');
        if (devKey && apiKey !== devKey) {
          const devValid = await validateKey(devKey);
          if (devValid) {
            saveApiKey(devKey);
            return;
          }
        }
      }

      setIsKeyValid(isValid);
    };
    if (isAuth) checkKey();
  }, [apiKey, isAuth]);

  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => {
        setUserIp(data.ip);
        
        // Auto-auth logic based on memorized IP
        if (!isAuth) {
          const savedIpsRaw = localStorage.getItem('app_memorized_ips_v2');
          if (savedIpsRaw) {
            try {
              const savedIps: string[] = JSON.parse(savedIpsRaw);
              const obfuscatedCurrent = crypto.obfuscate(data.ip);
              if (savedIps.includes(obfuscatedCurrent)) {
                setIsAuth(true);
                localStorage.setItem('app_is_auth_v2', 'true');
              }
            } catch (e) {
              console.error("Error with IP persistence", e);
            }
          }
        }
      })
      .catch(() => setUserIp('IP Offline'));
  }, [isAuth]);

  const handleLoginSuccess = () => {
    setIsAuth(true);
    localStorage.setItem('app_is_auth_v2', 'true');
  };

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('app_apikey_v2', key);
  };

  return (
    <>
      {!isAuth && <Security onLogin={handleLoginSuccess} />}
      
      <div className={!isAuth ? 'blur-md pointer-events-none select-none opacity-50' : 'animate-in fade-in duration-700'}>
        <Shell apiKey={apiKey} onApiKeySave={saveApiKey} userIp={userIp} isKeyValid={isKeyValid}>
          <div className="flex flex-col items-center justify-center min-h-[60vh] py-12">
            
            {/* Aviso de API Key faltante o inválida */}
            {isKeyValid === false && (
              <div className="mb-12 w-full max-w-lg bg-white border-2 border-red-700 p-8 rounded-[2rem] shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
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
                  No se ha detectado una <span className="text-gray-900 font-bold">Gemini API Key</span> válida en este sistema. 
                  Para habilitar las funciones de inteligencia avanzada, debes introducir tu clave personal.
                </p>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 flex items-center gap-3">
                  <Key size={18} className="text-gray-400" />
                  <span className="text-[11px] font-mono text-gray-500 uppercase">Estado: Desconectado</span>
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  Sugestión: Dirígete a <span className="text-red-700 underline underline-offset-4">Ajustes</span> en el pie de página <ArrowRight size={12} />
                </p>
              </div>
            )}

            {/* Logo Central */}
            <div className="relative group">
              <h2 className={`text-7xl md:text-9xl font-black text-gray-900 tracking-tighter text-center leading-none transition-all duration-500 ${isKeyValid === false ? 'opacity-20 scale-95 blur-sm' : 'group-hover:scale-105'}`}>
                HELLO<br/>
                <span className="text-red-700">WORLD</span>
              </h2>
              {isKeyValid && (
                <div className="absolute -top-4 -right-4 bg-gray-900 text-white text-[10px] px-3 py-1.5 rounded-lg font-black transform rotate-12 shadow-2xl animate-bounce">
                  READY
                </div>
              )}
            </div>
            
            <div className="mt-12 flex flex-col items-center">
              <div className="h-1.5 w-32 bg-gray-900 rounded-full mb-6 overflow-hidden">
                <div className={`h-full bg-red-700 transition-all duration-1000 ${isKeyValid ? 'w-full' : 'w-1/4 animate-pulse'}`}></div>
              </div>
              <p className="text-gray-400 font-mono text-[10px] uppercase tracking-[0.4em] font-black animate-pulse">
                {isKeyValid ? 'System Active & Persistent' : 'System Standby • Awaiting Config'}
              </p>
            </div>
          </div>
        </Shell>
      </div>

      <style>{`
        @keyframes slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </>
  );
}