import React, { useState, useEffect } from 'react';
import { X, Key, ShieldCheck, RefreshCcw, AlertCircle, Eye, EyeOff, Info, ExternalLink, Lock, Database, Loader2 } from 'lucide-react';
import { getShortcutKey } from './Parameters';
import { Obfuscator } from './Obfuscator';
import { deobfuscate } from './crypto';

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
const SYSTEM_CRYPTO_KEY = "TLIGENT_CORE_v25";

export const Ajustes: React.FC<AjustesProps> = ({ isOpen, onClose, apiKey, onApiKeySave }) => {
  const [tempKey, setTempKey] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [showApiHelp, setShowApiHelp] = useState(false);
  const [showObfuscator, setShowObfuscator] = useState(false);
  
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

  /**
   * syncDevelopmentVault: Recupera las claves de desarrollo desde la nube.
   */
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
      syncDevelopmentVault();
    }
  }, [apiKey, isOpen]);

  const handleKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = tempKey.toLowerCase().trim();
    
    // 1. Intentar resolver mediante la Bóveda de Desarrollo (Sheets)
    if (cleanInput === 'ok' || cleanInput === 'cv') {
      const vaultMatch = vaultItems.find(item => item.label.toLowerCase().trim() === cleanInput);
      if (vaultMatch) {
        const resolvedKey = deobfuscate(vaultMatch.value, SYSTEM_CRYPTO_KEY);
        if (!resolvedKey.startsWith('Error:')) {
          onApiKeySave(resolvedKey);
          setTempKey(resolvedKey);
          return;
        }
      }
    }

    // 2. Fallback: Lógica de Shortcut local (hardcoded en Parameters.ts) o entrada manual
    const shortcut = getShortcutKey(tempKey);
    const finalKey = shortcut || tempKey;
    onApiKeySave(finalKey);
    setTempKey(finalKey);
  };

  const clearMemory = () => {
    const confirmMessage = `⚠️ ACCIÓN CRÍTICA: RESET TOTAL DEL SISTEMA\n\n¿Estás seguro de que deseas limpiar toda la memoria local?`;
    if (confirm(confirmMessage)) {
      localStorage.clear();
      window.location.reload();
    }
  };

  if (!isOpen) return null;

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
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Configuración Maestra</p>
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
                  <div className="flex items-center gap-2">
                    {isSyncing && <Loader2 size={12} className="animate-spin text-red-700" />}
                    <button 
                      onClick={() => setShowApiHelp(!showApiHelp)}
                      className={`p-1 rounded-full transition-colors ${showApiHelp ? 'bg-red-700 text-white' : 'bg-gray-100 text-gray-400 hover:text-red-700'}`}
                    >
                      <Info size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {showApiHelp && (
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-3 animate-in slide-in-from-top-2 duration-300">
                   <p className="text-[11px] text-gray-600 leading-tight">
                     Introduce tu API Key de <a href="https://aistudio.google.com/api-keys" target="_blank" className="text-red-700 font-bold hover:underline">Google AI Studio</a> o utiliza los códigos dinámicos <span className="font-bold text-gray-900">OK</span> o <span className="font-bold text-gray-900">CV</span> si están configurados en la bóveda.
                   </p>
                </div>
              )}

              <form onSubmit={handleKeySubmit} className="space-y-3">
                <div className="relative group">
                  <input 
                    type={showKey ? "text" : "password"} 
                    value={tempKey} 
                    onChange={(e) => setTempKey(e.target.value)} 
                    placeholder="AIzaSy... o Código Maestro" 
                    className="w-full bg-gray-50 border border-gray-200 p-4 pr-12 rounded-xl text-sm font-mono focus:ring-2 focus:ring-gray-900 outline-none transition-all"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-700 p-1"
                  >
                    {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <button 
                  type="submit" 
                  className="w-full bg-gray-900 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-md active:scale-[0.98]"
                >
                  Validar Acceso
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
                <button 
                  onClick={() => setShowObfuscator(true)}
                  className="w-full border border-gray-200 hover:border-gray-900 hover:bg-gray-50 p-4 rounded-2xl flex items-center justify-between group transition-all"
                >
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
            <button 
              onClick={onClose} 
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all"
            >
              Cerrar Ajustes
            </button>
          </div>
        </div>
      </div>

      {isAuthorizedEnvironment && <Obfuscator isOpen={showObfuscator} onClose={() => setShowObfuscator(false)} />}
    </>
  );
};
