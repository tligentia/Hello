import React, { useState, useEffect } from 'react';
import { X, Key, ShieldCheck, RefreshCcw, AlertCircle, Eye, EyeOff, Info, ExternalLink, Lock, Database, Loader2, CheckCircle2, XCircle, Sparkles, Send, MessageSquare } from 'lucide-react';
import { getShortcutKey, getSystemSLD, crypto, validateKey, askGemini } from './Parameters';
import { Obfuscator } from './Obfuscator';

interface VaultItem { label: string; value: string; }

interface AjustesProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onApiKeySave: (key: string) => void;
  userIp: string | null;
}

const SHEET_ID = '1wJkM8rmiXCrnB0K4h9jtme0m7f5I3y1j1PX5nmEaTII';
const VAULT_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Claves`;

export const Ajustes: React.FC<AjustesProps> = ({ isOpen, onClose, apiKey, onApiKeySave }) => {
  const [tempKey, setTempKey] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [showApiHelp, setShowApiHelp] = useState(false);
  const [showObfuscator, setShowObfuscator] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isValidating, setIsValidating] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const MASTER_KEY = getSystemSLD();
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  
  // CONDICIÓN DE VISIBILIDAD DE HERRAMIENTAS DE DESARROLLO RESTRINGIDA A LA APP ESPECÍFICA
  const isAuthorized = !hostname || hostname === 'localhost' || hostname === 'hello.tligent.com';

  const syncVault = async () => {
    if (!isOpen) return;
    setIsSyncing(true);
    try {
      const resp = await fetch(VAULT_CSV_URL);
      const text = await resp.text();
      const rows = text.split(/\r?\n/).slice(1);
      const data = rows.map(r => {
        const parts = r.split(',').map(p => p.replace(/"/g, '').trim());
        return { label: parts[0], value: parts[1] };
      }).filter(i => i.value);
      setVaultItems(data);
    } catch (e) { console.error("Vault Error", e); }
    finally { setIsSyncing(false); }
  };

  useEffect(() => {
    if (isOpen) {
      setTempKey(apiKey);
      setStatus(apiKey ? 'success' : 'idle');
      syncVault();
    }
  }, [apiKey, isOpen]);

  const handleKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = tempKey.trim();
    if (!input) { onApiKeySave(''); setStatus('idle'); return; }

    setIsValidating(true);
    let resolved = input;
    
    const vaultMatch = vaultItems.find(v => v.label.toLowerCase() === input.toLowerCase());
    if (vaultMatch) {
      resolved = crypto.deobfuscate(vaultMatch.value, MASTER_KEY);
    } else {
      const sc = getShortcutKey(input);
      if (sc) resolved = sc;
    }

    const ok = await validateKey(resolved);
    if (ok) {
      onApiKeySave(resolved);
      setTempKey(resolved);
      setStatus('success');
    } else {
      setStatus('error');
    }
    setIsValidating(false);
  };

  const handleAiAsk = async () => {
    if (!aiQuestion.trim() || isAsking) return;
    setIsAsking(true);
    try {
      const ans = await askGemini(aiQuestion, apiKey);
      setAiAnswer(ans);
    } catch (e: any) {
      setAiAnswer(`Error: ${e.message}`);
    } finally { setIsAsking(false); }
  };

  const inputBg = status === 'success' ? 'bg-green-50 border-green-200' : status === 'error' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200';

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
          {/* SECCIÓN 1: API KEY */}
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-gray-900 font-black uppercase text-xs tracking-widest">
                <Key size={18} className="text-red-700" /> <span>Gemini API Key</span>
                {isSyncing && <Loader2 size={12} className="animate-spin text-red-700" />}
              </div>
              {status === 'success' && <span className="text-[9px] font-black text-green-600 uppercase flex items-center gap-1"><CheckCircle2 size={10}/> OK</span>}
              {status === 'error' && <span className="text-[9px] font-black text-red-600 uppercase flex items-center gap-1"><XCircle size={10}/> Error</span>}
            </div>

            <form onSubmit={handleKeySubmit} className="space-y-3">
              <div className="relative">
                <input 
                  type={showKey ? "text" : "password"} 
                  value={tempKey} 
                  onChange={(e) => { setTempKey(e.target.value); setStatus('idle'); }} 
                  placeholder="Introduce Key o Código..." 
                  className={`w-full border p-4 pr-12 rounded-xl text-sm font-mono outline-none transition-all focus:ring-2 focus:ring-gray-900 ${inputBg}`}
                  disabled={isValidating}
                />
                <button type="button" onClick={() => setShowKey(!showKey)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-700">
                  {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <button type="submit" disabled={isValidating} className="w-full bg-gray-900 hover:bg-black text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                {isValidating ? <Loader2 size={14} className="animate-spin" /> : 'Validar Acceso'}
              </button>
            </form>
          </section>

          {/* SECCIÓN 2: CRYPTO TOOL (MOVIDA ARRIBA) */}
          {isAuthorized && (
            <section className="space-y-4 border-t border-gray-50 pt-8">
              <div className="flex items-center gap-2 text-gray-900 font-black uppercase text-xs tracking-widest mb-2">
                <Lock size={18} className="text-red-700" /> <span>Herramientas Dev</span>
              </div>
              <button onClick={() => setShowObfuscator(true)} className="w-full border border-gray-200 hover:border-gray-900 p-4 rounded-2xl flex items-center justify-between group transition-all bg-white hover:shadow-md">
                <div className="flex items-center gap-3 font-black uppercase text-[10px] tracking-widest">
                  <Database size={16} className="text-gray-400 group-hover:text-red-700" /> <span>Crypto Tool (XOR)</span>
                </div>
                <ExternalLink size={14} className="text-gray-300 group-hover:text-red-700" />
              </button>
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
              <button onClick={handleAiAsk} disabled={!apiKey || isAsking} className="absolute bottom-3 right-3 p-2 bg-gray-900 text-white rounded-lg hover:bg-black disabled:opacity-20 transition-all">
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