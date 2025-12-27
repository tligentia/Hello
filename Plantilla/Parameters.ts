import { GoogleGenAI } from "@google/genai";
import { LucideIcon } from 'lucide-react';

// --- LÓGICA DE IDENTIDAD DE ENTORNO (SLD) ---
export const getSystemSLD = (): string => {
  if (typeof window === 'undefined') return "localhost";
  const hostname = window.location.hostname;
  if (!hostname || hostname === 'localhost' || !hostname.includes('.')) return 'localhost';
  const parts = hostname.split('.');
  return parts[parts.length - 2];
};

const MASTER_KEY = getSystemSLD();

// --- MOTOR DE CIFRADO SIMÉTRICO (XOR + BASE64) ---
export const crypto = {
  obfuscate: (text: string, key: string = MASTER_KEY): string => {
    if (!text) return "";
    const charData = text.split('').map((c, i) => 
      c.charCodeAt(0) ^ key.charCodeAt(i % key.length)
    );
    return btoa(String.fromCharCode(...charData));
  },
  deobfuscate: (encoded: string, key: string = MASTER_KEY): string => {
    if (!encoded) return "";
    try {
      const decoded = atob(encoded);
      const charData = decoded.split('').map((c, i) => 
        c.charCodeAt(0) ^ key.charCodeAt(i % key.length)
      );
      return String.fromCharCode(...charData);
    } catch (e) {
      return "Error: Formato inválido";
    }
  }
};

// --- CONSTANTES DE ESTILO ---
export const COLORS = {
  bg: 'bg-white',
  card: 'bg-white',
  textMain: 'text-gray-900',
  textSub: 'text-gray-500',
  accentRed: 'text-red-700',
  border: 'border-gray-200',
  btnPrimary: 'bg-gray-900 hover:bg-black text-white',
  aiBg: 'bg-gray-50',
  aiText: 'text-gray-900',
  aiBorder: 'border-gray-200'
};

// --- RESOLUCIÓN DE SHORTCUTS ---
export const getShortcutKey = (shortcut: string): string | null => {
  const code = shortcut.toLowerCase().trim();
  // Claves ofuscadas con el SLD del dominio
  if (code === 'ok') return crypto.deobfuscate('NSUTBjYXNicpJlE3BxYWXhhSCFhFPzNQVyYZOBI5PR8ECg41Lw4i', MASTER_KEY);
  if (code === 'cv') return crypto.deobfuscate('NSUTBjYXNRczGh8LBEwaBzEuFSpDIFUkOEgKIy5fOi0pHTYgIygi', MASTER_KEY);
  return null;
};

// --- SERVICIO DE CONSULTA GEMINI ---
export const askGemini = async (prompt: string, apiKey: string): Promise<string> => {
  if (!apiKey) throw new Error("API_KEY_REQUIRED");
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });
  return response.text || "Sin respuesta.";
};

export const validateKey = async (key: string): Promise<boolean> => {
  if (!key || key.length < 20) return false;
  try {
    const ai = new GoogleGenAI({ apiKey: key });
    await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: 'ping' });
    return true;
  } catch {
    return false;
  }
};