
import React, { useState, useEffect } from 'react';
import { getAllowedIps } from './Plantilla/Parameters';
import { Security } from './Plantilla/Seguridad';
import { Shell } from './Plantilla/Shell';

export default function App() {
  // Memorizar el estado de autenticación para no pedir PIN en cada recarga si ya fue exitosa
  const [isAuth, setIsAuth] = useState(() => {
    // Si no hay hostname (entorno local/dev extremo), autorizar automáticamente
    const isDevMode = typeof window !== 'undefined' && !window.location.hostname;
    return isDevMode || localStorage.getItem('app_is_auth') === 'true';
  });
  
  const [userIp, setUserIp] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('app_apikey') || '');

  useEffect(() => {
    // 1. Comprobar si estamos en modo desarrollo por hostname vacío
    const hostname = window.location.hostname;
    if (!hostname) {
      console.log("Sistema: Modo Desarrollo detectado (hostname vacío). Acceso concedido.");
      handleLoginSuccess();
    }

    // 2. Obtener IP del usuario y auto-login por IP autorizada
    fetch('https://api.ipify.org?format=json')
      .then(r => r.json())
      .then(data => {
        setUserIp(data.ip);
        // Auto-login si la IP está en la lista blanca dinámica memorizada
        if (getAllowedIps().includes(data.ip)) {
          handleLoginSuccess();
        }
      })
      .catch(e => console.error("Error validando acceso IP:", e));
  }, []);

  const handleLoginSuccess = () => {
    setIsAuth(true);
    localStorage.setItem('app_is_auth', 'true');
  };

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('app_apikey', key);
  };

  return (
    <>
      {/* Pantalla de bloqueo - Solo si no está autenticado ni por IP ni por PIN ni por Hostname vacío */}
      {!isAuth && <Security onLogin={handleLoginSuccess} />}
      
      {/* Contenido principal con desenfoque si no hay acceso */}
      <div className={!isAuth ? 'blur-md pointer-events-none select-none opacity-50' : 'animate-in fade-in duration-700'}>
        <Shell apiKey={apiKey} onApiKeySave={saveApiKey} userIp={userIp}>
          <div className="flex flex-col items-center justify-center min-h-[55vh]">
            <div className="relative group">
              <h2 className="text-7xl md:text-9xl font-black text-gray-900 tracking-tighter text-center leading-none group-hover:scale-105 transition-transform duration-500">
                HELLO<br/>
                <span className="text-red-700">WORLD</span>
              </h2>
              <div className="absolute -top-4 -right-4 bg-gray-900 text-white text-[10px] px-3 py-1.5 rounded-lg font-black transform rotate-12 shadow-2xl animate-bounce">
                READY
              </div>
            </div>
            
            <div className="mt-12 flex flex-col items-center">
              <div className="h-1.5 w-32 bg-gray-900 rounded-full mb-6 overflow-hidden">
                <div className="h-full bg-red-700 w-1/2 animate-[slide_2s_infinite]"></div>
              </div>
              <p className="text-gray-400 font-mono text-[10px] uppercase tracking-[0.4em] font-black animate-pulse">
                System Active & Persistent
              </p>
              <div className="flex gap-4 mt-8">
                 <div className="w-2.5 h-2.5 rounded-full bg-red-700 animate-ping"></div>
                 <div className="w-2.5 h-2.5 rounded-full bg-gray-900"></div>
                 <div className="w-2.5 h-2.5 rounded-full bg-gray-200"></div>
              </div>
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
