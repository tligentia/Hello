import React, { useState, useEffect } from 'react';
import { X, Key, ShieldCheck, RefreshCcw, AlertCircle, Eye, EyeOff, Info, ExternalLink, Lock, Database, Loader2, CheckCircle2, XCircle, Sparkles, Send, MessageSquare } from 'lucide-react';
import { getShortcutKey } from './Parameters';
import { Obfuscator } from './Obfuscator';
import { deobfuscate } from './crypto';
import { GoogleGenAI } from "@google/genai";

interface VaultItem {
  label: string;
  value: string;
}

interface AjustesProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onApiKeySave: (key: string) => void;
  userIp: string | null;
}

const SHEET_ID = '1wJkM8rmiXCrnB0K4h9jtme0m7f5I3y1j1PX5nmEaTII';
const VAULT_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Claves`;

// Función para obtener el SLD del dominio actual
const getSystemSLD = (): string => {
  if (typeof window === 'undefined') return "localhost";
  const hostname = window.location.hostname;
  if (!hostname || hostname === 'localhost' || !hostname.includes('.')) return 'localhost';
  const parts = hostname.split('.');
  return parts[parts.length - 2];
};

const SYSTEM_CRYPTO_KEY = getSystemSLD();

export const Ajustes: React.FC<AjustesProps> = ({ isOpen, onClose, apiKey, onApiKeySave }) => {
  const [tempKey, setTempKey] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [showApiHelp, setShowApiHelp] = useState(false);
  const [showObfuscator, setShowObfuscator] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isValidating, setIsValidating] = useState(false);
  
  // Estados para la consulta IA
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  
  // Estado para la bóveda de claves sincronizada
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isAuthorizedEnvironment = 
    !hostname || 
    hostname === 'localhost' || 
    hostname === 'hello.tligent.com' || 
    hostname === 'master.tligent.com';

  const parseCSVLine = (line: string): string[] => {
    const columns: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') inQuotes = !inQuotes;
      else if (char === ',' && !inQuotes) {
        columns.push(current.trim());
        current = '';
      } else current += char;
    }
    columns.push(current.trim());
    return columns.map(col => col.replace(/^"|"$/g, '').trim());
  };

  const syncDevelopmentVault = async () => {
    if (!isOpen) return;
    setIsSyncing(true);
    try {
      const response = await fetch(VAULT_CSV_URL);
      if (!response.ok) throw new Error('Cloud Vault Unreachable');
      const text = await response.text();
      const rows = text.split(/\r?\n/).filter(line => line.trim() !== '');
      
      const data = rows.slice(1).map((row, index) => {
        const cols = parseCSVLine(row);
        return {
          label: cols[0] || `Dev Key ${index + 1}`,
          value: cols[1] || ''
        };
      }).filter(item => item.value);
      
      setVaultItems(data);
    } catch (error) {
      console.error('Error syncing development vault in Ajustes:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setTempKey(apiKey);
      setStatus(apiKey ? 'success' : 'idle');
      syncDevelopmentVault();
    }
  }, [apiKey, isOpen]);

  const testApiKey = async (key: string): Promise<boolean> => {
    if (!key || key.length < 20) return false;
    try {
      const ai = new GoogleGenAI({ apiKey: key });
      await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: 'ping',
      });
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isValidating) return;

    const cleanInput = tempKey.trim();
    if (!cleanInput) {
      onApiKeySave('');
      setStatus('idle');
      return;
    }

    setIsValidating(true);
    setStatus('idle');

    let keyToTest = cleanInput;
    const cleanInputLower = cleanInput.toLowerCase();
    
    if (cleanInputLower === 'ok' || cleanInputLower === 'cv') {
      const vaultMatch = vaultItems.find(item => item.label.toLowerCase().trim() === cleanInputLower);
      if (vaultMatch) {
        const resolved = deobfuscate(vaultMatch.value, SYSTEM_CRYPTO_KEY);
        if (!resolved.startsWith('Error:')) keyToTest = resolved;
      }
    } else {
      const shortcut = getShortcutKey(cleanInput);
      if (shortcut) keyToTest = shortcut;
    }

    const isValid = await testApiKey(keyToTest);
    if (isValid) {
      onApiKeySave(keyToTest);
      setTempKey(keyToTest);
      setStatus('success');
    } else {
      setStatus('error');
    }
    setIsValidating(false);
  };

  const handleAiAsk = async () => {
    if (!aiQuestion.trim() || !apiKey || isAsking) return;
    setIsAsking(true);
    setAiAnswer('');
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: aiQuestion,
      });
      setAiAnswer(response.text || "Sin respuesta.");
    } catch (error: any) {
      setAiAnswer(`Error: ${error.message || 'No se pudo procesar la consulta.'}`);
    } finally {
      setIsAsking(false);
    }
  };

  const handleInputChange = (val: string) => {
    setTempKey(val);
    if (status !== 'idle') setStatus('idle');
  };

  const clearMemory = () => {
    const confirmMessage = `⚠️ ACCIÓN CRÍTICA: RESET TOTAL DEL SISTEMA\n\n¿Estás seguro de que deseas limpiar toda la memoria local?`;
    if (confirm(confirmMessage)) {
      localStorage.clear();
      window.location.reload();
    }
  };

  if (!isOpen) return null;

  const inputBgClass = status === 'success' 
    ? 'bg-green-50 border-green-200 focus:ring-green-500' 
    : status === 'error' 
    ? 'bg-red-50 border-red-200 focus:ring-red-500' 
    : 'bg-gray-50 border-gray-200 focus:ring-gray-900';

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
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Configuración Maestra ({SYSTEM_CRYPTO_KEY})</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-red-700 transition-all active:scale-90">
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
                  <div className="flex items-center gap-2">
                    {isSyncing && <Loader2 size={12} className="animate-spin text-red-700" />}
                    <button onClick={() => setShowApiHelp(!showApiHelp)} className={`p-1 rounded-full transition-colors ${showApiHelp ? 'bg-red-700 text-white' : 'bg-gray-100 text-gray-400 hover:text-red-700'}`}>
                      <Info size={14} />
                    </button>
                  </div>
                </div>
                {status === 'success' && <span className="text-[9px] font-black text-green-600 uppercase tracking-widest flex items-center gap-1"><CheckCircle2 size={10}/> Verificada</span>}
                {status === 'error' && <span className="text-[9px] font-black text-red-600 uppercase tracking-widest flex items-center gap-1"><XCircle size={10}/> Inválida</span>}
              </div>

              <form onSubmit={handleKeySubmit} className="space-y-3">
                <div className="relative group">
                  <input 
                    type={showKey ? "text" : "password"} 
                    value={tempKey} 
                    onChange={(e) => handleInputChange(e.target.value)} 
                    placeholder="AIzaSy... o Código Maestro" 
                    className={`w-full border p-4 pr-12 rounded-xl text-sm font-mono outline-none transition-all duration-300 focus:ring-2 ${inputBgClass}`}
                    disabled={isValidating}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {isValidating && <Loader2 size={18} className="animate-spin text-red-700" />}
                    <button type="button" onClick={() => setShowKey(!showKey)} className="text-gray-400 hover:text-red-700 p-1">
                      {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={isValidating} className={`w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 ${isValidating ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-900 hover:bg-black text-white'}`}>
                  {isValidating ? 'Comprobando...' : 'Validar Acceso'}
                </button>
              </form>
            </section>

            {/* Obfuscator Tool Section */}
            {isAuthorizedEnvironment && (
              <section className="space-y-4 border-t border-gray-50 pt-8">
                <div className="flex items-center gap-2 text-gray-900">
                  <Lock size={18} className="text-red-700" />
                  <h4 className="font-black uppercase text-xs tracking-widest">Crypto Tool</h4>
                </div>
                <button onClick={() => setShowObfuscator(true)} className="w-full border border-gray-200 hover:border-gray-900 hover:bg-gray-50 p-4 rounded-2xl flex items-center justify-between group transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-red-700 group-hover:text-white transition-colors">
                      <Database size={16} />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-900">Gestión de Claves</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase">Sincronizar Bóveda en la Nube</p>
                    </div>
                  </div>
                  <ExternalLink size={14} className="text-gray-300 group-hover:text-red-700 transition-colors" />
                </button>
              </section>
            )}

            {/* AI Question Box */}
            <section className="space-y-4 border-t border-gray-50 pt-8">
              <div className="flex items-center gap-2 text-gray-900">
                <Sparkles size={18} className="text-red-700" />
                <h4 className="font-black uppercase text-xs tracking-widest">Consulta Express IA</h4>
              </div>
              <div className="space-y-3">
                <div className="relative">
                  <textarea 
                    value={aiQuestion}
                    onChange={(e) => setAiQuestion(e.target.value)}
                    placeholder="Haz una pregunta técnica o de sistema..."
                    className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-xs font-medium focus:ring-2 focus:ring-gray-900 outline-none transition-all resize-none h-24"
                    disabled={!apiKey || isAsking}
                  />
                  <button 
                    onClick={handleAiAsk}
                    disabled={!apiKey || !aiQuestion.trim() || isAsking}
                    className="absolute bottom-3 right-3 p-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-all disabled:opacity-20 active:scale-90"
                  >
                    {isAsking ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </div>
                
                {aiAnswer && (
                  <div className="bg-gray-50 border-l-4 border-red-700 p-4 rounded-r-xl animate-in slide-in-from-left-2 duration-300">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare size={12} className="text-red-700" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 text-gray-900">Respuesta Gemini</span>
                    </div>
                    <p className="text-[11px] text-gray-700 leading-relaxed font-medium">
                      {aiAnswer}
                    </p>
                  </div>
                )}
                
                {!apiKey && (
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight flex items-center gap-1.5">
                    <AlertCircle size={10} /> Configura una API Key para habilitar la IA
                  </p>
                )}
              </div>
            </section>

            {/* System Reset Section */}
            <section className="space-y-4 border-t border-gray-50 pt-8 pb-4">
              <button 
                onClick={clearMemory}
                className="w-full bg-red-50 hover:bg-red-100 text-red-700 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all border border-red-100 flex items-center justify-center gap-3"
              >
                <RefreshCcw size={16} />
                Borrar Datos del Sistema
              </button>
            </section>

          </div>

          {/* Footer Modal */}
          <div className="p-6 border-t border-gray-100 bg-white">
            <button onClick={onClose} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all">
              Cerrar Ajustes
            </button>
          </div>
        </div>
      </div>

      {isAuthorizedEnvironment && <Obfuscator isOpen={showObfuscator} onClose={() => setShowObfuscator(false)} />}
    </>
  );
};