import React, { useState, useEffect } from 'react';
import { Security } from './Plantilla/Seguridad';
import { Shell } from './Plantilla/Shell';
import { crypto, getShortcutKey } from './Plantilla/Parameters';

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

  const handleLoginSuccess = () => {
    setIsAuth(true);
    localStorage.setItem('app_is_auth_v2', 'true');
  };

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('app_apikey_v2', key);
  };

  // El guardián de IP ahora se maneja dentro de Shell, pero App mantiene la sesión
  useEffect(() => {
    if (!isAuth) {
      const savedIpsRaw = localStorage.getItem('app_memorized_ips_v2');
      if (savedIpsRaw) {
        fetch('https://api.ipify.org?format=json')
          .then(res => res.json())
          .then(data => {
            const savedIps: string[] = JSON.parse(savedIpsRaw);
            const obfuscatedCurrent = crypto.obfuscate(data.ip);
            if (savedIps.includes(obfuscatedCurrent)) {
              handleLoginSuccess();
            }
          }).catch(() => {});
      }
    }
  }, [isAuth]);

  return (
    <>
      {!isAuth && <Security onLogin={handleLoginSuccess} />}
      
      <div className={!isAuth ? 'blur-md pointer-events-none select-none opacity-50' : 'animate-in fade-in duration-700'}>
        <Shell apiKey={apiKey} onApiKeySave={saveApiKey}>
          {/* El contenido de la App se inyecta como children y recibe el estado de salud desde el contexto del Shell si fuera necesario */}
          <div className="flex flex-col items-center justify-center min-h-[60vh] py-12">
            <div className="relative group">
              <h2 className="text-7xl md:text-9xl font-black text-gray-900 tracking-tighter text-center leading-none transition-all duration-500 group-hover:scale-105">
                HELLO<br/>
                <span className="text-red-700">WORLD</span>
              </h2>
              <div id="status-ready-badge" className="hidden absolute -top-4 -right-4 bg-gray-900 text-white text-[10px] px-3 py-1.5 rounded-lg font-black transform rotate-12 shadow-2xl animate-bounce">
                READY
              </div>
            </div>
            
            <div className="mt-12 flex flex-col items-center">
              <div className="h-1.5 w-32 bg-gray-100 rounded-full mb-6 overflow-hidden">
                <div id="status-progress-bar" className="h-full bg-red-700 w-1/4 transition-all duration-1000"></div>
              </div>
              <p id="status-text" className="text-gray-400 font-mono text-[10px] uppercase tracking-[0.4em] font-black animate-pulse">
                System Standby
              </p>
            </div>
          </div>
        </Shell>
      </div>
    </>
  );
}