import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Copy, RefreshCw, KeyRound, ArrowRightLeft, Check, X } from 'lucide-react';
import { obfuscate, deobfuscate } from './crypto';

interface ObfuscatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Obfuscator: React.FC<ObfuscatorProps> = ({ isOpen, onClose }) => {
  const [key, setKey] = useState<string>('');
  const [currentSLD, setCurrentSLD] = useState<string>('');
  const [input, setInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [mode, setMode] = useState<'obfuscate' | 'deobfuscate'>('obfuscate');
  const [copied, setCopied] = useState(false);

  const getSLDFromHostname = (hostname: string): string => {
    if (!hostname || hostname === 'localhost' || !hostname.includes('.')) {
      return hostname || 'localhost';
    }
    const parts = hostname.split('.');
    // Extraemos el penúltimo segmento (ej: en hello.tligent.com -> tligent)
    if (parts.length >= 2) {
      return parts[parts.length - 2];
    }
    return hostname;
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname || 'localhost';
      const sld = getSLDFromHostname(hostname);
      setCurrentSLD(sld);
      setKey(sld);
    }
  }, []);

  const handleProcess = () => {
    if (!input) {
      setOutput('');
      return;
    }

    if (mode === 'obfuscate') {
      const result = obfuscate(input, key);
      setOutput(result);
    } else {
      const result = deobfuscate(input, key);
      setOutput(result);
    }
    setCopied(false);
  };

  useEffect(() => {
    handleProcess();
  }, [input, key, mode]);

  const copyToClipboard = () => {
    if (!output) return;
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const toggleMode = () => {
    if (output && !output.startsWith('Error:')) {
      setInput(output);
    }
    setMode(prev => prev === 'obfuscate' ? 'deobfuscate' : 'obfuscate');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-100 animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-700 rounded-lg text-white">
              <Lock size={20} />
            </div>
            <div>
              <h3 className="font-black text-gray-900 uppercase tracking-tighter text-xl leading-tight">Crypto Tool</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Algoritmo de Ofuscación</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-red-700 transition-all"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
          {/* Key Input */}
          <div className="space-y-2">
            <label className="flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
              <KeyRound className="w-3 h-3 mr-2 text-red-700" />
              Clave Maestra
            </label>
            <div className="relative">
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 focus:border-red-700 focus:bg-white text-gray-900 p-4 rounded-xl outline-none transition-all font-mono text-sm"
                placeholder="Introduce tu clave..."
              />
              <button 
                onClick={() => setKey(currentSLD)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-700 p-1"
                title="Resetear al SLD"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
              SLD detectado: <span className="font-mono text-red-700">{currentSLD}</span>
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-black uppercase tracking-widest flex items-center text-gray-900">
              {mode === 'obfuscate' ? (
                <>
                  <Lock className="w-4 h-4 mr-2 text-red-700" />
                  Modo: Ofuscar
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4 mr-2 text-green-600" />
                  Modo: Desofuscar
                </>
              )}
            </h2>
            <button
              onClick={toggleMode}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-gray-900 text-white px-4 py-2 rounded-xl hover:bg-black transition-all active:scale-95"
            >
              <ArrowRightLeft className="w-3 h-3" />
              Invertir
            </button>
          </div>

          {/* Input Area */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
              Contenido a {mode === 'obfuscate' ? 'Ofuscar' : 'Revelar'}
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode === 'obfuscate' ? "Escribe el texto secreto aquí..." : "Pega el código ofuscado aquí..."}
              className="w-full h-32 p-4 bg-white border border-gray-200 focus:border-red-700 rounded-2xl resize-none outline-none transition-all font-mono text-xs"
            />
          </div>

          {/* Result Area */}
          <div className="relative space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
              Resultado
            </label>
            <div className={`w-full h-32 p-4 bg-gray-50 border ${output.startsWith('Error:') ? 'border-red-300 bg-red-50 text-red-700' : 'border-gray-100 text-gray-900'} rounded-2xl font-mono text-xs break-all overflow-y-auto`}>
              {output || <span className="text-gray-300 italic">Esperando entrada...</span>}
            </div>

            {output && !output.startsWith('Error:') && (
              <button
                onClick={copyToClipboard}
                className={`absolute bottom-4 right-4 flex items-center px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg transition-all
                  ${copied ? 'bg-green-600 text-white' : 'bg-red-700 text-white hover:bg-red-800'}
                `}
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 mr-2" /> Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 mr-2" /> Copiar Resultado
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-white">
          <button 
            onClick={onClose} 
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all"
          >
            Cerrar Herramienta
          </button>
        </div>
      </div>
    </div>
  );
};
