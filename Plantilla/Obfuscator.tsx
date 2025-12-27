import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Copy, RefreshCw, KeyRound, ArrowRightLeft, Check, X, Loader2, Database, Shield } from 'lucide-react';
import { crypto, getSystemSLD } from './Parameters';

interface VaultItem { label: string; value: string; }

export const Obfuscator: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
  const [key, setKey] = useState<string>('');
  const [currentSLD, setCurrentSLD] = useState<string>('');
  const [input, setInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [mode, setMode] = useState<'obfuscate' | 'deobfuscate'>('obfuscate');
  const [copied, setCopied] = useState(false);
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [showVault, setShowVault] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const sld = getSystemSLD();
    setCurrentSLD(sld);
    setKey(sld);
    syncVault();
  }, []);

  const syncVault = async () => {
    setIsSyncing(true);
    try {
      const resp = await fetch(`https://docs.google.com/spreadsheets/d/1wJkM8rmiXCrnB0K4h9jtme0m7f5I3y1j1PX5nmEaTII/gviz/tq?tqx=out:csv&sheet=Claves`);
      const text = await resp.text();
      const rows = text.split(/\r?\n/).slice(1);
      const data = rows.map(r => {
        const parts = r.split(',').map(p => p.replace(/"/g, '').trim());
        return { label: parts[0], value: parts[1] };
      }).filter(i => i.value);
      setVaultItems(data);
    } catch (e) { console.error(e); }
    finally { setIsSyncing(false); }
  };

  useEffect(() => {
    if (!input) { setOutput(''); return; }
    setOutput(mode === 'obfuscate' ? crypto.obfuscate(input, key) : crypto.deobfuscate(input, key));
  }, [input, key, mode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className={`bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-100 transition-all duration-500 ease-in-out ${showVault ? 'w-full max-w-4xl' : 'w-full max-w-xl'} max-h-[90vh]`}>
        
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-3 text-gray-900">
            <div className="p-2 bg-red-700 rounded-lg text-white"><Lock size={20} /></div>
            <div>
              <h3 className="font-black uppercase tracking-tighter text-xl leading-tight">Crypto Tool</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">SLD Identity: {currentSLD}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowVault(!showVault)} className={`p-2 rounded-xl transition-all border ${showVault ? 'bg-red-700 text-white shadow-lg' : 'bg-white text-gray-400 hover:text-red-700'}`}><Database size={20} /></button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><X size={24} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          <div className={`p-8 overflow-y-auto space-y-6 custom-scrollbar transition-all duration-500 ${showVault ? 'md:w-1/2' : 'w-full'}`}>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2"><KeyRound size={12} className="text-red-700" /> Clave Dinámica</label>
              <div className="relative">
                <input value={key} onChange={(e) => setKey(e.target.value)} className="w-full bg-gray-50 border p-4 rounded-xl font-mono text-sm outline-none focus:ring-2 focus:ring-gray-900" />
                <button onClick={() => setKey(currentSLD)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-700"><RefreshCw size={14} /></button>
              </div>
            </div>

            <div className="flex justify-between items-center text-gray-900">
              <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                {mode === 'obfuscate' ? <Lock size={12} className="text-red-700" /> : <Unlock size={12} className="text-green-600" />} {mode === 'obfuscate' ? 'Cifrar' : 'Revelar'}
              </h2>
              <button onClick={() => setMode(m => m === 'obfuscate' ? 'deobfuscate' : 'obfuscate')} className="bg-gray-900 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all"><ArrowRightLeft size={12} className="inline mr-1" /> Invertir</button>
            </div>

            <div className="space-y-4">
              <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="..." className="w-full h-32 p-4 bg-white border border-gray-200 rounded-2xl resize-none outline-none text-xs font-mono shadow-inner" />
              <div className="relative">
                <div className="w-full h-32 p-4 bg-gray-50 border rounded-2xl font-mono text-xs break-all overflow-y-auto text-gray-900">{output || '...'}</div>
                {output && !output.includes('Error') && (
                  <button onClick={() => { navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 1000); }} className="absolute bottom-3 right-3 bg-white border p-2 rounded-lg text-[9px] font-black uppercase text-gray-500 hover:text-red-700 transition-all">
                    {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                  </button>
                )}
              </div>
            </div>
          </div>

          {showVault && (
            <div className="md:w-1/2 bg-gray-50 border-l border-gray-100 p-8 overflow-y-auto custom-scrollbar animate-in slide-in-from-right-4">
              <div className="flex items-center justify-between mb-8 text-gray-900 font-black uppercase text-[10px] tracking-widest">
                <div className="flex items-center gap-3"><Shield size={16} className="text-red-700" /> <span>Bóveda Dev</span></div>
                <button onClick={syncVault} className={`text-gray-400 hover:text-red-700 ${isSyncing ? 'animate-spin' : ''}`}><RefreshCw size={14} /></button>
              </div>
              <div className="space-y-4">
                {vaultItems.map((item, i) => (
                  <div key={i} className="bg-white border p-5 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] font-black uppercase text-red-700 bg-red-50 px-3 py-1 rounded-full">{item.label}</span>
                      <button onClick={() => { setMode('deobfuscate'); setInput(item.value); }} className="text-[9px] font-black uppercase text-gray-400 hover:text-black">Cargar</button>
                    </div>
                    <div className="text-[10px] font-mono text-green-700 bg-green-50 p-2 rounded-lg border border-green-100">{crypto.deobfuscate(item.value, key)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 bg-white">
          <button onClick={onClose} className="w-full bg-gray-900 hover:bg-black text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">Cerrar</button>
        </div>
      </div>
    </div>
  );
};