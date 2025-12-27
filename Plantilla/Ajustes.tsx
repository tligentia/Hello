import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, RefreshCcw, ExternalLink, Lock, Database, Loader2, CheckCircle2, XCircle, Sparkles, Send, Table, Cpu, ChevronDown } from 'lucide-react';
import { getSystemSLD, validateKey, askGemini, listAvailableModels } from './Parameters';
import { Obfuscator } from './Obfuscator';

interface AjustesProps {
  isOpen: boolean;
  onClose: () => void;
  userIp: string | null;
}

const SHEET_ID = '1wJkM8rmiXCrnB0K4h9jtme0m7f5I3y1j1PX5nmEaTII';

export const Ajustes: React.FC<AjustesProps> = ({ isOpen, onClose }) => {
  const [showObfuscator, setShowObfuscator] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isValidating, setIsValidating] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  
  // Gestión de Modelos
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState(localStorage.getItem('app_selected_model') || 'gemini-3-flash-preview');
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  const MASTER_KEY = getSystemSLD();
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isAuthorized = !hostname || hostname === 'localhost' || hostname === 'hello.tligent.com';

  const loadModels = async () => {
    setIsLoadingModels(true);
    try {
      const models = await listAvailableModels();
      setAvailableModels(models);
    } catch (e) {
      console.error("Error loading models", e);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleConfigCheck = async () => {
    setIsValidating(true);
    const ok = await validateKey();
    setStatus(ok ? 'success' : 'error');
    if (ok) await loadModels();
    setIsValidating(false);
  };

  useEffect(() => {
    if (isOpen) {
      handleConfigCheck();
    }
  }, [isOpen]);

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = e.target.value;
    setSelectedModel(newModel);
    localStorage.setItem('app_selected_model', newModel);
  };

  const handleAiAsk = async () => {
    if (!aiQuestion.trim() || isAsking) return;
    setIsAsking(true);
    try {
      const ans = await askGemini(aiQuestion, selectedModel);
      setAiAnswer(ans);
    } catch (e: any) {
      setAiAnswer(`Error: ${e.message}`);
    } finally { setIsAsking(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col border border-gray-100 animate-in zoom-in-95">
        
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-900 rounded-lg text-white"><ShieldCheck size={24} /></div>
            <div>
              <h3 className="font-black uppercase tracking-tighter text-xl leading-tight">Ajustes</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Core Identity: {MASTER_KEY}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-all"><X size={24} /></button>
        </div>

        <div className="p-8 overflow-y-auto space-y-10 custom-scrollbar">
          
          {/* SECCIÓN 0: MOTOR DE IA */}
          <section className="space-y-4">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-900 font-black uppercase text-xs tracking-widest">
                  <Cpu size={18} className="text-red-700" /> <span>Motor Inteligente</span>
                </div>
                {isLoadingModels && <Loader2 size={12} className="animate-spin text-gray-400" />}
             </div>
             
             <div className="relative group">
               <select 
                 value={selectedModel}
                 onChange={handleModelChange}
                 disabled={isLoadingModels}
                 className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-xs font-bold uppercase tracking-wider appearance-none focus:ring-2 focus:ring-gray-900 outline-none transition-all cursor-pointer disabled:opacity-50"
               >
                 {availableModels.length > 0 ? (
                   availableModels.map(m => (
                     <option key={m} value={m}>{m}</option>
                   ))
                 ) : (
                   <option value={selectedModel}>{selectedModel} (Default)</option>
                 )}
               </select>
               <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-red-700 transition-colors">
                  <ChevronDown size={16} />
               </div>
             </div>
          </section>

          {/* SECCIÓN 1: ESTADO DE SISTEMA */}
          <section className="space-y-4 border-t border-gray-50 pt-8">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-gray-900 font-black uppercase text-xs tracking-widest">
                <ShieldCheck size={18} className="text-red-700" /> <span>Conectividad API</span>
              </div>
              {status === 'success' && <span className="text-[9px] font-black text-green-600 uppercase flex items-center gap-1"><CheckCircle2 size={10}/> Sistema Listo</span>}
              {status === 'error' && <span className="text-[9px] font-black text-red-600 uppercase flex items-center gap-1"><XCircle size={10}/> Error de Configuración</span>}
              {status === 'idle' && <span className="text-[9px] font-black text-gray-400 uppercase">Verificando...</span>}
            </div>

            <p className="text-[9px] text-gray-400 uppercase text-center font-bold px-4">
              La API Key se obtiene exclusivamente de variables de entorno. Asegúrate de que el sistema base esté configurado.
            </p>

            <button 
              onClick={handleConfigCheck} 
              disabled={isValidating} 
              className="w-full bg-gray-900 hover:bg-black text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
            >
              {isValidating ? <Loader2 size={14} className="animate-spin" /> : 'Refrescar Conexión'}
            </button>
          </section>

          {/* SECCIÓN 2: HERRAMIENTAS DEV */}
          {isAuthorized && (
            <section className="space-y-4 border-t border-gray-50 pt-8">
              <div className="flex items-center gap-2 text-gray-900 font-black uppercase text-xs tracking-widest mb-2">
                <Lock size={18} className="text-red-700" /> <span>Herramientas Dev</span>
              </div>
              <div className="space-y-3">
                <button onClick={() => setShowObfuscator(true)} className="w-full border border-gray-200 hover:border-gray-900 p-4 rounded-2xl flex items-center justify-between group transition-all bg-white hover:shadow-md">
                  <div className="flex items-center gap-3 font-black uppercase text-[10px] tracking-widest">
                    <Database size={16} className="text-gray-400 group-hover:text-red-700" /> <span>Crypto Tool</span>
                  </div>
                  <ExternalLink size={14} className="text-gray-300 group-hover:text-red-700" />
                </button>
                
                <button 
                  onClick={() => window.open(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`, '_blank')}
                  className="w-full border border-gray-200 hover:border-gray-900 p-4 rounded-2xl flex items-center justify-between group transition-all bg-white hover:shadow-md"
                >
                  <div className="flex items-center gap-3 font-black uppercase text-[10px] tracking-widest">
                    <Table size={16} className="text-gray-400 group-hover:text-red-700" /> <span>Panel Control (Sheets)</span>
                  </div>
                  <ExternalLink size={14} className="text-gray-300 group-hover:text-red-700" />
                </button>
              </div>
            </section>
          )}

          {/* SECCIÓN 3: CONSULTA IA */}
          <section className="space-y-4 border-t border-gray-50 pt-8">
            <div className="flex items-center gap-2 text-gray-900 font-black uppercase text-xs tracking-widest">
              <Sparkles size={18} className="text-red-700" /> <span>Consulta IA</span>
            </div>
            <div className="relative">
              <textarea 
                value={aiQuestion} onChange={(e) => setAiQuestion(e.target.value)}
                placeholder="Pregunta algo al sistema..."
                className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-xs font-medium focus:ring-2 focus:ring-gray-900 outline-none h-24 resize-none"
              />
              <button onClick={handleAiAsk} disabled={isAsking} className="absolute bottom-3 right-3 p-2 bg-gray-900 text-white rounded-lg hover:bg-black disabled:opacity-20 transition-all">
                {isAsking ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
            {aiAnswer && (
              <div className="bg-gray-50 border-l-4 border-red-700 p-4 rounded-r-xl animate-in slide-in-from-left-2">
                <p className="text-[11px] text-gray-700 leading-relaxed font-medium">{aiAnswer}</p>
              </div>
            )}
          </section>

          {/* SECCIÓN 4: ACCIONES DE SISTEMA */}
          <section className="space-y-4 border-t border-gray-50 pt-8 pb-4">
            <button onClick={() => { if(confirm("¿Reset total de la memoria local?")) { localStorage.clear(); window.location.reload(); }}} className="w-full bg-red-50 hover:bg-red-100 text-red-700 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3">
              <RefreshCcw size={16} /> Reset Memory
            </button>
          </section>
        </div>

        <div className="p-6 border-t border-gray-100 bg-white">
          <button onClick={onClose} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">Cerrar</button>
        </div>
      </div>
      {isAuthorized && <Obfuscator isOpen={showObfuscator} onClose={() => setShowObfuscator(false)} />}
    </div>
  );
};