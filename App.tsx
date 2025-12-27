import React, { useState, useEffect } from 'react';
import { Security } from './Plantilla/Seguridad';
import { Cabecera } from './Plantilla/Cabecera';

export default function App() {
  const [isAuth, setIsAuth] = useState(() => {
    if (typeof window === 'undefined') return false;
    const isDevMode = !window.location.hostname || window.location.hostname === 'localhost';
    return isDevMode || localStorage.getItem('app_is_auth_v2') === 'true';
  });
  
  const [apiKey, setApiKey] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('app_apikey') || '';
  });

  const [userIp, setUserIp] = useState<string | null>(null);

  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setUserIp(data.ip))
      .catch(() => setUserIp('IP no disponible'));
  }, []);

  const handleLoginSuccess = () => {
    setIsAuth(true);
    localStorage.setItem('app_is_auth_v2', 'true');
  };

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('app_apikey', key);
  };

  return (
    <>
      {!isAuth && <Security onLogin={handleLoginSuccess} />}
      
      <div className={!isAuth ? 'blur-md pointer-events-none select-none opacity-50' : 'animate-in fade-in duration-700'}>
        <Cabecera apiKey={apiKey} onApiKeySave={saveApiKey} userIp={userIp}>
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
        </Cabecera>
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