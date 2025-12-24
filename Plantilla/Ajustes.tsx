import React, { useState, useEffect } from 'react';
import { X, Key, ShieldCheck, RefreshCcw, AlertCircle, Eye, EyeOff, Info, ExternalLink, Lock } from 'lucide-react';
import { getShortcutKey } from './Parameters';
import { Obfuscator } from './Obfuscator';

interface AjustesProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onApiKeySave: (key: string) => void;
  userIp: string | null;
}

export const Ajustes: React.FC<AjustesProps> = ({ isOpen, onClose, apiKey, onApiKeySave }) => {
  const [tempKey, setTempKey] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [showApiHelp, setShowApiHelp] = useState(false);
  const [showObfuscator, setShowObfuscator] = useState(false);

  // Detectar entornos autorizados para la Crypto Tool (Desarrollo, Hello o Master)
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isAuthorizedEnvironment = 
    !hostname || 
    hostname === 'localhost' || 
    hostname === 'hello.tligent.com' || 
    hostname === 'master.tligent.com';

  useEffect(() => {
    setTempKey(apiKey);
  }, [apiKey, isOpen]);

  if (!isOpen) return null;

  const handleKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const shortcut = getShortcutKey(tempKey);
    const finalKey = shortcut || tempKey;
    onApiKeySave(finalKey);
    setTempKey(finalKey);
  };

  const clearMemory = () => {
    const confirmMessage = `⚠️ ACCIÓN CRÍTICA: RESET TOTAL DEL SISTEMA\n\nEsta acción borrará PERMANENTEMENTE:\n\n1. Clave API de Gemini.\n2. Estado de autenticación.\n3. Preferencias de cookies y manual.\n\n¿Estás seguro de que deseas limpiar toda la memoria local y reiniciar la aplicación?`;
    
    if (confirm(confirmMessage)) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col border border-gray-100 animate-in zoom-in-95 duration-300">
          
          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-900 rounded-lg text-white">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h3 className="font-black text-gray-900 uppercase tracking-tighter text-xl leading-tight">Panel de Ajustes</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Configuración del Sistema</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-red-700 transition-all active:scale-90"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="p-8 overflow-y-auto space-y-10 custom-scrollbar">
            
            {/* Gemini API Section */}
            <section className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-gray-900">
                  <Key size={18} className="text-red-700" />
                  <h4 className="font-black uppercase text-xs tracking-widest">Gemini API Key</h4>
                  <button 
                    onClick={() => setShowApiHelp(!showApiHelp)}
                    className={`p-1 rounded-full transition-colors ${showApiHelp ? 'bg-red-700 text-white' : 'bg-gray-100 text-gray-400 hover:text-red-700'}`}
                    title="¿Cómo conseguir una API Key?"
                  >
                    <Info size={14} />
                  </button>
                </div>
              </div>

              {showApiHelp && (
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-4 animate-in slide-in-from-top-2 duration-300">
                  <h5 className="font-black text-[10px] uppercase tracking-widest text-gray-900 flex items-center gap-2">
                    Pasos para obtener tu clave:
                  </h5>
                  <ul className="space-y-3">
                    {[
                      { text: 'Accede a Google AI Studio', link: 'https://aistudio.google.com/api-keys' },
                      { text: 'Inicia sesión con tu cuenta de Google.' },
                      { text: 'Haz clic en "Get API key" en el menú lateral.' },
                      { text: 'Crea una clave en un proyecto nuevo o existente.' },
                      { text: 'Copia la clave y pégala en el campo inferior.' }
                    ].map((step, i) => (
                      <li key={i} className="flex items-start gap-3 text-[11px] text-gray-600 leading-tight">
                        <span className="flex-shrink-0 w-4 h-4 rounded-full bg-white border border-gray-200 flex items-center justify-center font-bold text-[8px] text-red-700">
                          {i + 1}
                        </span>
                        <span className="flex-1">
                          {step.text}
                          {step.link && (
                            <a href={step.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 ml-1 text-red-700 hover:underline font-bold">
                              Sitio Web <ExternalLink size={10} />
                            </a>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <form onSubmit={handleKeySubmit} className="space-y-3">
                <div className="relative group">
                  <input 
                    type={showKey ? "text" : "password"} 
                    value={tempKey} 
                    onChange={(e) => setTempKey(e.target.value)} 
                    placeholder="AIzaSy... o atajo (ok/cv)" 
                    className="w-full bg-gray-50 border border-gray-200 p-4 pr-12 rounded-xl text-sm font-mono focus:ring-2 focus:ring-gray-900 outline-none transition-all"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-700 transition-colors p-1"
                  >
                    {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <button 
                  type="submit" 
                  className="w-full bg-gray-900 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-md shadow-gray-100"
                >
                  Guardar API Key
                </button>
              </form>
            </section>

            {/* Obfuscator Tool Section - VISIBLE SOLO EN ENTORNOS AUTORIZADOS */}
            {isAuthorizedEnvironment && (
              <section className="space-y-4 border-t border-gray-50 pt-8">
                <div className="flex items-center gap-2 text-gray-900">
                  <Lock size={18} className="text-red-700" />
                  <h4 className="font-black uppercase text-xs tracking-widest">Crypto Tool</h4>
                </div>
                <button 
                  onClick={() => setShowObfuscator(true)}
                  className="w-full border border-gray-200 hover:border-gray-900 hover:bg-gray-50 p-4 rounded-2xl flex items-center justify-between group transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-red-700 group-hover:text-white transition-colors">
                      <Lock size={16} />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-900">Ofuscador de Datos</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase">Cifra textos con clave maestra</p>
                    </div>
                  </div>
                  <ExternalLink size={14} className="text-gray-300 group-hover:text-red-700 transition-colors" />
                </button>
              </section>
            )}

            {/* System Reset Section */}
            <section className="space-y-4 border-t border-gray-50 pt-8 pb-4">
              <div className="flex items-center gap-2 text-gray-900">
                <RefreshCcw size={18} className="text-red-700" />
                <h4 className="font-black uppercase text-xs tracking-widest">Reset del Sistema</h4>
              </div>
              <div className="bg-red-50 p-6 rounded-3xl border border-red-100 space-y-4">
                <div className="flex items-start gap-3">
                  <AlertCircle size={24} className="text-red-700 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-black text-[11px] uppercase text-red-900 mb-1 tracking-widest">Borrado Total de Memoria</h5>
                    <p className="text-[11px] text-red-800 leading-relaxed font-medium">
                      Al ejecutar el Reset, la aplicación olvidará instantáneamente todos tus datos: la API Key y tu estado de sesión persistente.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={clearMemory}
                  className="w-full bg-red-700 hover:bg-red-800 text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl shadow-red-200 flex items-center justify-center gap-3"
                >
                  <RefreshCcw size={18} />
                  Borrar todos los datos y reiniciar
                </button>
              </div>
            </section>

          </div>

          {/* Footer Modal */}
          <div className="p-6 border-t border-gray-100 bg-white">
            <button 
              onClick={onClose} 
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-[0.98]"
            >
              Cerrar Ajustes
            </button>
          </div>
        </div>
      </div>

      {/* Modal del Ofuscador */}
      {isAuthorizedEnvironment && <Obfuscator isOpen={showObfuscator} onClose={() => setShowObfuscator(false)} />}
    </>
  );
};